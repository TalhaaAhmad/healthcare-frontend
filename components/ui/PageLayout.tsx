'use client';

import { Sidebar } from './Sidebar';

interface PageLayoutProps {
  children: React.ReactNode;
  navItems: { label: string; href: string; icon: string }[];
  portalName: string;
}

export function PageLayout({ children, navItems, portalName }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F4F7FA] flex">
      <Sidebar items={navItems} portalName={portalName} />
      <main className="flex-1 ml-[260px] px-8 py-8">
        {children}
      </main>
    </div>
  );
}
