import React, { useState } from 'react';
import { menusConfig } from '@/config/menus';
import { X } from 'lucide-react';

// Helper to get icon from menu config (since icon is a ReactElement or function)
const renderIcon = (IconComponent: any) => {
  if (!IconComponent) return null;
  // If it's a function (React component), render it
  if (typeof IconComponent === 'function') return <IconComponent className="w-7 h-7 text-primary" />;
  // If it's a ReactElement, return as is
  return IconComponent;
};

const MobileMenuScreen = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenuIdx, setActiveMenuIdx] = useState<number | null>(null);

  const mainMenus = menusConfig.sidebarNav.classic.filter(menu => !menu.isHeader);

  const handleMenuClick = (idx: number) => {
    setActiveMenuIdx(idx);
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setSidebarOpen(false);
    setActiveMenuIdx(null);
  };

  return (
    <div className="md:hidden block">
      {/* Main menu grid */}
      <div className="grid grid-cols-2 gap-4 p-4">
        {mainMenus.map((menu, idx) => (
          <button
            key={menu.title}
            className="flex flex-col items-center justify-center bg-white rounded-lg shadow p-4 active:bg-gray-100"
            onClick={() => handleMenuClick(idx)}
          >
            {renderIcon(menu.icon)}
            <span className="mt-2 text-sm font-semibold text-gray-700 text-center">{menu.title}</span>
          </button>
        ))}
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-30" onClick={handleCloseSidebar}></div>
          {/* Sidebar */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-lg z-50 animate-slide-in-left">
            <button
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-gray-100"
              onClick={handleCloseSidebar}
              aria-label="Close sidebar"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            {activeMenuIdx !== null && (
              <div className="p-6 pt-10">
                <div className="flex items-center gap-2 mb-4">
                  {renderIcon(mainMenus[activeMenuIdx].icon)}
                  <span className="font-bold text-lg">{mainMenus[activeMenuIdx].title}</span>
                </div>
                {/* Sub menu */}
                <ul className="space-y-3">
                  {mainMenus[activeMenuIdx].child?.map((sub, i) => (
                    <li key={sub.title}>
                      <a
                        href={sub.href}
                        className="flex items-center gap-2 px-3 py-2 rounded hover:bg-primary/10 text-gray-700"
                        onClick={handleCloseSidebar}
                      >
                        {renderIcon(sub.icon)}
                        <span>{sub.title}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes slide-in-left {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MobileMenuScreen;
