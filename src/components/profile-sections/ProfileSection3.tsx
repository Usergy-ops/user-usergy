
import React from 'react';
import { PremiumProfileSection3 } from './PremiumProfileSection3';
import { ProfileData } from '@/hooks/useProfileCompletion';

interface ProfileSection3Props {
  data: ProfileData | null;
}

export const ProfileSection3: React.FC<ProfileSection3Props> = ({ data }) => {
  return <PremiumProfileSection3 data={data} />;
};
