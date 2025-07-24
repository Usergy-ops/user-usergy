
import React from 'react';
import { PremiumProfileSection6 } from './PremiumProfileSection6';
import { ProfileData } from '@/hooks/useProfileCompletion';

interface ProfileSection6Props {
  data: ProfileData | null;
}

export const ProfileSection6: React.FC<ProfileSection6Props> = ({ data }) => {
  return <PremiumProfileSection6 data={data} />;
};
