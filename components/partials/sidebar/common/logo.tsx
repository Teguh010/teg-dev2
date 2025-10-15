import { useSidebarStore } from "@/store";

interface SidebarLogoProps {
  hovered?: boolean;
  collapsed: boolean;
}

const SidebarLogo: React.FC<SidebarLogoProps> = ({ hovered, collapsed }) => {
  const { setCollapsed, /* collapsed */ } = useSidebarStore();

  return (
    <div className="px-4 py-4">
      <div className="flex items-center">
        <div className="flex flex-1 items-center space-x-3">
          {!collapsed || hovered ? (
            <div className="flex-1 text-xl text-primary font-semibold">
              TraceGrid
            </div>
          ) : null}
        </div>
        <div className="flex-none lg:block hidden">
          <div
            onClick={() => setCollapsed(!collapsed)}
            className={`h-4 w-4 border-[1.5px] border-default-900 dark:border-default-200 rounded-full transition-all duration-150
                ${collapsed
                ? ""
                : "ring-2 ring-inset ring-offset-4 ring-default-900 bg-default-900 dark:ring-offset-default-300"}
              `}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default SidebarLogo;

