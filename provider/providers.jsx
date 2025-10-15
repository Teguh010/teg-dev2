"use client";
import { useThemeStore } from "@/store";
import { ThemeProvider } from "next-themes";
import { cn } from "@/lib/utils";
import { ReactToaster } from "@/components/ui/toaster";
import { Toaster } from "react-hot-toast";
import { SonnToaster } from "@/components/ui/sonner";

const Providers = ({ children }) => {
  const { theme, radius } = useThemeStore();

  return (
    <ThemeProvider
      attribute="class"
      enableSystem={false}
      defaultTheme="light"
    >
      <div 
        className={cn("h-full")}
        data-theme={theme}
        style={{
          "--radius": `${radius}rem`,
        }}
      >
        {children}
        <ReactToaster />
        <Toaster />
        <SonnToaster />
      </div>
    </ThemeProvider>
  );
};

export default Providers;
