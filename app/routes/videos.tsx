import { Outlet } from "react-router";
import Sidebar from "~/components/Sidebar";
import { SidebarProvider, useSidebar } from "~/contexts/SidebarContext";
import { ToastProvider } from "~/contexts/ToastContext";

function VideosLayoutContent() {
 const { isOpen } = useSidebar();
 
 return (
  <div className="min-h-screen bg-[#FFF3E0] flex relative overflow-hidden">
   {/* Retro Pattern Background */}
   <div className="absolute inset-0 opacity-5 pointer-events-none">
    <div className="absolute inset-0" style={{
     backgroundImage: `repeating-linear-gradient(45deg, #FF6B35 0, #FF6B35 10px, transparent 10px, transparent 20px),
                       repeating-linear-gradient(-45deg, #8338EC 0, #8338EC 10px, transparent 10px, transparent 20px)`
    }} />
   </div>
   
   <Sidebar />
   <div className={`flex-1 transition-all duration-300 ${isOpen ? 'md:ml-72' : 'md:ml-20'} ml-0 relative`}>
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