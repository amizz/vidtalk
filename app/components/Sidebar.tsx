import { useState } from 'react';
import { Link, useLocation } from 'react-router';
import { 
  Library, 
  MessageSquare, 
  Settings, 
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  History,
  Star,
  Folder,
  TrendingUp,
  Zap,
  Sparkles
} from 'lucide-react';
import { useSidebar } from '~/contexts/SidebarContext';

export default function Sidebar() {
  const location = useLocation();
  const { isOpen, setIsOpen } = useSidebar();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems: { id: string; label: string; icon: React.ReactNode; href: string, badge?: string }[] = [
    {
      id: 'library',
      label: 'Video Library',
      icon: <Library className="w-5 h-5" />,
      href: '/videos'
    },
    {
      id: 'collection-chat',
      label: 'Collection Chat',
      icon: <Sparkles className="w-5 h-5" />,
      href: '/videos/collection-chat'
    }
  ];

  const quickActions = [
    {
      id: 'recent',
      label: 'Recent',
      icon: <History className="w-4 h-4" />,
      onClick: () => {}
    },
    {
      id: 'starred',
      label: 'Starred',
      icon: <Star className="w-4 h-4" />,
      onClick: () => {}
    },
    {
      id: 'folders',
      label: 'Folders',
      icon: <Folder className="w-4 h-4" />,
      onClick: () => {}
    },
    {
      id: 'trending',
      label: 'Trending',
      icon: <TrendingUp className="w-4 h-4" />,
      onClick: () => {}
    }
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside 
        className={`${
          isOpen ? 'w-72' : 'w-20'
        } bg-gradient-to-b from-gray-50 to-white 
        border-r border-gray-200 transition-all duration-300 
        flex flex-col fixed top-0 h-screen z-40 shadow-xl
        ${isOpen ? 'left-0' : '-left-72 md:left-0'}`}
      >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Link to="/" className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
            {isOpen ? (
              <>
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                    VidTalk
                  </h1>
                  <p className="text-xs text-gray-500">AI-Powered Videos</p>
                </div>
              </>
            ) : (
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
            )}
          </Link>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 
                     hover:scale-110 active:scale-95 hidden md:flex"
          >
            {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 
                     hover:scale-110 active:scale-95 md:hidden"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {/* Upload Button */}
      <div className="p-4">
        <Link
          to="/videos?upload=true"
          className={`w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl 
                     hover:from-blue-600 hover:to-teal-600 transition-all duration-200 
                     shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 
                     ${isOpen ? 'px-4 py-3' : 'p-3'} flex items-center justify-center gap-2`}
        >
          <Upload className="w-5 h-5" />
          {isOpen && <span className="font-medium">Upload Video</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
                           (item.href === '/videos' && location.pathname.startsWith('/videos/') && !location.pathname.includes('collection-chat'));
            
            return (
              <Link
                key={item.id}
                to={item.href}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full relative flex items-center gap-3 px-3 py-3 rounded-xl 
                           transition-all duration-200 group
                           ${isActive 
                             ? 'bg-gradient-to-r from-blue-50 to-teal-50 text-blue-600' 
                             : 'hover:bg-gray-100'
                           }`}
              >
                {/* Animated background */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-teal-500/10 
                                 rounded-xl blur-sm animate-pulse" />
                )}
                
                <div className={`relative transition-transform duration-200 
                               ${hoveredItem === item.id ? 'scale-110' : ''}`}>
                  {item.icon}
                </div>
                
                {isOpen && (
                  <>
                    <span className={`relative font-medium ${isActive ? '' : 'text-gray-700'}`}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-gray-200 
                                     text-gray-600 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                
                {/* Tooltip for collapsed sidebar */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 
                                 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 
                                 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                    {item.label}
                    {item.badge && ` (${item.badge})`}
                  </div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Quick Actions */}
        {isOpen && (
          <div className="mt-8">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Quick Access
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg 
                           hover:bg-gray-100 transition-all duration-200
                           text-sm text-gray-600 hover:text-gray-900"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl 
                         hover:bg-gray-100 transition-all duration-200
                         ${!isOpen && 'justify-center'}`}>
          <Settings className="w-5 h-5 text-gray-600" />
          {isOpen && <span className="text-gray-700">Settings</span>}
        </button>

        {/* User Profile */}
        {isOpen && (
          <div className="flex items-center gap-3 px-3 py-2 mt-3 rounded-xl bg-gray-100">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full 
                          flex items-center justify-center text-white font-medium text-sm">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">User</p>
              <p className="text-xs text-gray-500 truncate">user@example.com</p>
            </div>
          </div>
        )}
      </div>
      </aside>
    </>
  );
}