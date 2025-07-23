
import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
  // Redirect to the new UserDashboard route
  return <Navigate to="/dashboard" replace />;
};

export default Dashboard;
