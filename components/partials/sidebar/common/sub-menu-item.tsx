"use client";
import { ReactNode } from "react";
import { cn, isLocationMatch } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useUser } from "@/context/UserContext";
import { useSidebarStore } from "@/store";
import { useTranslation } from "react-i18next";

interface SubItem {
  title: string;
  href: string;
  badge?: string;
}

interface LockLinkProps {
  href: string;
  children: ReactNode;
  subItem: SubItem;
}

interface SubMenuItemProps {
  subItem: SubItem;
  subIndex?: number;
}

const LockLink: React.FC<LockLinkProps> = ({ href, children, subItem }) => {
  const pathname = usePathname();
  const { models: { user, userProfileData } } = useUser();
  const { setMobileMenu } = useSidebarStore();
  const { t } = useTranslation();
  
  // Use user data first, fallback to userProfileData for backward compatibility
  const currentUser = user || userProfileData;
  const isManagerPath = pathname.includes("/manager");
  const isActive = pathname === href;
  
  const handleClick = (e) => {
    if (isActive && isManagerPath && href.includes('/manager/')) {
      e.preventDefault();
      window.location.reload();
    }
    
    setMobileMenu(false);
  };
  
  if (subItem.badge) {
    return (
      <span className="text-sm flex space-x-3 items-center transition-all duration-150 opacity-50 cursor-not-allowed">
        <span className="h-2 w-2 rounded-full border border-zinc-600 dark:border-white inline-block flex-none"></span>
        <div className="flex-1 truncate flex text-zinc-600 dark:text-zinc-300">
          <div className="flex-1 truncate">{t(subItem.title)}</div>
          <Badge className="leading-0 capitalize flex-none px-1 text-xs font-normal">
            {subItem.badge}
          </Badge>
        </div>
      </span>
    );
  } else {
    return <Link href={href} onClick={handleClick}>{children}</Link>;
  }
};

const SubMenuItem: React.FC<SubMenuItemProps> = ({ subItem }) => {
  const locationName = usePathname();
  const { t } = useTranslation();
  return (
    <LockLink href={subItem.href} subItem={subItem}>
      <div
        className={cn(
          "text-sm font-normal flex gap-3 items-center transition-all duration-150 rounded dark:hover:text-primary",
          {
            "text-primary": isLocationMatch(subItem.href, locationName),
            "text-default-600 dark:text-default-700": !isLocationMatch(
              subItem.href,
              locationName
            ),
          }
        )}
      >
        <span className="flex-1 truncate">{t(subItem.title)}</span>
      </div>
    </LockLink>
  );
};

export default SubMenuItem;