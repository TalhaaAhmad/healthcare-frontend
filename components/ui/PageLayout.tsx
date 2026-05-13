'use client';

import { Navbar } from './Navbar';

interface PageLayoutProps {
  children: React.ReactNode;
  navItems: { label: string; href: string; icon: string }[];
  portalName: string;
}

export function PageLayout({ children, navItems, portalName }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar items={navItems} portalName={portalName} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
