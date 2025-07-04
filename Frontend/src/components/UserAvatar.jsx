import React from 'react';
import { Link } from 'react-router-dom';
import { useUserProfile } from '../hooks/useUserProfile';

export const UserAvatar = () => {
  const { userProfile } = useUserProfile();

  return (
    <Link to="/Account"
          className="absolute w-[47px] h-[47px] top-[23px] left-[1313px] bg-[#d9d9d9] rounded-[23.5px] overflow-hidden flex items-center justify-center">
      {userProfile?.avatarUrl ? (
        <img 
          src={userProfile.avatarUrl} 
          alt="Profile" 
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="[font-family:'Gilroy-Medium',Helvetica] font-normal text-black text-base tracking-[0] leading-[normal]">
          {userProfile?.firstName?.[0] || 'A'}
        </span>
      )}
    </Link>
  );
}; 