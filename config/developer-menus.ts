import { ReactElement } from "react";
import { MenuBar } from "@/public/svg";

interface SubMenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface MenuItem {
  isHeader?: boolean;
  title: string;
  icon?: ReactElement;
  href?: string;
  isOpen?: boolean;
  isHide?: boolean;
  child?: SubMenuItem[];
}

interface DeveloperMenuConfig {
  mainNav: MenuItem[];
  sidebarNav: {
    classic: MenuItem[];
  };
}

export const developerMenusConfig: DeveloperMenuConfig = {
  mainNav: [
    {
      title: "Developer",
      icon: MenuBar,
      child: [
        // {
        //   title: "general.menu_management",
        //   href: "/developer/menu-management",
        //   icon: MenuBar,
        // },
        {
          title: "general.translations",
          href: "/developer/translations",
          icon: MenuBar,
        }
      ]
    }
  ],
  sidebarNav: {
    classic: [
      {
        isHeader: true,
        title: "Developer",
      },
      {
        title: "general.translations",
        icon: MenuBar,
        child: [
           {
          title: "general.translations",
          href: "/developer/translations",
          icon: MenuBar,
        }
        ]
      }
    ]
  }
};

export type { DeveloperMenuConfig, MenuItem, SubMenuItem };


