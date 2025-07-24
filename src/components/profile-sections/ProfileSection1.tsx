
import React from 'react';
import { PremiumProfileSection1 } from './PremiumProfileSection1';
import { ProfileData } from '@/hooks/useProfileCompletion';

interface ProfileSection1Props {
  data: ProfileData | null;
}

export const ProfileSection1: React.FC<ProfileSection1Props> = ({ data }) => {
  return <PremiumProfileSection1 data={data} />;
};
