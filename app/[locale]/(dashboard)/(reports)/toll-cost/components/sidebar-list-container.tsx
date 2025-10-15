import React from 'react';

interface SidebarListContainerProps {
  routeData: { distance: string; duration: string } | null
  totalTollPrices: { [currency: string]: number }
  tollData: { tolls: { name: string; price: number; currency: string }[] } | null
  transportMode: string
}

const SidebarListContainer: React.FC<SidebarListContainerProps> = ({
  routeData,
  totalTollPrices,
  tollData,
  transportMode,
}) => {
  return (
    <div
      className='overflow-y-auto p-4 sidebar-list-container'
      style={{
        height:
          transportMode === 'truck' || transportMode === 'small_truck'
            ? 'calc(100vh - 100px)'
            : 'calc(100vh - 100px)',
      }}
    >
      {routeData && (
        <div>
          <p>
            <strong>Distance:</strong> {routeData.distance} km
          </p>
          <p>
            <strong>Duration:</strong> {routeData.duration} min
          </p>
        </div>
      )}

      <div>
        {totalTollPrices && Object.keys(totalTollPrices).length > 0 && (
          <div className='pt-2'>
            <h4>Total Prices:</h4>
            {Object.keys(totalTollPrices).map((currency) => (
              <p key={currency}>
                Total: {totalTollPrices[currency].toFixed(2)} {currency}
              </p>
            ))}
          </div>
        )}
      </div>

      {tollData && tollData.tolls.length > 0 && (
        <div className='pt-2'>
          <h3>Toll Information:</h3>
          <ul>
            {tollData.tolls.map((toll, index) => (
              <li key={index} className='py-1'>
                <strong>Name: </strong> {toll.name}
                <br />
                <strong>Price: </strong> {toll.price} {toll.currency}
                <br />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SidebarListContainer;
