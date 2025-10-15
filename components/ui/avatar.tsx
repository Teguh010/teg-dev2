import React from 'react';
import * as Avatar from '@radix-ui/react-avatar';

interface CustomAvatarProps {
  src?: string
  alt?: string
  bgColor?: string
  fallback: string
  fontSize?: string
}

const CustomAvatar: React.FC<CustomAvatarProps> = ({
  src,
  alt,
  fallback,
  bgColor,
  fontSize = '14px',
}) => {
  return (
    <div>
      <Avatar.Root className='inline-flex items-center justify-center align-middle overflow-hidden select-none w-[27px] h-[27px] rounded-full bg-black-alpha-270'>
        <Avatar.Image className='w-full h-full object-cover rounded-full' src={src} alt={alt} />
        <Avatar.Fallback
          className={`w-full h-full flex items-center align-middle justify-center text-white  leading-none  ${bgColor}`}
          style={{ fontSize }}
        >
          {fallback}
        </Avatar.Fallback>
      </Avatar.Root>
    </div>
  );
};

export default CustomAvatar;
