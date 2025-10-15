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
  const [unitDistance, setUnitDistance] = useState(settings.find(setting => setting.title === "unit_distance")?.value);
  const [unitVolume, setUnitVolume] = useState(settings.find(setting => setting.title === "unit_volume")?.value);
  const [dateFormat, setDateFormat] = useState(settings.find(setting => setting.title === "date_format")?.value);
  const [timeFormat, setTimeFormat] = useState(settings.find(setting => setting.title === "time_format")?.value);

  const unitDistances = [
    {
      title: t('general.km'),
      value: "km",
    },
    {
      title: t('general.mi'),
      value: "mi",
    },
    {
      title: t('general.swedish_mi'),
      value: "swedish_mi",
    },
  ]
  const unitVolumes = [
    {
      title: t('general.l'),
      value: "l",
    },
    {
      title: t('general.gal'),
      value: "gal",
    },
  ]
  const dateFormats = [
    {
      title: `${t('general.days')}/${t('general.months')}/${t('general.years')}`,
      value: `dd/MM/yyyy`,
    },
    {
      title: `${t('general.months')}/${t('general.days')}/${t('general.years')}`,
      value: `MM/dd/yyyy`,
    },
    {
      title: `${t('general.years')}-${t('general.months')}-${t('general.days')}`,
      value: `yyyy-MM-dd`,
    }
  ]
  const timeFormats = [
    {
      title: `${t('general.12_hours')}`,
      value: `HH:mm:ss`,
    },
    {
      title: `${t('general.12_hours')}`,
      value: `h:mm:ssaaa`,
    }
  ]

  const unitDistanceChange = (value) => {
    const unitDistanceSettingIndex = settings.findIndex(setting => setting.title === "unit_distance");
    const updatedSettings = [...settings];

    if (unitDistanceSettingIndex !== -1) {
      updatedSettings[unitDistanceSettingIndex] = {
        ...updatedSettings[unitDistanceSettingIndex],
        value: value
      };
    } else {
      updatedSettings.unshift({ title: "unit_distance", value: value });
    }

    setSettings(updatedSettings);
    const settingValue = updatedSettings.find(setting => setting.title === "unit_distance").value;
    setUnitDistance(settingValue);
  };

  const unitVolumeChange = (value) => {
    const unitVolumeSettingIndex = settings.findIndex(setting => setting.title === "unit_volume");
    const updatedSettings = [...settings];

    if (unitVolumeSettingIndex !== -1) {
      updatedSettings[unitVolumeSettingIndex] = {
        ...updatedSettings[unitVolumeSettingIndex],
        value: value
      };
    } else {
      updatedSettings.unshift({ title: "unit_volume", value: value });
    }

    setSettings(updatedSettings);
    const settingValue = updatedSettings.find(setting => setting.title === "unit_volume").value;
    setUnitVolume(settingValue);
  };

  const dateFormatChange = (value) => {
    const dateFormatSettingIndex = settings.findIndex(setting => setting.title === "date_format");
    const updatedSettings = [...settings];

    if (dateFormatSettingIndex !== -1) {
      updatedSettings[dateFormatSettingIndex] = {
        ...updatedSettings[dateFormatSettingIndex],
        value: value
      };
    } else {
      updatedSettings.unshift({ title: "date_format", value: value });
    }

    setSettings(updatedSettings);
    const settingValue = updatedSettings.find(setting => setting.title === "date_format").value;
    setDateFormat(settingValue);
  };

  const timeFormatChange = (value) => {
    const timeFormatSettingIndex = settings.findIndex(setting => setting.title === "time_format");
    const updatedSettings = [...settings];

    if (timeFormatSettingIndex !== -1) {
      updatedSettings[timeFormatSettingIndex] = {
        ...updatedSettings[timeFormatSettingIndex],
        value: value
      };
    } else {
      updatedSettings.unshift({ title: "time_format", value: value });
    }

    setSettings(updatedSettings);
    const settingValue = updatedSettings.find(setting => setting.title === "time_format").value;
    setTimeFormat(settingValue);
  };

  useEffect(() => {
    if (settings.length > 0) {
      settings.map((setting) => {
        if (setting.title === "time_format") {
          setTimeFormat(setting.value);
        }
        if (setting.title === "unit_distance") {
          setUnitDistance(setting.value)
        }
        if (setting.title === "unit_volume") {
          setUnitVolume(setting.value)
        }
        if (setting.title === "date_format") {
          setDateFormat(setting.value)
        }
      })
    }
  }, [settings]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className=' cursor-pointer'>
        <div className=' flex items-center  '>
          <Icon
            icon='fa-solid:user-circle'
            className='w-7 h-7 rounded-full text-white bg-gray-700'
          />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56 p-0' align='end'>
        <DropdownMenuLabel className='flex gap-2 items-center mb-1 p-3'>
          {/* <Image src={avatar5} alt='' width={36} height={36} className='rounded-full' style={{ maxWidth: "50px !important" }} /> */}

          <div>
            <div className='text-sm font-medium text-default-800 capitalize '>
              {userProfileData?.customer}
            </div>
            <Link href='/map' className='text-xs text-default-600 hover:text-primary'>
              @{userProfileData?.username}
            </Link>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className='cursor-pointer flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background'>
              <Icon icon='ri:time-zone-line' className='w-4 h-4' />
              {firstUpperLetter(t("general.date_format"))}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {dateFormats.map((item, index) => (
                  <DropdownMenuItem
                    key={`message-sub-${index}`}
                    className='text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer'
                    onClick={() => dateFormatChange(item.value)}
                  >
                    {dateFormat === item.value ? (
                      <>
                        {item.title}
                        <Icon icon='heroicons:check-16-solid' className='w-4 h-4' />
                      </>
                    ) : (
                      item.title
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className='cursor-pointer flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background'>
              <Icon icon='mingcute:time-line' className='w-4 h-4' />
              {firstUpperLetter(t("general.time_format"))}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {timeFormats.map((item, index) => (
                  <DropdownMenuItem
                    key={`message-sub-${index}`}
                    className='text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer'
                    onClick={() => timeFormatChange(item.value)}
                  >
                    {timeFormat === item.value ? (
                      <>
                        {item.title}
                        <Icon icon='heroicons:check-16-solid' className='w-4 h-4' />
                      </>
                    ) : (
                      item.title
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className='cursor-pointer flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background'>
              <Icon icon='material-symbols-light:distance-outline-rounded' className='w-4 h-4' />
              {firstUpperLetter(t("general.unit_distance"))}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {unitDistances.map((item, index) => (
                  <DropdownMenuItem
                    key={`message-sub-${index}`}
                    className='text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer'
                    onClick={() => unitDistanceChange(item.value)}
                  >
                    {unitDistance === item.value ? (
                      <>
                        {item.title}
                        <Icon icon='heroicons:check-16-solid' className='w-4 h-4' />
                      </>
                    ) : (
                      item.title
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className='cursor-pointer flex items-center gap-2 text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background'>
              <Icon icon='ion:water-outline' className='w-4 h-4' />
              {firstUpperLetter(t("general.unit_volume"))}
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {unitVolumes.map((item, index) => (
                  <DropdownMenuItem
                    key={`message-sub-${index}`}
                    className='text-sm font-medium text-default-600 capitalize px-3 py-1.5 dark:hover:bg-background cursor-pointer'
                    onClick={() => unitVolumeChange(item.value)}
                  >
                    {unitVolume === item.value ? (
                      <>
                        {item.title}
                        <Icon icon='heroicons:check-16-solid' className='w-4 h-4' />
                      </>
                    ) : (
                      item.title
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className='mb-0 dark:bg-background' />
        <DropdownMenuItem
          className='flex items-center gap-2 text-sm font-medium text-default-600 my-1 px-3 dark:hover:bg-background cursor-pointer'
          onClick={() => {
            clearUser()
            const isManagerToken = localStorage.getItem("is-manager-token") == "true"
            const isManagerPath = window.location.pathname.includes("/manager")

            if (isManagerToken || isManagerPath) {
              window.location.assign("/manager/login")
            } else {
              window.location.assign("/")
            }
          }}
        >
          <Icon icon='heroicons:power' className='w-4 h-4' />
          {firstUpperLetter(t("general.log_out"))}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
};
export default ProfileInfo;
