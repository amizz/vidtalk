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
  Sparkles,
  Tv,
  Radio,
  Music
} from 'lucide-react';
import { useSidebar } from '~/contexts/SidebarContext';

export default function Sidebar() {
  const location = useLocation();
  const { isOpen, setIsOpen } = useSidebar();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems: { id: string; label: string; icon: React.ReactNode; href: string, badge?: string }[] = [
    {
      id: 'library',
      label: 'Video Vault',
      icon: <Tv className="w-5 h-5" />,
      href: '/videos'
    },
    {
      id: 'collection-chat',
      label: 'Cosmic Chat',
      icon: <Radio className="w-5 h-5" />,
      href: '/videos/collection-chat'
    }
  ];

  const quickActions = [
    {
      id: 'recent',
      label: 'Fresh',
      icon: <History className="w-4 h-4" />,
      onClick: () => {}
    },
    {
      id: 'starred',
      label: 'Faves',
      icon: <Star className="w-4 h-4" />,
      onClick: () => {}
    },
    {
      id: 'folders',
      label: 'Stash',
      icon: <Folder className="w-4 h-4" />,
      onClick: () => {}
    },
    {
      id: 'trending',
      label: 'Hot',
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
        } bg-[#1A0033] transition-all duration-300 
        flex flex-col fixed top-0 h-screen z-40 retro-border border-r-4 border-[#FF006E]
        ${isOpen ? 'left-0' : '-left-72 md:left-0'}`}
      >
      {/* Header */}
      <div className="p-4 border-b-4 border-[#FF006E]">
        <div className="flex items-center justify-between">
          <Link to="/" className={`flex items-center gap-3 ${!isOpen && 'justify-center'}`}>
            {isOpen ? (
              <>
                <div className="w-12 h-12 retro-gradient rounded-2xl flex items-center justify-center retro-shadow retro-border transform rotate-6 wiggle-hover">
                  <Tv className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="font-bungee text-2xl text-[#FF006E]">
                    VIDTALK
                  </h1>
                  <p className="font-space-mono text-xs text-[#00F5FF]">Groovy Videos</p>
                </div>
              </>
            ) : (
              <div className="w-12 h-12 retro-gradient rounded-2xl flex items-center justify-center retro-shadow retro-border wiggle-hover">
                <Tv className="w-7 h-7 text-white" />
              </div>
            )}
          </Link>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 bg-[#FF006E] text-white rounded-xl retro-border retro-shadow 
                     hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 
                     hidden md:flex wiggle-hover"
          >
            {isOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 bg-[#FF006E] text-white rounded-xl retro-border retro-shadow 
                     hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 
                     md:hidden wiggle-hover"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {/* Upload Button */}
      <div className="p-4">
        <Link
          to="/videos?upload=true"
          className={`w-full bg-[#FFBE0B] text-[#1A0033] rounded-xl retro-border retro-shadow
                     hover:translate-x-0.5 hover:translate-y-0.5 transition-all duration-200 
                     ${isOpen ? 'px-4 py-3' : 'p-3'} flex items-center justify-center gap-2 
                     font-bungee wiggle-hover`}
        >
          <Upload className="w-5 h-5" />
          {isOpen && <span>UPLOAD</span>}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 pb-4 overflow-y-auto">
        <div className="space-y-3">
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
                           transition-all duration-200 group retro-border
                           ${isActive 
                             ? 'bg-[#8338EC] text-white retro-shadow' 
                             : 'bg-[#2D1B69] text-[#00F5FF] hover:bg-[#3A86FF] hover:text-white'
                           }`}
              >
                {/* Animated background */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-[#FF006E]/20 to-[#00F5FF]/20 
                                 rounded-xl blur-sm animate-pulse" />
                )}
                
                <div className={`relative transition-transform duration-200 
                               ${hoveredItem === item.id ? 'scale-110 rotate-12' : ''}`}>
                  {item.icon}
                </div>
                
                {isOpen && (
                  <>
                    <span className={`relative font-bebas text-xl tracking-wider`}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="ml-auto px-2 py-0.5 font-space-mono text-xs bg-[#FF006E] 
                                     text-white rounded-full retro-border">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                
                {/* Tooltip for collapsed sidebar */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-[#FF006E] 
                                 text-white font-bebas text-lg rounded-lg opacity-0 group-hover:opacity-100 
                                 transition-opacity duration-200 pointer-events-none whitespace-nowrap 
                                 retro-border retro-shadow">
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
            <h3 className="font-bungee text-sm text-[#00F5FF] mb-3">
              QUICK HITS
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.onClick}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg 
                           bg-[#2D1B69] hover:bg-[#3A86FF] transition-all duration-200
                           font-space-mono text-sm text-[#00F5FF] hover:text-white 
                           retro-border wiggle-hover"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Decorative Elements */}
        {isOpen && (
          <div className="mt-8 flex justify-center gap-3">
            <div className="w-8 h-8 bg-[#FF6B35] rounded-full retro-border animate-bounce" />
            <div className="w-8 h-8 bg-[#00F5FF] rounded-full retro-border animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-8 h-8 bg-[#FFBE0B] rounded-full retro-border animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        )}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t-4 border-[#FF006E] space-y-2">
        <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl 
                         bg-[#2D1B69] hover:bg-[#3A86FF] text-[#00F5FF] hover:text-white 
                         transition-all duration-200 retro-border wiggle-hover
                         ${!isOpen && 'justify-center'}`}>
          <Settings className="w-5 h-5" />
          {isOpen && <span className="font-bebas text-lg">Settings</span>}
        </button>

        {/* User Profile */}
        {isOpen && (
          <div className="flex items-center gap-3 px-3 py-2 mt-3 rounded-xl bg-[#8338EC] retro-border retro-shadow">
            <div className="w-10 h-10 bg-[#FF006E] rounded-full retro-border
                          flex items-center justify-center text-white font-bungee text-lg">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bebas text-lg text-white truncate">Cool User</p>
              <p className="font-space-mono text-xs text-[#00F5FF] truncate">user@groovy.com</p>
            </div>
          </div>
        )}
      </div>
      </aside>
    </>
  );
}