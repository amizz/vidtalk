import { Outlet } from "react-router";
import Sidebar from "~/components/Sidebar";
import { SidebarProvider, useSidebar } from "~/contexts/SidebarContext";
import { ToastProvider } from "~/contexts/ToastContext";

function VideosLayoutContent() {
  const { isOpen } = useSidebar();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar />
      <div className={`flex-1 transition-all duration-300 ${isOpen ? 'md:ml-72' : 'md:ml-20'} ml-0`}>
        <Outlet />
      </div>
    </div>
  );
}

export default function VideosLayout() {
  return (
    <ToastProvider>
      <SidebarProvider>
        <VideosLayoutContent />
      </SidebarProvider>
    </ToastProvider>
  );
}