import { ReactElement } from "react";
import {
  DashBoard,
  Map,
  ClipBoard,
  PretentionChartLine,
  MenuBar
} from "@/public/svg";
import { GUIGroup } from "@/models/users";

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

interface MenuConfig {
  mainNav: MenuItem[];
  managerNav: MenuItem[];
  sidebarNav: {
    classic: MenuItem[];
  };
}

export const menusConfig: MenuConfig = {
  mainNav: [
    {
      title: "general.home",
      icon: DashBoard,
      child: [
        {
          title: "general.map",
          href: "/map",
          icon: Map,
        },
        // {
        //   title: "Map Testing",
        //   href: "/map_testing",
        //   icon: Map,
        // },
      ],
    },
    {
      title: "Reports",
      icon: ClipBoard,
      child: [
        {
          title: "general.object_overview",
          href: "/objectoverview",
          icon: PretentionChartLine,
        },
        {
          title: "general.trips_and_stops",
          href: "/tripsandstops",
          icon: PretentionChartLine,
        },
        {
          title: "general.scheduled",
          href: "/scheduled",
          icon: PretentionChartLine,
        },
        {
          title: "general.toll_cost",
          href: "/toll-cost",
          icon: PretentionChartLine,
        },
        {
          title: "general.geocode_processor",
          href: "/geocode-processor",
          icon: PretentionChartLine,
        },
        {
          title: "general.valid_raw_message",
          href: "/validrawmessage",
          icon: PretentionChartLine,
        },
         {
            title: "general.input_report",
            href: "/input-report",
            icon: PretentionChartLine,
          },
        /* {
          title: "general.valid_raw_message_virtualized",
          href: "/validrawmessagevirtualized",
          icon: PretentionChartLine,
        }, */
        {
          title: "general.fuel_report",
          href: "/fuel-report",
          icon: PretentionChartLine,
        },
        {
          title: "general.distance_fuel_engine_hours",
          href: "/object-distance-fuel-engine-hours",
          icon: PretentionChartLine,
        },
      ],
    },
    {
      title: "general.tachograph",
      icon: ClipBoard,
      child: [
        {
          title: "general.tachograph_drivers",
          href: "/tachograph?search=drivers",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_vehicles",
          href: "/tachograph?search=vehicles",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_files",
          href: "/tachograph-files",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_live",
          href: "/tachograph-live",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_faults_and_events",
          href: "/tachograph-faults-and-events",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_read_statuses",
          href: "/tachograph-read-statuses",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_distance_driven_stats",
          href: "/tachograph-distance-driven-stats",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_driving_stats_by_driver_card_data",
          href: "/tachograph-driving-stats-by-driver-card-data",
          icon: PretentionChartLine,
        },
        // {
        //   title: "general.tachograph_new_test",
        //   href: "/tachograph-new-test",
        //   icon: PretentionChartLine,
        // },
        // {
        //   title: "general.timeline_test",
        //   href: "/timeline-test",
        //   icon: PretentionChartLine,
        // },
      ],
    },
    {
      title: "general.administration",
      icon: ClipBoard,
      child: [
        {
          title: "general.workers",
          href: "/worker",
          icon: PretentionChartLine,
        },
        {
          title: "general.workers_group",
          href: "/workers-group",
          icon: PretentionChartLine,
        },
        {
          title: "general.users",
          href: "/users",
          icon: PretentionChartLine,
        },
        {
          title: "general.users_group",
          href: "/users-group",
          icon: PretentionChartLine,
        },
        {
          title: "general.object_group",
          href: "/groups",
          icon: PretentionChartLine,
        },
        {
          title: "general.object_rename",
          href: "/objectrename",
          icon: PretentionChartLine,
        },
         {
          title: "general.menu_management",
          href: "/menu-management",
          icon: MenuBar,
        }
      ],
    },
    {
      title: "general.tasks",
      icon: DashBoard,
      child: [
        {
          title: "general.tasks",
          href: "/tasks",
          icon: Map,
        }
      ],
    }
  ],
  managerNav: [
    {
      title: "general.module",
      icon: DashBoard,
      child: [
        {
          title: "general.module_overview",
          href: "/manager/moduleoverview",
          icon: Map,
        },
        {
          title: "general.module_list",
          href: "/manager/modulelist",
          icon: Map,
        },
        {
          title: "general.manufacturer_list",
          href: "/manager/manufacturerlist",
          icon: Map,
        },
      ],
    },
    {
      title: "general.customer",
      icon: ClipBoard,
      child: [
        {
          title: "general.customers",
          href: "/manager/customerlist",
          icon: PretentionChartLine,
        },
      ],
    },
     {
      title: "general.reports",
      icon: ClipBoard,
      child: [
        {
          title: "general.object_overview",
          href: "/objectoverview",
          icon: PretentionChartLine,
        },
        {
          title: "general.trips_and_stops",
          href: "/tripsandstops",
          icon: PretentionChartLine,
        },
        {
          title: "general.scheduled",
          href: "/scheduled",
          icon: PretentionChartLine,
        },
        {
          title: "general.toll_cost",
          href: "/toll-cost",
          icon: PretentionChartLine,
        },
        {
          title: "general.valid_raw_message",
          href: "/manager/validrawmessage",
          icon: PretentionChartLine,
        },
         {
            title: "general.input_report",
            href: "/manager/input-report",
            icon: PretentionChartLine,
          }
      ],
    },
  ],
  sidebarNav: {
    classic: [
      {
        isHeader: true,
        title: "general.menu",
      },
      {
        title: "general.home",
        icon: DashBoard,
        child: [
          {
            title: "general.map",
            href: "/map",
            icon: Map,
          },
          // {
          //   title: "Map Testing",
          //   href: "/map_testing",
          //   icon: Map,
          // },
        ],
      },
      {
        title: "general.reports",
        icon: ClipBoard,
        child: [
          {
            title: "general.object_overview",
            href: "/objectoverview",
            icon: PretentionChartLine,
          },
          {
            title: "general.trips_and_stops",
            href: "/tripsandstops",
            icon: PretentionChartLine,
          },
          {
            title: "general.scheduled",
            href: "/scheduled",
            icon: PretentionChartLine,
          },
          {
            title: "general.toll_cost",
            href: "/toll-cost",
            icon: PretentionChartLine,
          },
          {
            title: "general.geocode_processor",
            href: "/geocode-processor",
            icon: PretentionChartLine,
          },
          {
            title: "general.valid_raw_message",
            href: "/validrawmessage",
            icon: PretentionChartLine,
          },
          {
            title: "general.input_report",
            href: "/input-report",
            icon: PretentionChartLine,
          },
          {
            title: "general.fuel_report",
            href: "/fuel-report",
            icon: PretentionChartLine,
          },
          {
            title: "general.distance_fuel_engine_hours",
            href: "/object-distance-fuel-engine-hours",
            icon: PretentionChartLine,
          },
        ],
      },
      {
        title: "general.tachograph",
        icon: ClipBoard,
        child: [
          {
            title: "general.tachograph_drivers",
            href: "/tachograph?search=drivers",
            icon: PretentionChartLine,
          },
          {
            title: "general.tachograph_vehicles",
            href: "/tachograph?search=vehicles",
            icon: PretentionChartLine,
          },
          {
            title: "general.tachograph_files",
            href: "/tachograph-files",
            icon: PretentionChartLine,
          },
          {
            title: "general.tachograph_live",
            href: "/tachograph-live",
            icon: PretentionChartLine,
          },
          {
            title: "general.tachograph_faults_and_events",
            href: "/tachograph-faults-and-events",
            icon: PretentionChartLine,
          },
          {
            title: "general.tachograph_read_statuses",
            href: "/tachograph-read-statuses",
            icon: PretentionChartLine,
          },
          {
            title: "general.tachograph_driving_stats_by_driver_card_data",
            href: "/tachograph-driving-stats-by-driver-card-data",
            icon: PretentionChartLine,
          },
          {
            title: "general.timeline_test",
            href: "/timeline-test",
            icon: PretentionChartLine,
          },
        ],
      },
      {
        title: "general.administration",
        icon: ClipBoard,
        child: [
          {
            title: "general.workers",
            href: "/worker",
            icon: PretentionChartLine,
          },
          {
            title: "general.workers_group",
            href: "/workers-group",
            icon: PretentionChartLine,
          },
          {
            title: "general.users",
            href: "/users",
            icon: PretentionChartLine,
          },
          {
            title: "general.users_group",
            href: "/users-group",
            icon: PretentionChartLine,
          },
          {
            title: "general.object_group",
            href: "/groups",
            icon: PretentionChartLine,
          },
          {
            title: "general.object_rename",
            href: "/objectrename",
            icon: PretentionChartLine,
          },
            {
            title: "general.menu_management",
            href: "/menu-management",
            icon: MenuBar,
          }
        ],
      },
      {
        title: "general.tasks",
        icon: DashBoard,
        child: [
          {
            title: "general.tasks",
            href: "/tasks",
            icon: Map,
          }
        ],
      }
    ],
  },
};

export type { MenuConfig, MenuItem, SubMenuItem };

// Mapping between API group names and menu titles
const groupNameMapping: Record<string, string[]> = {
  "administration": ["general.administration"],
  "tachograph": ["general.tachograph"], 
  "report": ["Reports", "general.reports"]
};

// Mapping between API report names and menu item titles/hrefs
const reportNameMapping: Record<string, { title: string; href: string }> = {
  // Administration group
  "users": { title: "general.users", href: "/users" },
  "workers": { title: "general.workers", href: "/worker" },
  "workers groups": { title: "general.workers_group", href: "/workers-group" },
  "users groups": { title: "general.users_group", href: "/users-group" },
  "objects groups": { title: "general.object_group", href: "/groups" },
  "menu management": { title: "general.menu_management", href: "/menu-management" },
  
  // Tachograph group
  "drivers": { title: "general.tachograph_drivers", href: "/tachograph?search=drivers" },
  "vehicles": { title: "general.tachograph_vehicles", href: "/tachograph?search=vehicles" },
  "files": { title: "general.tachograph_files", href: "/tachograph-files" },
  "live states": { title: "general.tachograph_live", href: "/tachograph-live" },
  "faults and events": { title: "general.tachograph_faults_and_events", href: "/tachograph-faults-and-events" },
  "read statuses": { title: "general.tachograph_read_statuses", href: "/tachograph-read-statuses" },
  "distance driven stats": { title: "general.tachograph_distance_driven_stats", href: "/tachograph-distance-driven-stats" },
  "driving stats by driver card data": { title: "general.tachograph_driving_stats_by_driver_card_data", href: "/tachograph-driving-stats-by-driver-card-data" },
  
  // Report group
  "object overview": { title: "general.object_overview", href: "/objectoverview" },
  "trip stop": { title: "general.trips_and_stops", href: "/tripsandstops" },
  "toll cost": { title: "general.toll_cost", href: "/toll-cost" },
  "valid raw messages": { title: "general.valid_raw_message", href: "/validrawmessage" },
  "input report": { title: "general.input_report", href: "/input-report" },
  "fuel level report": { title: "general.fuel_report", href: "/fuel-report" },
  "distance fuel engine hours": { title: "general.distance_fuel_engine_hours", href: "/object-distance-fuel-engine-hours" }
};

// Function to filter menus based on GUI elements overview and user type
export const filterMenusByGUIElements = (menus: MenuItem[], guiElements: GUIGroup[], userTypeId?: number): MenuItem[] => {
  
  if (!guiElements || guiElements.length === 0) {
    return menus; // Return all menus if no GUI elements data
  }

  return menus.map(menu => {    
    // Check if this menu group is in the GUI elements
    const groupName = Object.keys(groupNameMapping).find(key => 
      groupNameMapping[key].includes(menu.title)
    );
    
    if (!groupName) {
      // If menu group is not in GUI elements (like "general.home" or "general.tasks"), keep it
      return menu;
    }

    const guiGroup = guiElements.find(group => group.group_name === groupName);
    
    if (!guiGroup) {
      return { ...menu, isHide: true };
    }

    if (guiGroup.disabled) {
      return { ...menu, isHide: true };
    }

    // Filter child items based on enabled reports
    if (menu.child) {
      const filteredChildren = menu.child.filter(child => {
        // Special handling for menu_management - requires userTypeId === 1
        if (child.title === "general.menu_management") {
          if (userTypeId !== 1) {
            return false;
          }
        }
        
        const reportName = Object.keys(reportNameMapping).find(key => 
          reportNameMapping[key].title === child.title && 
          reportNameMapping[key].href === child.href
        );
        
        if (!reportName) {
          // If child item is not in the mapping, keep it (like "general.object_rename")
          return true;
        }

        const report = guiGroup.report.find(r => r.name === reportName);
        const isEnabled = report && report.enabled && !report.disabled;
        
        
        return isEnabled;
      });

      return {
        ...menu,
        child: filteredChildren,
        isHide: filteredChildren.length === 0 // Hide menu if no children are visible
      };
    }

    return menu;
  }).filter(menu => {
    const shouldHide = menu.isHide;
    if (shouldHide) {
      console.warn(`🚫 Hiding menu: ${menu.title}`);
    }
    return !shouldHide;
  }); // Remove hidden menus
};
