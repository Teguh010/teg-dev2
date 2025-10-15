import { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn, isLocationMatch } from "@/lib/utils";
import { useSidebarStore } from "@/store";

interface NestedMenuItemProps {
  href: string;
  title: string;
  icon: ElementType;
  child?: any[];
}

const NestedMenuItem = ({ href, title, icon: Icon, child }: NestedMenuItemProps) => {
  const locationName = usePathname();
  const { setMobileMenu } = useSidebarStore();

  const handleClick = () => {
    if (!child) {
      setMobileMenu(false);
    }
  };

  return (
    <Link href={href} onClick={handleClick}>
      <div
        className={cn(
          "flex gap-3 text-default-700 text-sm capitalize px-[10px] py-3 rounded cursor-pointer hover:bg-primary hover:text-primary-foreground",
          {
            "bg-primary text-primary-foreground": isLocationMatch(href, locationName),
          }
        )}
      >
        <span className="flex-grow-0">
          <Icon className="w-5 h-5" />
        </span>
        <div className="text-box flex-grow">{title}</div>
      </div>
    </Link>
  );
};

export default NestedMenuItem; 