import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore, useThemeStore } from "@/store";
import { useSelectedCustomerStore } from "@/store/selected-customer";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useUser } from "@/context/UserContext";
import ThemeButton from "../header/theme-button";
import ProfileInfo from "./profile-info";
import Language from "../header/language";
import ClassicHeader from "../header/layout/classic-header";
import FullScreen from "../header/full-screen";
import Refresh from "../header/refresh";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/images/logo/logo_mini_tracegrid.png";
import { useRouter, usePathname } from 'next/navigation';
import ManagerHorizontalMenu from "./horizontal-menu";
import CustomSelect from "@/components/partials/manager-header/custom-select";
import { selectCustomer } from "@/models/manager/session";

const ManagerHeader = ({ handleOpenSearch }) => {
  const { sidebarType, setSidebarType } = useSidebarStore();
  const { navbarType } = useThemeStore();
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const { i18n, t } = useTranslation();
  const currentLocale = i18n.language;
  const { getUserRef } = useUser().operations;
  
  const { 
    selectedCustomerId, 
    selectedCustomerName,
    setSelectedCustomer,
    customers,
    isLoading
  } = useSelectedCustomerStore();

  const [selectedValue, setSelectedValue] = useState(selectedCustomerId?.toString() || '');

  const customerOptions = customers.map(customer => ({
    value: customer.id.toString(),
    label: customer.name
  }));

  const handleCustomerSelect = async (value) => {
    setSelectedValue(value); // Update local state
    const currentUser = getUserRef();
    if (!currentUser?.token) return;

    try {
      const customer = customers.find(c => c.id === Number(value));
      if (!customer) return;

      const response = await selectCustomer(currentUser.token, customer.id);
      if (response?.success) {
        setSelectedCustomer(customer.id, customer.name);
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

  useEffect(() => {
    if (!isDesktop) {
      setSidebarType("classic");
    }
  }, [isDesktop, setSidebarType]);

  return (
    <ClassicHeader
      className={cn(" ", {
        "sticky top-0 z-50": navbarType === "sticky"
      })}
    >
      {isDesktop ? (
        <div className='bg-card bg-card/90 backdrop-blur-lg w-full px-6 shadow-md flex justify-between'>
          <div className='flex items-center gap-4'>
            {" "}
            {/* Add container for left side */}
            <Link
              href={`/${currentLocale}/manager`}
              className='text-primary flex items-center gap-2'
            >
              <Image src={logo} alt='Manager Dashboard' className='mx-auto text-primary h-8 w-8' />
            </Link>
            <CustomSelect
              value={selectedValue}
              onChange={handleCustomerSelect}
              options={customerOptions}
              placeholder={t("select_customer")}
              disabled={isLoading}
              className='min-w-[200px]'
              onClear={() => setSelectedValue('')}
            />
            <ManagerHorizontalMenu />
          </div>
          <div className='nav-tools flex items-center gap-2'>
            <Language />
            {isDesktop && <Refresh />}
            {isDesktop && <FullScreen />}
            <ThemeButton />
            <div className='pl-2'>
              <ProfileInfo />
            </div>
          </div>
        </div>
      ) : (
        <div className='w-full bg-card/90 backdrop-blur-lg lg:px-6 px-[15px] py-[6px] border-b'>
          <div className='flex justify-between items-center h-full'>
            <div className='flex items-center gap-2'>
              {" "}
              {/* Add container for mobile */}
              <Link
                href={`/${currentLocale}/manager`}
                className='text-primary flex items-center gap-2'
              >
                <Image
                  src={logo}
                  alt='Manager Dashboard'
                  className='mx-auto text-primary h-8 w-8'
                />
              </Link>
              <CustomSelect
                value={selectedValue}
                onChange={handleCustomerSelect}
                options={customerOptions}
                placeholder={t("select_customer")}
                disabled={isLoading}
                className='min-w-[200px]'
                onClear={() => setSelectedValue('')}
              />
            </div>
            <div className='nav-tools flex items-center gap-2'>
              <Language />
              <ThemeButton />
              <div className='pl-2'>
                <ProfileInfo />
              </div>
            </div>
          </div>
        </div>
      )}
    </ClassicHeader>
  )
};

export default ManagerHeader;
