import '@/styles/workspace-v2.css';
import ErrorBoundary from '@/components/shared/ErrorBoundary';

export default function UpgradeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="workspace-root">
      <ErrorBoundary fallbackMessage="Upgrade page encountered an error.">
        {children}
      </ErrorBoundary>
    </div>
  );
}
