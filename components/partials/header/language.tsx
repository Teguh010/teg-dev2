"use client";
import Image, { StaticImageData } from "next/image";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from 'next/navigation';
import { useTranslation } from "react-i18next";
import flag1 from "@/public/images/all-img/flag-1.png";
import flag2 from "@/public/images/all-img/flag-4.png";
import flag3 from "@/public/images/all-img/flag_francia.webp";
import flag4 from "@/public/images/all-img/images_lt.png";
import flag5 from "@/public/images/all-img/indonesia_flag.png";
import flag6 from "@/public/images/all-img/Flag_Russia.png";
import flag7 from "@/public/images/all-img/flag_noruega.png";
import i18nConfig from '@/app/i18nConfig';
import { useUser } from "@/context/UserContext";

type LanguageOption = {
  name: string;
  slug: string;
  flag: StaticImageData;
};

const data: LanguageOption[] = [
  {
    name: "En",
    slug: "en",
    flag: flag1
  },
  {
    name: "Es",
    slug: "es",
    flag: flag2
  },
  {
    name: "Fr",
    slug: "fr",
    flag: flag3
  },
  {
    name: "Lt",
    slug: "lt",
    flag: flag4
  },
  {
    name: "ID",
    slug: "id",
    flag: flag5
  },
  {
    name: "Ru",
    slug: "ru",
    flag: flag6
  },
  {
    name: "No",
    slug: "no",
    flag: flag7
  },
];

const Language = () => {
  const { i18n } = useTranslation();
  const currentLocale = i18n.language;
  const router = useRouter();
  const currentPathname = usePathname();
  const UserContext = useUser();
  const { settings } = UserContext.models;
  const { setSettings } = UserContext.operations;

  // Initialize selected based on current locale from URL/i18n
  const [selected, setSelected] = useState<LanguageOption>(() => {
    const localeFromUrl = currentLocale || 'en';
    return data.find(item => item.slug === localeFromUrl) || data[0];
  });

  const handleLanguageChange = useCallback((item: LanguageOption) => () => {
    const updatedSettings = [...settings];
    const newLocale = item.slug;
    const isDefaultLocale = currentLocale === i18nConfig.defaultLocale;
    const languageSettingIndex = settings.findIndex(setting => setting.title === "language");

    if (languageSettingIndex !== -1) {
      updatedSettings[languageSettingIndex] = {
        ...updatedSettings[languageSettingIndex],
        value: newLocale
      };
    } else {
      updatedSettings.unshift({ title: "language", value: newLocale });
    }

    setSettings(updatedSettings);
    const newPathname = isDefaultLocale
      ? `/${newLocale}${currentPathname}`
      : currentPathname.replace(`/${currentLocale}`, `/${newLocale}`);

    router.push(newPathname);
    router.refresh();
  }, [currentLocale, currentPathname, router, settings, setSettings]);

  // Sync selected with settings from UserContext
  useEffect(() => {
    if (settings && settings.length > 0) {
      const languageSetting = settings.find((setting: { title: string; }) => setting.title === "language");
      if (languageSetting) {
        const foundItem = data.find((item) => item.slug === languageSetting.value);
        if (foundItem) {
          setSelected(foundItem);
        }
      }
    }
  }, [settings]);

  // Sync selected with current locale from i18n/URL (important for initial load and navigation)
  useEffect(() => {
    if (currentLocale) {
      const foundItem = data.find((item) => item.slug === currentLocale);
      if (foundItem && foundItem.slug !== selected.slug) {
        setSelected(foundItem);
      }
    }
  }, [currentLocale, selected.slug]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button" className="bg-transparent hover:bg-transparent px-1 ml-1">
          <span className="w-6 h-6 rounded-full sm:mr-1.5">
            <Image
              src={selected ? selected.flag : flag1}
              alt=""
              className="w-full h-full object-cover rounded-full" />
          </span>
          <span className="text-sm text-default-600 hidden sm:inline-block">{selected ? selected.name : "En"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2">
        {
          data.map((item, index) => (
            <DropdownMenuItem
              key={`flag-${index}`}
              className={cn("py-1.5 px-2 cursor-pointer dark:hover:bg-background mb-[2px] last:mb-0", {
                "bg-primary-100 ": selected && selected.name === item.name
              })}
              onClick={handleLanguageChange(item)}
            >
              <span className="w-6 h-6 rounded-full mr-1.5">
                <Image src={item.flag} alt="" className="w-full h-full object-cover rounded-full" />
              </span>
              <span className="text-sm text-default-600">{item.name}</span>
              {
                selected && selected.name === item.name &&
                <Check className="w-4 h-4 flex-none ml-auto text-default-700" />
              }

            </DropdownMenuItem>
          ))
        }
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Language;
