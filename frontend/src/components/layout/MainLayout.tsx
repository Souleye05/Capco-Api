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

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden transition-all duration-300 ease-in-out">
        <Navbar />

        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-4 pb-12">
          <div className="w-full h-full animate-fade-in px-4 md:px-6 lg:px-10">
            <div className="max-w-[1600px] mx-auto">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
