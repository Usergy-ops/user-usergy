
import React from 'react';
import { PremiumProfileSection4 } from './PremiumProfileSection4';
import { ProfileData } from '@/hooks/useProfileCompletion';

interface ProfileSection4Props {
  data: ProfileData | null;
}

export const ProfileSection4: React.FC<ProfileSection4Props> = ({ data }) => {
  return <PremiumProfileSection4 data={data} />;
};
