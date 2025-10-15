import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RefreshCcw } from "lucide-react";
import { useTranslation } from 'react-i18next';

function RefreshToggle() {
  const { t } = useTranslation();

  const reloadPage = () => {
    window.location.reload();
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative lg:h-9 lg:w-9 h-8 w-8 hover:bg-default-100 dark:hover:bg-default-200 data-[state=open]:bg-default-100 dark:data-[state=open]:bg-default-200 hover:text-primary text-default-500 dark:text-default-800 rounded-full"
            onClick={reloadPage}
          >
            <RefreshCcw className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <TooltipArrow className="fill-primary" />
          <p className="capitalize">{ t('general.reload_page')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default RefreshToggle;
