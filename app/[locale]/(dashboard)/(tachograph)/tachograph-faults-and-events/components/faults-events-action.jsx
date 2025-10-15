"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from 'react-i18next';
import { firstUpperLetter } from "@/lib/utils";
import AdvancedTable from '@/components/partials/advanced';

const FaultsEventsAction = ({ dataList }) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap  gap-x-5 gap-y-4 ">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" color="default" size="xxs">{firstUpperLetter(t('general.view'))}</Button>
        </DialogTrigger>
        <DialogContent size="5xl">
          {/* <DialogHeader>
            <DialogTitle className="text-base font-medium text-default-700 ">
              What is the world's number one tourist destination?
            </DialogTitle>
          </DialogHeader> */}
          <div className='space-y-6 pt-6'>
            <div className='grid grid-cols-12gap-6'>
              <div className='col-span-12 lg:col-span-12 overflow-x-auto'>
                <AdvancedTable
                  dataList={dataList}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="mt-8">
            <DialogClose asChild>
              <Button type="submit" variant="outline">
                {firstUpperLetter(t('general.close'))}
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FaultsEventsAction;
