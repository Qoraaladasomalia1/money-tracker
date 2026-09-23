import { Outlet } from 'react-router-dom';
import { BottomNav, Sidebar } from './Nav';

export function AppLayout() {
  return (
    <div className="min-h-screen flex bg-canvas">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 px-4 py-5 md:px-8 md:py-8 max-w-6xl w-full mx-auto pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
