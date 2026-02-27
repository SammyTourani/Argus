"use client";

import { Suspense, lazy, ComponentType, useRef } from "react";

interface LazySectionProps {
  loader: () => Promise<{ default: ComponentType }>;
  fallback?: React.ReactNode;
}

export default function LazySection({ loader, fallback }: LazySectionProps) {
  // Cache the lazy component so it's only created once per instance
  const componentRef = useRef<ReturnType<typeof lazy> | null>(null);
  if (!componentRef.current) {
    componentRef.current = lazy(loader);
  }
  const Component = componentRef.current;

  return (
    <Suspense fallback={fallback ?? <div className="min-h-[200px]" />}>
      <Component />
    </Suspense>
  );
}
