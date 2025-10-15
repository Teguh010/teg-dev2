"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useMounted } from "@/hooks/use-mounted";
import LayoutLoader from "@/components/layout-loader";
import Header from "@/components/partials/header";
import MobileSidebar from "@/components/partials/sidebar/mobile-sidebar";
import HeaderSearch from "@/components/header-search";
import withAuth from '@/hooks/withAuth';
import { controller } from "./controller";
import { useMaintenance } from "@/context/MaintenanceContext";
import ReusableDialog from "@/components/organisms/ReusableDialog";
import ErrorMaintenance from "@/components/error-maintenance";

const LayoutWrapper = ({ children, setOpen, open, location }) => {
  return (
    <>
      <motion.div
        key={location}
        initial="pageInitial"
        animate="pageAnimate"
        exit="pageExit"
        variants={{
          pageInitial: {
            opacity: 0,
            y: 50,
          },
          pageAnimate: {
            opacity: 1,
            y: 0,
          },
          pageExit: {
            opacity: 0,
            y: -50,
          },
        }}
        transition={{
          type: "tween",
          ease: "easeInOut",
          duration: 0.5,
        }}
      >
        <main>{children}</main>
      </motion.div>

      <MobileSidebar className="left-[300px]" />
      <HeaderSearch open={open} setOpen={setOpen} />
    </>
  );
};

const MainLayout = ({ children }) => {
  const [open, setOpen] = useState(false);
  const location = usePathname();
  const mounted = useMounted();
  const { models } = controller();
  const { isMaintenanceMode, setMaintenanceMode } = useMaintenance();

  if (!mounted || models.loading) {
    return <LayoutLoader />;
  }

  return (
    <>
      <Header handleOpenSearch={() => setOpen(true)} />
      <div className={cn("content-wrapper transition-all duration-150 ")}>
        <div
          className={cn(
            location.includes ("/map") || location.includes ("/map-route") || location.includes ("/toll-cost")
              ? "p-0 page-min-height-horizontal" 
              : "lg:pt-6 pt-[15px] lg:px-6 px-4 page-min-height-horizontal"
          )}
        >
          <LayoutWrapper
            setOpen={setOpen}
            open={open}
            location={location}
          >
            {children}
          </LayoutWrapper>
        </div>
      </div>
      {isMaintenanceMode && 
       <ReusableDialog
        isOpen={isMaintenanceMode}
        triggerLabel=""
      >
       <ErrorMaintenance />
      </ReusableDialog>
      }
    </>
  );
};

export default withAuth(MainLayout);
