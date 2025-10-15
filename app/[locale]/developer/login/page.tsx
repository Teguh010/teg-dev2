"use client";
import { useState } from "react";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContentWrapper } from "@/components/ui/dialog";
import Image from "next/image";
import LogInForm from "@/components/auth/developer-login-form";
import background from "@/public/images/auth/line.png";

const DeveloperLoginPage = () => {
  const [openVideo, setOpenVideo] = useState(false);

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
                    DEVELOPER AREA<br />
                  </span>
                  <span className="text-default-900 dark:text-default-50">
                    INTERNAL ACCESS ONLY
                  </span>
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

export default DeveloperLoginPage;


