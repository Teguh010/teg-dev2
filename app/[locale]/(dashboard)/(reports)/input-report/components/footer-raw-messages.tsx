import React from 'react';
import dynamic from 'next/dynamic';

const RawMessagesChart = dynamic(() => import('./raw-messages-chart'), { ssr: false });

interface ValidRawMessage {
  msg_data?: Record<string, unknown> | string;
  invalid_msg_data?: Record<string, unknown> | string;
  gpstime?: string | Date;
  ignition?: boolean | string;
  [key: string]: unknown;
}

interface FooterRawMessagesProps {
  dataValidRawMessages?: ValidRawMessage[];
  onPointClick?: (data: ValidRawMessage) => void;
  selectedDataTypes?: number[];
  datatypeList?: Array<{id: number, name: string}>;
  showGpsspeed?: boolean;
}

const FooterRawMessages: React.FC<FooterRawMessagesProps> = ({
  dataValidRawMessages = [],
  onPointClick,
  selectedDataTypes = [],
  datatypeList = [],
  showGpsspeed = true,
}) => {
  return (
    <div>
      {dataValidRawMessages && dataValidRawMessages.length > 0 ? (
        <RawMessagesChart 
          dataValidRawMessages={dataValidRawMessages} 
          onPointClick={onPointClick}
          selectedDataTypes={selectedDataTypes}
          datatypeList={datatypeList}
          showGpsspeed={showGpsspeed}
        />
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500">
          No data available
        </div>
      )}
    </div>
  );
};

export default FooterRawMessages; 