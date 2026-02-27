/**
 * DeployStatusPoller — Client-side utility that polls the deploy status API
 * to track Vercel deployment progress in real time.
 *
 * Usage:
 *   const poller = new DeployStatusPoller(deploymentId);
 *   poller.poll((status) => { ... });
 *   // later:
 *   poller.stop();
 */

export type DeployState =
  | 'INITIALIZING'
  | 'ANALYZING'
  | 'BUILDING'
  | 'DEPLOYING'
  | 'READY'
  | 'ERROR'
  | 'CANCELED';

export interface DeployStatus {
  state: DeployState;
  url?: string;
  errorMessage?: string;
  createdAt: number;
  readyAt?: number;
  buildingAt?: number;
}

const POLL_INTERVAL_MS = 3000;
const MAX_POLLS = 60; // 3 minutes max

export class DeployStatusPoller {
  private deploymentId: string;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private pollCount = 0;
  private stopped = false;

  constructor(deploymentId: string) {
    this.deploymentId = deploymentId;
  }

  /**
   * Start polling deployment status.
   * Calls onUpdate with every status change.
   * Automatically stops when READY, ERROR, or CANCELED, or after MAX_POLLS.
   */
  poll(onUpdate: (status: DeployStatus) => void): void {
    if (this.intervalId) return; // Already polling
    this.stopped = false;
    this.pollCount = 0;

    // Fire first poll immediately
    this.fetchStatus(onUpdate);

    this.intervalId = setInterval(() => {
      if (this.stopped) {
        this.cleanup();
        return;
      }
      this.fetchStatus(onUpdate);
    }, POLL_INTERVAL_MS);
  }

  /** Stop polling. */
  stop(): void {
    this.stopped = true;
    this.cleanup();
  }

  private cleanup(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private async fetchStatus(onUpdate: (status: DeployStatus) => void): Promise<void> {
    this.pollCount++;

    if (this.pollCount > MAX_POLLS) {
      onUpdate({
        state: 'ERROR',
        errorMessage: 'Deployment timed out after 3 minutes. Check Vercel dashboard.',
        createdAt: Date.now(),
      });
      this.stop();
      return;
    }

    try {
      const res = await fetch(
        `/api/deploy/status?deploymentId=${encodeURIComponent(this.deploymentId)}`
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        onUpdate({
          state: 'ERROR',
          errorMessage: data.error ?? `Status check failed (${res.status})`,
          createdAt: Date.now(),
        });
        // Don't stop on transient errors — keep trying unless 401/404
        if (res.status === 401 || res.status === 404) {
          this.stop();
        }
        return;
      }

      const status: DeployStatus = await res.json();
      onUpdate(status);

      // Terminal states — stop polling
      if (status.state === 'READY' || status.state === 'ERROR' || status.state === 'CANCELED') {
        this.stop();
      }
    } catch (err) {
      // Network error — keep trying (transient)
      console.warn('[DeployStatusPoller] fetch error:', err);
    }
  }
}

/**
 * Maps a Vercel deployment state to a human-readable step index (0-3)
 * matching the PublishButton 4-step progress.
 *
 * 0: Preparing files
 * 1: Creating deployment
 * 2: Building
 * 3: Live / Ready
 */
export function deployStateToStepIndex(state: DeployState): number {
  switch (state) {
    case 'INITIALIZING':
      return 1;
    case 'ANALYZING':
      return 1;
    case 'BUILDING':
      return 2;
    case 'DEPLOYING':
      return 2;
    case 'READY':
      return 3;
    case 'ERROR':
    case 'CANCELED':
      return -1; // Error state
    default:
      return 0;
  }
}
