import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function MainLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-muted/30">
      <Sidebar />
      {/* 
        The sidebar is fixed, so we need a margin on the main content area.
        The margin should match the sidebar width (64 on desktop, 20 when collapsed).
        For now, we use a standard 64 (w-64) and we'll adjust for collapse if needed.
      */}
      <div
        className="flex-1 flex flex-col min-h-0 transition-all duration-300"
        style={{ paddingLeft: 'var(--sidebar-width, 256px)' }}
      >
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="container mx-auto max-w-7xl animate-fade-in py-8 px-4 md:px-6 lg:px-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}
