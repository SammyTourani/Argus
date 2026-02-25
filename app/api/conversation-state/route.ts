import { NextRequest, NextResponse } from 'next/server';
import type { ConversationState } from '@/types/conversation';
import { createClient } from '@/lib/supabase/server';
import {
  getConversationState,
  setConversationState,
  clearConversationState,
} from '@/lib/conversation/per-user-state';

// ── Auth helper ──────────────────────────────────────────────────────────────
async function authenticateUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

// GET: Retrieve current conversation state
export async function GET() {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const state = getConversationState(user.id);

    // If the state was just freshly created (no messages yet), treat as "no active conversation"
    if (state.context.messages.length === 0 && state.context.edits.length === 0) {
      return NextResponse.json({
        success: true,
        state: null,
        message: 'No active conversation'
      });
    }

    return NextResponse.json({
      success: true,
      state
    });
  } catch (error) {
    console.error('[conversation-state] Error getting state:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

// POST: Reset or update conversation state
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { action, data } = await request.json();

    switch (action) {
      case 'reset': {
        const freshState: ConversationState = {
          conversationId: `conv-${Date.now()}`,
          startedAt: Date.now(),
          lastUpdated: Date.now(),
          context: {
            messages: [],
            edits: [],
            projectEvolution: { majorChanges: [] },
            userPreferences: {}
          }
        };
        setConversationState(user.id, freshState);

        console.log('[conversation-state] Reset conversation state for user', user.id);

        return NextResponse.json({
          success: true,
          message: 'Conversation state reset',
          state: freshState
        });
      }

      case 'clear-old': {
        const state = getConversationState(user.id);

        if (state.context.messages.length === 0 && state.context.edits.length === 0) {
          console.log('[conversation-state] Initialized new conversation state for clear-old');
          return NextResponse.json({
            success: true,
            message: 'New conversation state initialized',
            state
          });
        }

        // Keep only recent data
        state.context.messages = state.context.messages.slice(-5);
        state.context.edits = state.context.edits.slice(-3);
        state.context.projectEvolution.majorChanges =
          state.context.projectEvolution.majorChanges.slice(-2);

        console.log('[conversation-state] Cleared old conversation data for user', user.id);

        return NextResponse.json({
          success: true,
          message: 'Old conversation data cleared',
          state
        });
      }

      case 'update': {
        const state = getConversationState(user.id);

        if (state.context.messages.length === 0 && state.context.edits.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'No active conversation to update'
          }, { status: 400 });
        }

        // Update specific fields if provided
        if (data) {
          if (data.currentTopic) {
            state.context.currentTopic = data.currentTopic;
          }
          if (data.userPreferences) {
            state.context.userPreferences = {
              ...state.context.userPreferences,
              ...data.userPreferences
            };
          }

          state.lastUpdated = Date.now();
        }

        return NextResponse.json({
          success: true,
          message: 'Conversation state updated',
          state
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use "reset" or "update"'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('[conversation-state] Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}

// DELETE: Clear conversation state
export async function DELETE() {
  try {
    const user = await authenticateUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    clearConversationState(user.id);

    console.log('[conversation-state] Cleared conversation state for user', user.id);

    return NextResponse.json({
      success: true,
      message: 'Conversation state cleared'
    });
  } catch (error) {
    console.error('[conversation-state] Error clearing state:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message
    }, { status: 500 });
  }
}
