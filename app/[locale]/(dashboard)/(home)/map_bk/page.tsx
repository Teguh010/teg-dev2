"use client";
import { Key, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { controller } from "./controller";
import { useTranslation } from 'react-i18next';
import LayoutLoader from '@/components/layout-loader';
import {
  Accordion,
  AccordionContentWrapper as AccordionContent,
  AccordionItemWrapper as AccordionItem,
  AccordionTriggerWrapper as Trigger,
} from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { Icon } from "@iconify/react";
import BasicMap from "./components/basic-map";
import { HereMap } from "@/components/maps/here-map/HereMap";
import loadHereMaps from '@/components/maps/here-map/utils/here-map-loader';

const Home = () => {
  const { t } = useTranslation();
  const { models, operations } = controller();
  const [activeItem, setActiveItem] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    loadHereMaps(() => setMapLoaded(true));
  }, []);

  if (models.isLoading || !models.user || !models.dataObjectList || !mapLoaded) {
    return <LayoutLoader />;
  }


  const AccordionTrigger = ({ children, value, activeItem, setActiveItem }) => {
    const isOpen = activeItem === value;

    const toggleOpen = () => {
      setActiveItem(isOpen ? null : value);
    };

    return (
      <Trigger arrow onClick={toggleOpen}>
        <div className=" flex space-x-2  items-center">
          <div
            className={cn(
              " h-4 w-4  inline-flex items-center justify-center rounded",
              {
                "bg-primary/10": !isOpen,
                "bg-primary text-primary-foreground": isOpen,
              }
            )}
          >
            {isOpen ? (
              <Icon icon="heroicons:minus" className=" h-5 w-5" />
            ) : (
              <Icon icon="heroicons:plus-small-solid" className=" h-5 w-5" />
            )}
          </div>

          <div> {children}</div>
        </div>
      </Trigger>
    );
  };

  const CollapseIconAccordion = () => {
    return (
      <Accordion type="single" collapsible className="w-full space-y-0">
        {models.dataObjectList.map((object: any, index: Key) => {
          const handleTriggerClick = (value: string) => {
            setActiveItem(value);
            operations.setVehicle(object);
          };

          return <AccordionItem value={"item-" + index} key={index} className="rounded-none py-3">
            <AccordionTrigger
              value={"item-" + index}
              activeItem={activeItem}
              setActiveItem={handleTriggerClick}
            >
              {object[t('general.name')]}
            </AccordionTrigger>
            <AccordionContent>
              Lemon drops chocolate cake gummies carrot cake chupa chups muffin
              topping. Sesame snaps icing marzipan gummi bears macaroon dragée
              danish caramels powder. Bear claw dragée pastry topping soufflé. Wafer
              gummi bears marshmallow pastry pie.
            </AccordionContent>
          </AccordionItem>;
        })}
      </Accordion>
    );
  };

  return (
    <>
      {models.dataObjectList ? (
        <div className="flex flex-col md:flex-row gap-2">
          <Card title="Collapse Icon Accordion" className='p-0 md:w-1/6'>
            <CollapseIconAccordion />
          </Card>
          {!activeItem ?
            <Card title="Collapse Icon Accordion" className='md:w-5/6 h-fit'>
              <CardContent className='p-1'>
                <HereMap locations={models.dataObjectList} />
              </CardContent>
            </Card> :
            <Card title="Collapse Icon Accordion" className='md:w-5/6 h-fit'>
              <CardContent className='p-1'>
                {models.vehicle
                  ? <HereMap lat={models.vehicle[t('lat')]} lon={models.vehicle[t('lon')]} />
                  : <HereMap lat={56.31226} lon={22.3230616} />
                }
              </CardContent>
            </Card>
          }
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-5">
          <Card title="Collapse Icon Accordion" className='p-6'>
            <p className="text-sm text-default-400 dark:text-default-600">
              The user does not have vehicles.
            </p>
          </Card>
        </div>
      )}
    </>
  );
};

export default Home;
