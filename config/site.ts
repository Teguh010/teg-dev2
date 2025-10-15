interface SiteConfigType {
  name?: string;
  description?: string | null;
  theme: string;
  layout: string;
  hideSideBar?: boolean;
  sidebarType?: string;
  sidebarColor?: string | null;
  navbarType: string;
  footerType: string;
  sidebarBg?: string;
  radius: number;
}

export const siteConfig: SiteConfigType = {
  name: "TraceGrid",
  description: null,
  theme: "gray",
  layout: "horizontal",
  hideSideBar: false,
  sidebarType: "module",
  sidebarColor: null,
  navbarType: "sticky",
  footerType: "hidden",
  sidebarBg: "none",
  radius: 0.5,
};

export type { SiteConfigType };
