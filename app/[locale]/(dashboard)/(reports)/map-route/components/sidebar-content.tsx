import React from 'react';

interface RouteInstruction {
  instruction: string
  streetName: string
  distance: string
}

interface SidebarContentProps {
  routeData: {
    distance: string
    duration: string
    instructions: Array<RouteInstruction>
  } | null
}

const SidebarContent: React.FC<SidebarContentProps> = ({ routeData }) => {
  return (
    <div>
      {routeData ? (
        <>
          <div>
            {routeData.instructions && routeData.instructions.length > 0 ? (
              routeData.instructions.map((step, index) => (
                <div
                  key={index}
                  className='relative flex flex-col overflow-hidden text-gray-700 bg-white bg-clip-border border-b-[1px] border-gray-200'
                >
                  <nav className='my-0 flex min-w-[240px] flex-col gap-1 p-0 font-sans text-base font-normal text-blue-gray-700'>
                    <div
                      role='text'
                      className='flex py-1 items-center text-sm font-normal text-blue-gray-700 outline-none transition-all hover:bg-blue-500 hover:bg-opacity-80 hover:text-white focus:bg-blue-500 focus:bg-opacity-80 focus:text-white active:bg-blue-gray-50 active:bg-opacity-80 active:text-blue-gray-900'
                    >
                      <div className='group flex items-center w-full rounded-none p-3 py-1.5 text-start cursor-pointer'>
                        <div>
                          <div className='flex flex-col items-center'>
                            {step.instruction}, {step.streetName}, {step.distance}
                          </div>
                        </div>
                      </div>
                    </div>
                  </nav>
                </div>
              ))
            ) : (
              <p>No instructions available</p>
            )}
          </div>
        </>
      ) : (
        <div className='text-center'>
        <p>No route data available</p>
        </div>
      )}
    </div>
  );
};

export default SidebarContent;
