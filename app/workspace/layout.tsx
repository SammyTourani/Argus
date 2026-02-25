import ErrorBoundary from '@/components/ErrorBoundary';

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallbackMessage="The workspace encountered an error. Your data is safe.">
      {children}
    </ErrorBoundary>
  );
}
