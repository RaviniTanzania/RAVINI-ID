import React from 'react';
import { Home, Layers, User } from 'lucide-react';

export type NavTab = 'home' | 'huduma' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  badgeCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  badgeCount = 0
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] px-4 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* TAB 1: HOME */}
        <button
          id="nav-tab-home"
          type="button"
          onClick={() => onChangeTab('home')}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'text-red-600 font-bold'
              : 'text-neutral-500 hover:text-neutral-900 font-medium'
          }`}
        >
          <Home className={`w-5 h-5 mb-0.5 ${activeTab === 'home' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[11px] tracking-wide">HOME</span>
        </button>

        {/* TAB 2: HUDUMA */}
        <button
          id="nav-tab-huduma"
          type="button"
          onClick={() => onChangeTab('huduma')}
          className={`relative flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'huduma'
              ? 'text-red-600 font-bold'
              : 'text-neutral-500 hover:text-neutral-900 font-medium'
          }`}
        >
          <Layers className={`w-5 h-5 mb-0.5 ${activeTab === 'huduma' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[11px] tracking-wide">HUDUMA</span>
          {badgeCount > 0 && (
            <span className="absolute top-0 right-3 px-1.5 py-0.2 min-w-[16px] h-4 bg-red-600 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center">
              {badgeCount > 99 ? '99+' : badgeCount}
            </span>
          )}
        </button>

        {/* TAB 3: PROFILE */}
        <button
          id="nav-tab-profile"
          type="button"
          onClick={() => onChangeTab('profile')}
          className={`flex flex-col items-center justify-center py-1 px-4 rounded-xl transition-all cursor-pointer ${
            activeTab === 'profile'
              ? 'text-red-600 font-bold'
              : 'text-neutral-500 hover:text-neutral-900 font-medium'
          }`}
        >
          <User className={`w-5 h-5 mb-0.5 ${activeTab === 'profile' ? 'stroke-[2.5px]' : 'stroke-2'}`} />
          <span className="text-[11px] tracking-wide">PROFILE</span>
        </button>
      </div>
    </nav>
  );
};
