import { NextRequest, NextResponse } from 'next/server';
import { fixRuntimeErrors } from '@/lib/runtime-error-fixer';
import { sandboxManager } from '@/lib/sandbox/sandbox-manager';
import { AutoFixRequest } from '@/types/auto-fix';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sandboxId, errors, focusFiles } = body as AutoFixRequest;

        if (!sandboxId || !errors || errors.length === 0) {
            return NextResponse.json(
                { error: 'Missing sandboxId or errors' },
                { status: 400 }
            );
        }

        // Get sandbox provider
        const provider = sandboxManager.getProvider(sandboxId);
        if (!provider) {
            return NextResponse.json(
                { error: 'Sandbox provider not found' },
                { status: 404 }
            );
        }

        console.log(`[fix-runtime-errors] Starting auto-fix for sandbox ${sandboxId} with ${errors.length} errors`);

        // Call fixer logic
        const result = await fixRuntimeErrors(errors, provider, focusFiles);

        // Return stream
        return result.toTextStreamResponse();

    } catch (error) {
        console.error('[fix-runtime-errors] Error:', error);
        return NextResponse.json(
            { error: (error as Error).message },
            { status: 500 }
        );
    }
}
