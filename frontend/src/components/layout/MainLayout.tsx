import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export function MainLayout({ children }: { children?: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground transition-colors duration-300">
      <Sidebar />

      <div
        className="hidden lg:block shrink-0 transition-all duration-300 ease-in-out"
        style={{ width: 'var(--sidebar-width, 256px)' }}
      />

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300">
        <Navbar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 dark:bg-transparent flex flex-col">
          <div className="w-full h-full flex-1 animate-fade-in p-4 md:p-6 lg:p-8">
            <div className="max-w-[1920px] mx-auto h-full w-full">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
