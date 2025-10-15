"use client";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import Link from "next/link";

const ErrorMaintenance = () => {
  const { theme } = useTheme();
  return (
    <div className="flex justify-center items-center p-10">
      <div className="w-full flex flex-col items-center">
        <div className="max-w-[740px]">
        </div>
        <div className="mt-16 text-center">
          <div className="text-2xl lg:text-4xl lg:text-5xl font-semibold text-default-900">
            Tracegrid Under Maintenance
          </div>
          <div className="mt-3 text-default-600 text-sm lg:text-base">
            Sorry for the inconvenience. Tracegrid is currently upgrading
            <br /> to improve our services. Please check back later. We'll be back soon!
          </div>
          <Button asChild className="mt-9 lg:min-w-[300px]" size="lg">
            <Link href="/map">Go Back to Homepage</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ErrorMaintenance;
