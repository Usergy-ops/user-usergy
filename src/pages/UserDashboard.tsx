
import React from 'react';
import { Navigate } from 'react-router-dom';

const UserDashboard = () => {
  // Redirect to profile completion since dashboard is not implemented yet
  return <Navigate to="/profile-completion" replace />;
};

export default UserDashboard;
