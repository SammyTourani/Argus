import { nanoid } from 'nanoid';

export interface BranchableMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  parentId: string | null;
  children: string[];
  branchIndex: number;
  isActive: boolean;
  metadata?: {
    model?: string;
    fileChanges?: string[];
    generatedCode?: string;
  };
}

type MessageInput = Omit<BranchableMessage, 'children' | 'branchIndex' | 'isActive'>;

export class MessageRepository {
  private messages: Map<string, BranchableMessage>;
  private rootIds: string[];
  private activePathIds: string[];

  constructor() {
    this.messages = new Map();
    this.rootIds = [];
    this.activePathIds = [];
  }

  /**
   * Add a message to the conversation.
   * If `afterMessageId` is provided, the new message becomes a child of that message.
   * Otherwise it is appended after the last message in the active path (or as a root).
   */
  addMessage(input: MessageInput, afterMessageId?: string): BranchableMessage {
    const parentId = afterMessageId ?? this.activePathIds[this.activePathIds.length - 1] ?? null;

    const message: BranchableMessage = {
      ...input,
      children: [],
      branchIndex: 0,
      isActive: true,
    };

    if (parentId) {
      const parent = this.messages.get(parentId);
      if (!parent) {
        throw new Error(`Parent message not found: ${parentId}`);
      }
      message.parentId = parentId;
      message.branchIndex = parent.children.length;

      // Deactivate existing sibling branches at this position
      for (const siblingId of parent.children) {
        this.deactivateSubtree(siblingId);
      }

      parent.children.push(message.id);
    } else {
      // Root-level message
      message.parentId = null;
      message.branchIndex = this.rootIds.length;

      // Deactivate existing root-level siblings
      for (const rootId of this.rootIds) {
        this.deactivateSubtree(rootId);
      }

      this.rootIds.push(message.id);
    }

    this.messages.set(message.id, message);
    this.rebuildActivePath();
    return message;
  }

  /**
   * Create a new branch (regenerated response) at the same position as an existing message.
   * The new message becomes a sibling of `parentId`'s existing children — i.e., it is
   * added as another child of the *parent* of `parentId` when `parentId` is the message
   * being regenerated. But per the spec: `parentId` here is the message whose response we
   * are regenerating, so the new branch is a child of the *parent* of parentId's *parent*.
   *
   * Clarification: `createBranch(parentId, msg)` creates a new child of `parentId`.
   * This is the "regenerate" flow: the user message stays, we add a new assistant branch.
   */
  createBranch(parentId: string, input: MessageInput): BranchableMessage {
    const parent = this.messages.get(parentId);
    if (!parent) {
      throw new Error(`Parent message not found: ${parentId}`);
    }

    const message: BranchableMessage = {
      ...input,
      parentId,
      children: [],
      branchIndex: parent.children.length,
      isActive: true,
    };

    // Deactivate all existing children (branches) of the parent and their subtrees
    for (const childId of parent.children) {
      this.deactivateSubtree(childId);
    }

    parent.children.push(message.id);
    this.messages.set(message.id, message);
    this.rebuildActivePath();
    return message;
  }

  /**
   * Switch the active branch to the message with the given ID.
   * Updates `isActive` flags along the entire path from root to the selected
   * message (and down through its active descendants).
   */
  switchBranch(messageId: string): void {
    const target = this.messages.get(messageId);
    if (!target) {
      throw new Error(`Message not found: ${messageId}`);
    }

    // Collect the full ancestor chain up to root
    const ancestorChain: string[] = [];
    let current: BranchableMessage | undefined = target;
    while (current) {
      ancestorChain.unshift(current.id);
      current = current.parentId ? this.messages.get(current.parentId) : undefined;
    }

    // For each level in the ancestor chain, deactivate siblings and activate the chosen one
    for (const nodeId of ancestorChain) {
      const node = this.messages.get(nodeId)!;
      const siblings = this.getSiblings(nodeId);
      for (const sibId of siblings) {
        if (sibId !== nodeId) {
          this.deactivateSubtree(sibId);
        }
      }
      node.isActive = true;
    }

    // Activate the deepest active path from the target downward
    this.activateDefaultDescendants(messageId);
    this.rebuildActivePath();
  }

  /**
   * Returns the current active conversation as a flat ordered list.
   */
  getActivePath(): BranchableMessage[] {
    return this.activePathIds
      .map((id) => this.messages.get(id))
      .filter((m): m is BranchableMessage => m !== undefined);
  }

  /**
   * Get branching metadata for a message: its 1-indexed position among siblings
   * and the total number of siblings.
   */
  getBranchInfo(messageId: string): { current: number; total: number; siblings: string[] } {
    const siblings = this.getSiblings(messageId);
    const idx = siblings.indexOf(messageId);
    return {
      current: idx + 1, // 1-indexed for display
      total: siblings.length,
      siblings,
    };
  }

  /**
   * Navigate to the next sibling branch (if any).
   */
  nextBranch(messageId: string): BranchableMessage | null {
    const siblings = this.getSiblings(messageId);
    const idx = siblings.indexOf(messageId);
    if (idx < 0 || idx >= siblings.length - 1) return null;
    const nextId = siblings[idx + 1];
    this.switchBranch(nextId);
    return this.messages.get(nextId) ?? null;
  }

  /**
   * Navigate to the previous sibling branch (if any).
   */
  previousBranch(messageId: string): BranchableMessage | null {
    const siblings = this.getSiblings(messageId);
    const idx = siblings.indexOf(messageId);
    if (idx <= 0) return null;
    const prevId = siblings[idx - 1];
    this.switchBranch(prevId);
    return this.messages.get(prevId) ?? null;
  }

  /**
   * Delete a branch and all its descendants from the repository.
   * If the deleted branch was active, the nearest sibling (or parent) becomes active.
   */
  deleteBranch(messageId: string): void {
    const message = this.messages.get(messageId);
    if (!message) return;

    const wasActive = message.isActive;

    // Remove from parent's children list (or rootIds)
    if (message.parentId) {
      const parent = this.messages.get(message.parentId);
      if (parent) {
        parent.children = parent.children.filter((id) => id !== messageId);
        // Reindex remaining siblings
        for (let i = 0; i < parent.children.length; i++) {
          const sibling = this.messages.get(parent.children[i]);
          if (sibling) sibling.branchIndex = i;
        }
      }
    } else {
      this.rootIds = this.rootIds.filter((id) => id !== messageId);
      for (let i = 0; i < this.rootIds.length; i++) {
        const root = this.messages.get(this.rootIds[i]);
        if (root) root.branchIndex = i;
      }
    }

    // Recursively delete the subtree
    this.deleteSubtree(messageId);

    // If deleted branch was active, activate a sibling
    if (wasActive) {
      const siblings = message.parentId
        ? this.messages.get(message.parentId)?.children ?? []
        : this.rootIds;

      if (siblings.length > 0) {
        const fallback = siblings[Math.min(message.branchIndex, siblings.length - 1)];
        this.switchBranch(fallback);
      }
    }

    this.rebuildActivePath();
  }

  /**
   * Serialize the entire repository to a JSON string for persistence.
   */
  serialize(): string {
    const data = {
      messages: Array.from(this.messages.entries()),
      rootIds: this.rootIds,
    };
    return JSON.stringify(data);
  }

  /**
   * Reconstruct a MessageRepository from a serialized JSON string.
   */
  static deserialize(json: string): MessageRepository {
    const repo = new MessageRepository();
    const data = JSON.parse(json) as {
      messages: Array<[string, BranchableMessage]>;
      rootIds: string[];
    };
    repo.messages = new Map(data.messages);
    repo.rootIds = data.rootIds;
    repo.rebuildActivePath();
    return repo;
  }

  /**
   * Get a message by ID.
   */
  getMessage(id: string): BranchableMessage | undefined {
    return this.messages.get(id);
  }

  /**
   * Total number of messages in the repository (across all branches).
   */
  get size(): number {
    return this.messages.size;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Get all sibling IDs for a message (including itself), in order.
   */
  private getSiblings(messageId: string): string[] {
    const message = this.messages.get(messageId);
    if (!message) return [];

    if (message.parentId) {
      const parent = this.messages.get(message.parentId);
      return parent?.children ?? [];
    }
    return this.rootIds;
  }

  /**
   * Mark a message and all its descendants as inactive.
   */
  private deactivateSubtree(messageId: string): void {
    const message = this.messages.get(messageId);
    if (!message) return;
    message.isActive = false;
    for (const childId of message.children) {
      this.deactivateSubtree(childId);
    }
  }

  /**
   * From a given message, walk down activating the first (or previously-active)
   * child at each level — establishing the default active path downward.
   */
  private activateDefaultDescendants(messageId: string): void {
    const message = this.messages.get(messageId);
    if (!message || message.children.length === 0) return;

    // Prefer the previously-active child, otherwise fall back to the last child
    let activeChild = message.children.find((id) => this.messages.get(id)?.isActive);
    if (!activeChild) {
      activeChild = message.children[message.children.length - 1];
    }

    const child = this.messages.get(activeChild);
    if (child) {
      child.isActive = true;
      this.activateDefaultDescendants(activeChild);
    }
  }

  /**
   * Delete a message and all of its descendants from the map.
   */
  private deleteSubtree(messageId: string): void {
    const message = this.messages.get(messageId);
    if (!message) return;
    for (const childId of message.children) {
      this.deleteSubtree(childId);
    }
    this.messages.delete(messageId);
  }

  /**
   * Walk the tree from roots, following active branches, to produce the
   * flat `activePathIds` array.
   */
  private rebuildActivePath(): void {
    this.activePathIds = [];

    // Find the active root
    const activeRoot = this.rootIds.find((id) => this.messages.get(id)?.isActive);
    if (!activeRoot) return;

    let currentId: string | undefined = activeRoot;
    while (currentId) {
      const message = this.messages.get(currentId);
      if (!message) break;
      this.activePathIds.push(currentId);

      // Follow the active child
      const activeChild = message.children.find((id) => this.messages.get(id)?.isActive);
      currentId = activeChild;
    }
  }
}
