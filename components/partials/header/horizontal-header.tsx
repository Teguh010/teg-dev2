import { Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/images/logo/logo_mini_tracegrid.png";
import { useTranslation } from 'react-i18next';


interface HorizontalHeaderProps {
  handleOpenSearch: () => void;
}

const horizontalHeader: React.FC<HorizontalHeaderProps>  = ({ handleOpenSearch }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="flex items-center lg:gap-12 gap-3 ">
        <div>
          <Link
            href="/map"
            className="text-primary flex items-center gap-2"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
                src={logo}
                alt=""
                objectFit="cover"
                className="mx-auto text-primary h-8 w-8"
              />
          </Link>
        </div>
        <button
          onClick={handleOpenSearch}
          className="inline-flex lg:gap-2 lg:mr-0 mr-2 items-center text-default-600 text-sm"
        >
          <span>
            <Search className="h-4 w-4" />
          </span>
          <span className="lg:inline-block hidden">{t('general.search')}...</span>
        </button>
      </div>
    </>
  );
};

export default horizontalHeader;
