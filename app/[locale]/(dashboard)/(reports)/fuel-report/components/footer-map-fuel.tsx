import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

const FuelLevelChart = dynamic(() => import('./fuel-level-chart'), { ssr: false });

interface FooterMapProps {
  dataObjectFuelLevel?: any
  onPointClick?: (data: any) => void
}

const FooterMapHistory: React.FC<FooterMapProps> = ({
  dataObjectFuelLevel = [],
  onPointClick,
}) => {

  return (
    <div>
      {dataObjectFuelLevel && dataObjectFuelLevel.length > 0 ? (
        <FuelLevelChart 
          dataObjectFuelLevel={dataObjectFuelLevel} 
          onPointClick={onPointClick}
        />
      ) : (
        <div>Loading fuel level data...</div>
      )}
    </div>
  );
};

export default FooterMapHistory;
