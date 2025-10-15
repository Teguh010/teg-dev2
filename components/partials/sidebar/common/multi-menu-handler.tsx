"use client";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";

interface SubItem {
  title: string;
  href: string;
  badge?: string;
  multi_menu?: SubItem[];
}

interface MultiMenuHandlerProps {
  subItem: SubItem;
  subIndex: number;
  activeMultiMenu: number | null;
  toggleMultiMenu: (index: number) => void;
  className?: string;
}

const MultiMenuHandler: React.FC<MultiMenuHandlerProps> = ({
  subItem,
  subIndex,
  activeMultiMenu,
  toggleMultiMenu,
  className,
}) => {
  const locationName = usePathname();
  const { t } = useTranslation();
  return (
    <div
      onClick={() => toggleMultiMenu(subIndex)}
      className={cn(
        "text-sm flex gap-3 rounded items-center transition-all duration-150 cursor-pointer relative before:absolute before:top-0 before:-left-5 before:w-[3px] before:h-0 before:transition-all before:duration-200",
        className,
        {
          "text-primary before:bg-primary before:h-full":
            activeMultiMenu === subIndex,
          "text-default-700 hover:text-primary": activeMultiMenu !== subIndex,
        }
      )}
    >
      <span className="flex-1">{t(subItem.title)}</span>
      <div className="flex-none">
        <span
          className={cn(
            "[&>*]:transform [&>*]:transition-all [&>*]:duration-300",
            {
              "[&>*]:rotate-90": activeMultiMenu === subIndex,
            }
          )}
        >
          <Icon icon="heroicons:chevron-right-20-solid" className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
};

export default MultiMenuHandler;
