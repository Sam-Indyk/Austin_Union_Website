import type { ReactNode } from 'react';

// Full-screen layouts for the projector (no site header or footer).
export default function PresentLayout({ children }: { children: ReactNode }) {
  return <div className="present-root">{children}</div>;
}
