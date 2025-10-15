"use client";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface LanguageSelectorProps {
  languages: { name: string; slug: string; flag: any }[];
  selectedLanguage: string;
  onSelect: (slug: string) => void;
}

const LanguageSelector = ({ languages, selectedLanguage, onSelect }: LanguageSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded">
          <div className="w-6 h-6 rounded-full">
            <Image
              src={languages.find(lang => lang.slug === selectedLanguage)?.flag}
              alt=""
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <span className="text-sm text-default-600">
            {languages.find(lang => lang.slug === selectedLanguage)?.name}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="p-2">
        {languages.map((item) => (
          <DropdownMenuItem
            key={item.slug}
            className={cn("py-1.5 px-2 cursor-pointer dark:hover:bg-background", {
              "bg-primary-100": selectedLanguage === item.slug
            })}
            onClick={() => onSelect(item.slug)}
          >
            <div className="w-6 h-6 rounded-full mr-1.5">
              <Image src={item.flag} alt="" className="w-full h-full object-cover rounded-full" />
            </div>
            <span className="text-sm text-default-600">{item.name}</span>
            {selectedLanguage === item.slug && (
              <Check className="w-4 h-4 flex-none ml-auto text-default-700" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector; 