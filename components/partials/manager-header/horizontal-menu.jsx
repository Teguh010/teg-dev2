import React from "react";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { getManagerMenus } from "@/config/manager-menus";
import { cn, firstUpperLetter } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/images/logo/logo_mini_tracegrid.png";
import { useTranslation } from 'react-i18next';
import { useSelectedCustomerStore } from "@/store/selected-customer";

const ListItem = React.forwardRef(
  ({ className, children, title, childItem, ...props }, forwardedRef) => {
    const { t } = useTranslation();
    
    return (
      <NavigationMenu.Link asChild>
        <Link
          className={cn(
            "select-none text-sm text-default-700 rounded-md flex items-center gap-2 mb-4 last:mb-0 leading-none no-underline outline-none transition-colors hover:text-primary focus:text-primary",
            className
          )}
          {...props}
          ref={forwardedRef}
        >
          <div>{children}</div>
          <div>{t(title)}</div>
        </Link>
      </NavigationMenu.Link>
    );
  }
);
ListItem.displayName = "ListItem";

export default function ManagerMenu() {
  const { selectedCustomerId } = useSelectedCustomerStore();
  const hasSelectedCustomer = selectedCustomerId !== null && selectedCustomerId !== undefined;
  const menus = getManagerMenus(hasSelectedCustomer).mainNav || [];
  const { t } = useTranslation();
  const [offset, setOffset] = React.useState();
  const [list, setList] = React.useState();
  const [value, setValue] = React.useState();

  const onNodeUpdate = (trigger, itemValue) => {
    if (trigger && list && value === itemValue) {
      const triggerOffsetLeft = trigger.offsetLeft + trigger.offsetWidth / 6;
      setOffset(Math.round(triggerOffsetLeft));
    } else if (value === "") {
      setOffset(null);
    }
    return trigger;
  };

  return (
    <div>
      <NavigationMenu.Root
        onValueChange={setValue}
        className="flex relative justify-start group"
      >
        <NavigationMenu.List
          ref={setList}
          className="group flex list-none gap-5"
        >
          {menus?.map((item, index) => (
            <NavigationMenu.Item key={`item-${index}`} value={item}>
              <NavigationMenu.Trigger
                ref={(node) => onNodeUpdate(node, item)}
                asChild
                className="flex items-center"
              >
                <div
                  className="flex items-center py-4 cursor-pointer group data-[state=open]:text-primary"
                  aria-controls={`radix-:rd:-content-${index}`}
                  id={`radix-:rd:-trigger-${index}`}
                >
                  <item.icon className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium text-default-700">
                    {t(item.title)}
                  </span>
                  {item.child && (
                    <ChevronDown
                      className="relative top-[1px] ml-1 h-4 w-4 transition duration-200 group-data-[state=open]:rotate-180"
                      aria-hidden="true"
                    />
                  )}
                </div>
              </NavigationMenu.Trigger>
              {item.child && (
                <NavigationMenu.Content
                  id={`radix-:rd:-content-${index}`}
                  key={`${item.title}-${index}`}
                  aria-labelledby={`radix-:rd:-trigger-${index}`}
                  aria-owns={`radix-:rd:-content-${index}`}
                  className={cn(
                    "w-full rounded-md border bg-popover text-popover-foreground shadow-lg"
                  )}
                >
                  <div className="min-w-[200px] p-4">
                    {item.child?.map((childItem, index) => (
                      <ListItem
                        className="text-sm font-medium text-default-700"
                        key={`${childItem.title}-${index}`}
                        title={t(childItem.title)}
                        href={childItem.href}
                        childItem={childItem}
                      >
                        <childItem.icon className="h-5 w-5" />
                      </ListItem>
                    ))}
                  </div>
                </NavigationMenu.Content>
              )}
            </NavigationMenu.Item>
          ))}
        </NavigationMenu.List>

        <div className="absolute top-full">
          <NavigationMenu.Viewport
            style={{
              display: !offset ? "none" : undefined,
              transform: `translateX(${offset}px)`,
              top: "100%",
              transition: "all 0.5s ease",
            }}
          />
        </div>
      </NavigationMenu.Root>
    </div>
  );
}