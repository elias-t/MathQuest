import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
}

export default function PageContainer({ children }: PageContainerProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {children}
    </div>
  );
}
