import { SandboxProvider, SandboxProviderConfig } from './types';
import { E2BProvider } from './providers/e2b-provider';
import { VercelProvider } from './providers/vercel-provider';

export class SandboxFactory {
  static create(provider?: string, config?: SandboxProviderConfig): SandboxProvider {
    // Use environment variable if provider not specified
    const selectedProvider = provider || process.env.SANDBOX_PROVIDER || 'e2b';

    // Try the selected provider first; if its credentials are missing, fall back
    const providerOrder = selectedProvider.toLowerCase() === 'vercel'
      ? ['vercel', 'e2b']
      : ['e2b', 'vercel'];

    for (const p of providerOrder) {
      if (this.isProviderAvailable(p)) {
        if (p !== providerOrder[0]) {
          console.warn(`[SandboxFactory] ${providerOrder[0]} credentials missing, falling back to ${p}`);
        }
        return p === 'e2b'
          ? new E2BProvider(config || {})
          : new VercelProvider(config || {});
      }
    }

    // No credentials for either provider — create the requested one anyway
    // (it will fail at createSandbox() with a clear error)
    console.error(`[SandboxFactory] No credentials found for any sandbox provider`);
    return selectedProvider.toLowerCase() === 'vercel'
      ? new VercelProvider(config || {})
      : new E2BProvider(config || {});
  }
  
  static getAvailableProviders(): string[] {
    return ['e2b', 'vercel'];
  }
  
  static isProviderAvailable(provider: string): boolean {
    switch (provider.toLowerCase()) {
      case 'e2b':
        return !!process.env.E2B_API_KEY;
      
      case 'vercel':
        // Vercel Sandbox SDK needs OIDC token (only present if OIDC is
        // enabled for the project) OR explicit PAT credentials.
        return !!process.env.VERCEL_OIDC_TOKEN ||
               (!!process.env.VERCEL_TOKEN && !!process.env.VERCEL_TEAM_ID && !!process.env.VERCEL_PROJECT_ID);
      
      default:
        return false;
    }
  }
}