
import React from 'react';
import { PremiumProfileSection5 } from './PremiumProfileSection5';
import { ProfileData } from '@/hooks/useProfileCompletion';

interface ProfileSection5Props {
  data: ProfileData | null;
}

export const ProfileSection5: React.FC<ProfileSection5Props> = ({ data }) => {
  return <PremiumProfileSection5 data={data} />;
};
