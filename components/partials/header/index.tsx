import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore, useThemeStore } from "@/store";
import { useMediaQuery } from "@/hooks/use-media-query";
// import ThemeButton from "./theme-button";
import ProfileInfo from "./profile-info";
import HorizontalMenu from "./horizontal-menu";
import Language from "./language";
import MobileMenuHandler from "./mobile-menu-handler";
import ClassicHeader from "./layout/classic-header";
import FullScreen from "./full-screen";
import Refresh from "./refresh";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/images/logo/logo_mini_tracegrid.png";
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from "@/context/UserContext";
import { useSelectedCustomerStore } from "@/store/selected-customer";
import { selectCustomer } from "@/models/manager/session";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import CustomSelect from "@/components/partials/manager-header/custom-select";
import { menusConfig } from "@/config/menus";
import { developerMenusConfig } from "@/config/developer-menus";
import { getManagerMenus } from "@/config/manager-menus";

interface NavToolsProps {
  isDesktop: boolean;
  sidebarType: string;
}

const NavTools: React.FC<NavToolsProps> = ({ isDesktop, sidebarType }) => {
  const router = useRouter();
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleHiddenButtonClick = () => {
    const currentTime = Date.now();
    
    // Reset count if more than 1 second has passed since last click
    if (currentTime - lastClickTime > 1000) {
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }
    
    setLastClickTime(currentTime);
  };

  useEffect(() => {
    if (clickCount === 7) {
      router.push('/translations-trG207');
      setClickCount(0); // Reset count after redirect
    }
  }, [clickCount, router]);

  return (
    <div className="nav-tools flex items-center gap-1 sm:gap-2">
      {/* Hidden Button */}
      {/* <button
        type="button"
        onClick={handleHiddenButtonClick}
        style={{
          width: '24px',
          height: '24px',
          opacity: 0,
          cursor: 'pointer',
          marginRight: '-20px',
        }}
        aria-hidden="true"
      /> */}

      {<Language />}
      {isDesktop && <Refresh />}
      {isDesktop && <FullScreen />}
      {/* <ThemeButton /> */}
      {/* <Inbox />
      <NotificationMessage /> */}

      <div className="pl-1">
        <ProfileInfo />
      </div>
      {!isDesktop && sidebarType !== "module" && <MobileMenuHandler />}
    </div>
  );
};

interface HeaderProps {
  handleOpenSearch: () => void;
}

const Header: React.FC<HeaderProps> = () => {
  const { sidebarType, setSidebarType } = useSidebarStore();
  const { navbarType } = useThemeStore();
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const { models: { userProfileData }, operations: { getUserRef } } = useUser();
  
  const pathname = usePathname();
  const router = useRouter();
  const { i18n } = useTranslation();
  const currentLocale = i18n.language;

  // Determine if current path is manager or client based on pathname only
  const isManagerPath = pathname.includes("/manager");
  const isDeveloperPath = pathname.includes("/developer");
  const { t } = useTranslation();
  
  const { 
    selectedCustomerId, 
    setSelectedCustomer,
    customers
  } = useSelectedCustomerStore();
  
  const [selectedValue, setSelectedValue] = useState(selectedCustomerId?.toString() || '');

  const customerOptions = customers.map(customer => ({
    value: customer.id.toString(),
    label: customer.name
  }));

  const handleCustomerSelect = async (value) => {
    if (!isManagerPath) return;
    
    setSelectedValue(value);
    const currentUser = getUserRef();
    if (!currentUser?.token) return;

    try {
      const customer = customers.find(c => c.id === Number(value));
      if (!customer) return;

      const response = await selectCustomer(currentUser.token, customer.id);
      if (response?.success) {
        setSelectedCustomer(customer.id, customer.name);
        
        // Add redirect logic - if on dashboard page, redirect to module overview
        if (pathname.includes('/manager/dashboard')) {
          router.push(`/${currentLocale}/manager/moduleoverview`);
        }
      } else {
        // Check if it's a session expired error
        if (response?.message?.includes('Session expired')) {
          toast.error(t("error.session_expired"));
        } else {
          toast.error(t("error.select_customer"));
        }
      }
    } catch (error) {
      console.error('Error selecting customer:', error);
      // Check if it's a session expired error
      if (error?.message?.includes('Session expired')) {
        toast.error(t("error.session_expired"));
      } else {
        toast.error(t("error.select_customer"));
      }
    }
  };

  // Determine which menus to use based on user role and path
  const hasSelectedCustomer = !!selectedCustomerId;
  
  // Use different menus based on current path
  let menuConfig;
  if (isManagerPath) {
    // For manager pages (based on pathname), use manager menus
    menuConfig = getManagerMenus(hasSelectedCustomer);
  } else if (isDeveloperPath) {
    // For developer pages, use developer menus
    menuConfig = { mainNav: developerMenusConfig.mainNav };
  } else {
    // For client pages (based on pathname), use client menus from menusConfig
    menuConfig = { mainNav: menusConfig.mainNav };
  }

  // set header style to classic if isDesktop
  useEffect(() => {
    if (!isDesktop) {
      setSidebarType("classic");
    }
  }, [isDesktop, setSidebarType]);

  return (
    <ClassicHeader
      className={cn(" ", {
        "sticky top-0 z-50": navbarType === "sticky",
      })}
    >
      {/* <div className="w-full bg-card/90 backdrop-blur-lg lg:px-6 px-[15px] py-3 border-b">
        <div className="flex justify-between items-center h-full">
          <HorizontalHeader handleOpenSearch={handleOpenSearch} />
        </div>
      </div> */}
      {isDesktop ? (
        <div className="bg-card bg-card/90 backdrop-blur-lg w-full px-6 shadow-md  flex justify-between">
          <HorizontalMenu customMenus={menuConfig} />
          <NavTools
            isDesktop={isDesktop}
            sidebarType={sidebarType}
          />
        </div>
      ) :
        <div className="w-full  bg-card/90 backdrop-blur-lg lg:px-6 px-[15px] py-[6px] border-b">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center gap-2">
            <Link
              href={userProfileData?.role === "manager" ? '/manager/dashboard' : '/map'}
              className=" text-primary flex items-center gap-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={logo}
                alt=""
                objectFit="cover"
                className=" mx-auto text-primary h-8 w-8"
              />
            </Link>
             {isManagerPath && (
              <div className='pt-0'>
                <CustomSelect
                  value={selectedValue}
                  onChange={handleCustomerSelect}
                  options={customerOptions}
                  placeholder={t("select_customer")}
                  className='min-w-[200px]'
                  onClear={async () => {
                    setSelectedValue('');
                    
                    const currentUser = getUserRef();
                    if (!currentUser?.token) return;
                    
                    try {
                      const response = await selectCustomer(currentUser.token, 0);
                      if (response?.success) {
                        setSelectedCustomer(null, null);
                      } else {
                        // Check if it's a session expired error
                        if (response?.message?.includes('Session expired')) {
                          toast.error(t("error.session_expired"));
                        } else {
                          toast.error("Error Selecting Customer");
                        }
                      }
                    } catch (error) {
                      console.error('Error deselecting customer:', error);
                      // Check if it's a session expired error
                      if (error?.message?.includes('Session expired')) {
                        toast.error(t("error.session_expired"));
                      } else {
                        toast.error("Error deselecting Customer");
                      }
                    }
                  }}
                />
              </div>
            )}
            </div>
            <div>
            <NavTools isDesktop={isDesktop} sidebarType={sidebarType}/>
            </div>
          </div>
        </div>
      }
    </ClassicHeader>
  );
};

export default Header;
