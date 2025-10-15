"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContentWrapper } from "@/components/ui/dialog";
import Image from "next/image";
import LogInForm from "@/components/auth/manager-login-form";
import background from "@/public/images/auth/line.png";
import { isLocationAllowed } from "@/lib/geo-restriction";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

const LoginPage = () => {
  const [isAllowed, setIsAllowed] = useState(true);
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const currentLocale = i18n.language;

  useEffect(() => {
    const checkLocationAccess = async () => {
      try {
        const allowed = await isLocationAllowed();
        setIsAllowed(allowed);
        
        if (!allowed) {
          router.push(`/${currentLocale}`);
        }
      } catch (error) {
        console.error('Error checking location access:', error);
        setIsAllowed(false);
        router.push(`/${currentLocale}`);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkLocationAccess();
  }, [router, currentLocale, t]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!isAllowed) {
    return null;
  }

  return (
    <>
      <div className="min-h-screen bg-background  flex items-center  overflow-hidden w-full">
        <div className="min-h-screen basis-full flex flex-wrap w-full  justify-center overflow-y-auto">
          <div
            className="basis-1/2 bg-primary w-full  relative hidden xl:flex justify-center items-center bg-gradient-to-br
          from-primary-600 via-primary-400 to-primary-600
         "
          >
            <Image
              src={background}
              alt="image"
              className="absolute top-0 left-0 w-full h-full "
            />
            <div className="relative z-10 backdrop-blur bg-primary-foreground/40 py-14 px-16 2xl:py-[84px] 2xl:pl-[50px] 2xl:pr-[136px] rounded max-w-[640px]">
              <div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-transparent hover:bg-transparent h-fit w-fit p-0"
                    >
                      <Icon
                        icon="heroicons:play-solid"
                        className="text-primary-foreground h-[78px] w-[78px] -ml-2"
                      />
                    </Button>
                  </DialogTrigger>
                  <DialogContentWrapper size="xl" className="p-0 justify-center" hiddenCloseIcon={true}>
                    <iframe
                      width="625"
                      height="315"
                      src="https://www.youtube.com/embed/hoa_2AlzWOo?si=_1Tq2U0uheKNSuYk"
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen>
                    </iframe>
                  </DialogContentWrapper>
                </Dialog>

                <div className="text-4xl leading-[50px] 2xl:text-5xl 2xl:leading-[72px] font-semibold mt-2.5">
                  <span className="text-default-600 dark:text-default-300 ">
                    LOCATE VEHICLES<br />
                    SAVE FUEL AND<br />
                  </span>
                  <span className="text-default-900 dark:text-default-50">
                    MANAGE TACHOGRAPHS
                  </span>
                </div>
                <div className="mt-5 2xl:mt-8 text-default-900 dark:text-default-200  text-2xl font-medium">
                  Web-based software that helps<br />
                  to manage all types of vehicle fleets and cargo.
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-screen basis-full md:basis-1/2 w-full px-4 py-5 flex justify-center items-center">
            <div className="lg:w-[480px] ">
              <LogInForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;
