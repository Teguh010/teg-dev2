import { Button } from "@/components/ui/button";
import { Expand } from "@/public/svg";
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';

function FullScreenToggle() {
  const { t } = useTranslation();

  const toggleFullScreen = () => {
    const doc = window.document;
    const docEl = doc.documentElement;

    const requestFullScreen =
      docEl.requestFullscreen 
    const cancelFullScreen =
      doc.exitFullscreen 

    if (
      !doc.fullscreenElement 
    ) {
      requestFullScreen.call(docEl);
    } else {
      cancelFullScreen.call(doc);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={toggleFullScreen}
            variant="ghost"
            size="icon"
            className="relative lg:h-9 lg:w-9 h-8 w-8 hover:bg-default-100 dark:hover:bg-default-200 data-[state=open]:bg-default-100 dark:data-[state=open]:bg-default-200 hover:text-primary text-default-500 dark:text-default-800 rounded-full"
          >
            <Expand className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <TooltipArrow className="fill-primary" />
          <p className="capitalize">{t('general.full_screen')}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default FullScreenToggle;
