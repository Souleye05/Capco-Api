import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      <main className="lg:ml-60 min-h-screen transition-all duration-200">
        <Outlet />
      </main>
    </div>
  );
}
