import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface MenuItem {
  title: string;
}

interface MenuLabelProps {
  item: MenuItem;
  className?: string;
}

const MenuLabel: React.FC<MenuLabelProps> = ({ item, className }) => {
  const { title } = item;
  const { t } = useTranslation();
  return (
    <div
      className={cn(
        "text-default-900 font-semibold uppercase mb-3 text-xs mt-4",
        className
      )}
    >
      {t(title)}
    </div>
  );
};

export default MenuLabel;

