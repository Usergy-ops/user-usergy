import React from 'react';
import { CheckCircle, X, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'pending' | 'completed' | 'failed';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = {
    pending: {
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      icon: <Clock className="w-3 h-3" />,
      label: 'Pending'
    },
    completed: {
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      icon: <CheckCircle className="w-3 h-3" />,
      label: 'Completed'
    },
    failed: {
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      icon: <X className="w-3 h-3" />,
      label: 'Failed'
    }
  };

  const { className, icon, label } = config[status];

  return (
    <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium ${className}`}>
      {icon}
      <span>{label}</span>
    </span>
  );
};