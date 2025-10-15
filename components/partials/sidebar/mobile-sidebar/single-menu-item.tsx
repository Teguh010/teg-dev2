import { ElementType } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSidebarStore } from "@/store";
import { useTranslation } from "react-i18next";

interface MenuItem {
  badge?: string;
  href: string;
  title: string;
  icon: ElementType;
  child?: unknown[];
}

interface SingleMenuItemProps {
  item: MenuItem;
  collapsed: boolean;
}

const SingleMenuItem: React.FC<SingleMenuItemProps> = ({ item, collapsed }) => {
  const { badge, href, title, icon: Icon, child } = item;
  const locationName = usePathname();
  const { setMobileMenu } = useSidebarStore();
  const { t } = useTranslation();
  
  // Improved path matching for exact matches
  const isActive = locationName === href;

  const handleClick = () => {
    if (!child) {
      setMobileMenu(false);
    }
  };

  return (
    <Link href={href} onClick={handleClick}>
      <>
        {collapsed ? (
          <div>
            <span
              className={cn(
                "h-12 w-12 mx-auto rounded-md transition-all duration-300 inline-flex flex-col items-center justify-center relative",
                {
                  "bg-primary text-primary-foreground": isActive,
                  "text-default-600": !isActive,
                }
              )}
            >
              <Icon className="w-6 h-6" />
            </span>
          </div>
        ) : (
          <div
            className={cn(
              "flex gap-3 text-default-700 text-sm capitalize px-[10px] py-3 rounded cursor-pointer hover:bg-primary hover:text-primary-foreground",
              {
                "bg-primary text-primary-foreground": isActive,
              }
            )}
          >
            <span className="flex-grow-0">
              <Icon className="w-5 h-5" />
            </span>
            <div className="text-box flex-grow">{t(title)}</div>
            {badge && <Badge className="rounded">{badge}</Badge>}
          </div>
        )}
      </>
    </Link>
  );
};

export default SingleMenuItem;
