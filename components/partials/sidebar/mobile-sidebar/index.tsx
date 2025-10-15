"use client";
import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store";
import { menusConfig, filterMenusByGUIElements } from "@/config/menus";
import { getManagerMenus } from "@/config/manager-menus";
import { developerMenusConfig } from "@/config/developer-menus";
import { ScrollArea } from "@/components/ui/scroll-area";
import SidebarLogo from "../common/logo";
import MenuLabel from "../common/menu-label";
import SingleMenuItem from "./single-menu-item";
import SubMenuHandler from "./sub-menu-handler";
import NestedSubMenu from "../common/nested-menus";
import type { SubMenuItem, MenuItem} from "@/config/menus";
import { useUser } from "@/context/UserContext";
import { usePathname } from "next/navigation";
import { getUserGUIElementsOverview } from "@/models/users";
import { useSelectedCustomerStore } from "@/store/selected-customer";

interface MobileSidebarProps {
  collapsed?: boolean;
  className?: string;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ collapsed, className }) => {
  const { sidebarBg, mobileMenu, setMobileMenu, activeMobileSidebarMenu, setActiveMobileSidebarMenu } = useSidebarStore();
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);
  const [activeMultiMenu, setMultiMenu] = useState<number | null>(null);
  const pathname = usePathname();
  
  const { models: { user, userProfileData }, operations: { getUserRef } } = useUser();
  const { selectedCustomerId } = useSelectedCustomerStore();
  
  // State for GUI elements data
  const [guiElements, setGuiElements] = useState([]);
  const [isLoadingGUI, setIsLoadingGUI] = useState(false);
  
  // Use user data first, fallback to userProfileData for backward compatibility
  const currentUser = user || userProfileData;
  
  // Debug: Log userProfileData structure
  useEffect(() => {
    // userProfileData changed, check if ready for GUI elements fetch
  }, [userProfileData]);
  
  // Determine if current path is manager or developer based on pathname only
  const isManagerPath = pathname.includes('/manager');
  const isDeveloperPath = pathname.includes('/developer');
  const shouldShowManagerMenu = isManagerPath;
  
  // Check if customer is selected (for manager menus)
  const hasSelectedCustomer = selectedCustomerId !== null && selectedCustomerId !== undefined;
  
  // Fetch GUI elements when user profile is available (only for non-manager users)
  useEffect(() => {
    const fetchGUIElements = async () => {
      
      // Only fetch for non-manager users
      if (shouldShowManagerMenu) {
        return;
      }
      
      // Get token from userProfileData or getUserRef
      const token = userProfileData?.token || getUserRef()?.token;
      if (!token) {
        return;
      }
      
      // Get userId from userProfileData
      const userId = userProfileData?.userId;
      if (!userId) {
        return;
      }
      
      setIsLoadingGUI(true);
      try {
        const elements = await getUserGUIElementsOverview(token, Number(userId));
        setGuiElements(elements);
      } catch (error) {
        console.error("❌ Mobile Sidebar: Error fetching GUI elements:", error);
        setGuiElements([]);
      } finally {
        setIsLoadingGUI(false);
      }
    };

    // Only fetch if userProfileData is available and has token and userId
    if (userProfileData && userProfileData.token && userProfileData.userId && !shouldShowManagerMenu) {
      fetchGUIElements();
    }
  }, [userProfileData, getUserRef, shouldShowManagerMenu]);
  
  // Get base menus
  const baseMenus = shouldShowManagerMenu 
    ? (getManagerMenus(hasSelectedCustomer)?.sidebarNav?.classic || [])
    : isDeveloperPath
      ? (developerMenusConfig?.sidebarNav?.classic || [])
      : menusConfig?.sidebarNav?.classic || [];
  
  // Apply GUI elements filtering to menus (only for non-manager users)
  const menus = React.useMemo(() => {
    if (shouldShowManagerMenu || isDeveloperPath || isLoadingGUI || guiElements.length === 0) {
      return baseMenus; // Return unfiltered menus for manager or while loading
    }
    return filterMenusByGUIElements(baseMenus as MenuItem[], guiElements, currentUser?.userTypeId);
  }, [baseMenus, guiElements, isLoadingGUI, shouldShowManagerMenu, currentUser?.userTypeId, hasSelectedCustomer]);

  useEffect(() => {
    if (pathname) {
      menus.forEach((item, index) => {
        if (item.href === pathname) {
          setActiveSubmenu(null);
          return;
        }
        
        if (item.child) {
          const childMatch = item.child.some(child => 
            child.href === pathname || pathname.startsWith(child.href)
          );
          
          if (childMatch) {
            setActiveSubmenu(index);
          }
        }
      });
    }
  }, [pathname, menus]);

  useEffect(() => {
    if (activeMobileSidebarMenu !== null) {
      // cari index menu yang identifier-nya (href/title) sama dengan activeMobileSidebarMenu
      const idx = menus.findIndex(
        (item) => (item.href || item.title) === activeMobileSidebarMenu
      );
      if (idx !== -1) {
        setActiveSubmenu(idx);
      }
    }
  }, [activeMobileSidebarMenu, menus]);

  const toggleSubmenu = (i) => {
    if (activeSubmenu === i) {
      setActiveSubmenu(null);
      setActiveMobileSidebarMenu(null);
    } else {
      setActiveSubmenu(i);
      const menu = menus[i];
      let identifier = String(i);
      if (typeof menu === 'object') {
        if ('href' in menu && menu.href) {
          identifier = menu.href;
        } else if ('title' in menu && menu.title) {
          identifier = menu.title;
        }
      }
      setActiveMobileSidebarMenu(identifier);
    }
  };

  const toggleMultiMenu = (subIndex) => {
    if (activeMultiMenu === subIndex) {
      setMultiMenu(null);
    } else {
      setMultiMenu(subIndex);
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed top-0  bg-card h-full w-[248px] z-[9999] ",
          className,
          {
            " -left-[300px] invisible opacity-0  ": !mobileMenu,
            " left-0 visible opacity-100  ": mobileMenu,
          }
        )}
      >
        {sidebarBg !== "none" && (
          <div
            className=" absolute left-0 top-0   z-[-1] w-full h-full bg-cover bg-center opacity-[0.07]"
            style={{ backgroundImage: `url(${sidebarBg})` }}
          ></div>
        )}
        <SidebarLogo collapsed={collapsed} />
        <ScrollArea
          className={cn("sidebar-menu  h-[calc(100%-80px)] ", {
            "px-4": !collapsed,
          })}
        >
          <ul
            className={cn("", {
              " space-y-2 text-center": collapsed,
            })}
          >
            {menus.map((item, i) => (
              <li key={`menu_key_${i}`}>
                {!item.child && !item.isHeader && (
                  <SingleMenuItem item={item as unknown as SubMenuItem} collapsed={collapsed} />
                )}
                {item.isHeader && !item.child && !collapsed && (
                  <MenuLabel item={item} />
                )}
                {item.child && (
                  <>
                    <SubMenuHandler
                      item={item as unknown as SubMenuItem}
                      toggleSubmenu={toggleSubmenu}
                      index={i}
                      activeSubmenu={activeSubmenu}
                      collapsed={collapsed}
                    />

                    {!collapsed && (
                      <NestedSubMenu
                        toggleMultiMenu={toggleMultiMenu}
                        activeMultiMenu={activeMultiMenu}
                        activeSubmenu={activeSubmenu}
                        item={item}
                        index={i}
                        collapsed={collapsed}
                      />
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
      {mobileMenu && (
        <div
          onClick={() => setMobileMenu(false)}
          className="overlay bg-black/60 backdrop-filter backdrop-blur-sm opacity-100 fixed inset-0 z-[999]"
        ></div>
      )}
    </>
  );
};

export default MobileSidebar;
