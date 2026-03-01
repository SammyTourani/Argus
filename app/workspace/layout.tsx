import ErrorBoundary from '@/components/shared/ErrorBoundary';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallbackMessage="The workspace encountered an error. Your data is safe.">
      {children}
    </ErrorBoundary>
  );
}
