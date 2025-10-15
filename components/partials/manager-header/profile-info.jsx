"use client";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuTrigger,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { Switch } from "@/components/ui/switch";
import Image from "next/image";
import Link from "next/link";
import avatar5 from "@/public/images/avatar/avatar-5.jpg";
import { useTranslation } from 'react-i18next';
import { firstUpperLetter } from "@/lib/utils";
import { useUser } from "@/context/UserContext";

const ProfileInfo = () => {
  const UserContext = useUser();
  const {  settings, userProfileData } = UserContext.models;
  const { setSettings, clearUser } = UserContext.operations;
  const { t } = useTranslation();
  /*  const [is24FormarHour, setIs24FormarHour] = useState(() => {
     const setting = settings.find(setting => setting.title === "24_format_hour");
     return setting ? setting.value === true : false;
   }); */
 
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className=' cursor-pointer'>
        <div className=' flex items-center  '>
          <Image src={avatar5} alt='' width={36} height={36} className='rounded-full' />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56 p-0' align='end'>
        <DropdownMenuLabel className='flex gap-2 items-center mb-1 p-3'>
          <Image src={avatar5} alt='' width={36} height={36} className='rounded-full' />

          <div>
            <div className='text-sm font-medium text-default-800 capitalize '>
              {userProfileData?.customer}
            </div>
            <Link href='/map' className='text-xs text-default-600 hover:text-primary'>
              @{userProfileData?.username}
            </Link>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className='mb-0 dark:bg-background' />
        <DropdownMenuItem
          className='flex items-center gap-2 text-sm font-medium text-default-600 my-1 px-3 dark:hover:bg-background cursor-pointer'
          onClick={() => {
            clearUser()
            window.location.assign('/manager/login')
          }}
        >
          <Icon icon='heroicons:power' className='w-4 h-4' />
          {firstUpperLetter(t('general.log_out'))}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
};
export default ProfileInfo;
