'use client'
import React from 'react'
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible'
import CustomInput from './custom-input'
import { useTranslation } from 'react-i18next'

interface CollapsibleComponentProps {
  open?: boolean // Boolean to control if the collapsible is open
  handleSetMinMoving: (value: number) => void
  minMoving: number
  handleSetMinStationary: (value: number) => void
  minStationary: number
  handleSetShowStationaryIgnition: (value: boolean) => void
  showStationaryIgnition: boolean
}

const CollapsibleComponent: React.FC<CollapsibleComponentProps> = ({
  open,
  handleSetMinMoving,
  minMoving,
  handleSetMinStationary,
  minStationary,
  handleSetShowStationaryIgnition,
  showStationaryIgnition,
}) => {
  const { t } = useTranslation()

  return (
    <Collapsible open={open}>
      <CollapsibleContent className='CollapsibleContent'>
        {/* Input untuk Min Moving */}
        <div className='flex flex-col gap-2 pt-2'>
          <CustomInput
            value={minMoving}
            onChange={handleSetMinMoving}
            type='number'
            label={`${t('map_page.min_moving')} (minute)`}
            placeholder={t('map_page.min_moving')}
            min={0}
          />

          {/* Input untuk Min Stationary */}
          <CustomInput
            value={minStationary}
            onChange={handleSetMinStationary}
            type='number'
            label={`${t('map_page.min_stationary')} (minute)`}
            placeholder={t('map_page.min_stationary')}
            min={0}
          />

          {/* Checkbox untuk Show Stationary Ignition */}
          <div className=''>
            <label className='flex items-center'>
              <input
                type='checkbox'
                checked={showStationaryIgnition}
                onChange={(e) => handleSetShowStationaryIgnition(e.target.checked)}
                className='mr-2'
              />
              {t('map_page.stationary_with_ignition')}
            </label>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default CollapsibleComponent;
