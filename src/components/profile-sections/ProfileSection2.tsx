
import React from 'react';
import { PremiumProfileSection2 } from './PremiumProfileSection2';
import { ProfileData } from '@/hooks/useProfileCompletion';

interface ProfileSection2Props {
  data: ProfileData | null;
}

export const ProfileSection2: React.FC<ProfileSection2Props> = ({ data }) => {
  return <PremiumProfileSection2 data={data} />;
};
