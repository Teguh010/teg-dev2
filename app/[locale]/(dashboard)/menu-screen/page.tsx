"use client";
import React, { useState } from "react";
import { menusConfig } from "@/config/menus";
import { X } from "lucide-react";
import { useSidebarStore } from "@/store";

const renderIcon = (IconComponent: any) => {
  if (!IconComponent) return null;
  if (typeof IconComponent === "function") return <IconComponent className="w-7 h-7 text-primary" />;
  return IconComponent;
};

const MenuScreen = () => {
  const mainMenus = menusConfig.sidebarNav.classic.filter(menu => !menu.isHeader);
  const setActiveMobileSidebarMenu = useSidebarStore((s) => s.setActiveMobileSidebarMenu);
  const setMobileMenu = useSidebarStore((s) => s.setMobileMenu);

  const handleMenuClick = (idx: number) => {
    const menu = mainMenus[idx];
    setActiveMobileSidebarMenu(menu.href || menu.title); // use href if available, fallback to title
    setMobileMenu(true); // make sure sidebar is open
  };


  return (
    <div className="block  bg-gray-50">
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

export default MenuScreen;
