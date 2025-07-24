
import React from 'react';
import { Loader2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';

interface LoadingStateProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'card';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  progress,
  showProgress = false,
  size = 'md',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const containerClasses = {
    sm: 'space-y-2 p-2',
    md: 'space-y-3 p-4',
    lg: 'space-y-4 p-6'
  };

  const LoadingContent = () => (
    <div className={`flex flex-col items-center justify-center ${containerClasses[size]}`}>
      <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
      <p className="text-sm text-muted-foreground text-center">{message}</p>
      {showProgress && progress !== undefined && (
        <div className="w-full max-w-xs">
          <Progress value={progress} className="w-full" />
          <p className="text-xs text-muted-foreground text-center mt-1">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}
    </div>
  );

  if (variant === 'minimal') {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className={`animate-spin text-primary ${sizeClasses[size]}`} />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <LoadingContent />
        </CardContent>
      </Card>
    );
  }

  return <LoadingContent />;
};

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  action,
  icon
}) => (
  <Card className="w-full">
    <CardHeader className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        {icon || <AlertCircle className="h-6 w-6 text-muted-foreground" />}
      </div>
      <CardTitle className="text-xl">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    {action && (
      <CardContent className="text-center">
        <Button onClick={action.onClick} variant="outline">
          {action.label}
        </Button>
      </CardContent>
    )}
  </Card>
);

interface SuccessStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  description,
  action
}) => (
  <Card className="w-full border-green-200 bg-green-50">
    <CardHeader className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-6 w-6 text-green-600" />
      </div>
      <CardTitle className="text-xl text-green-800">{title}</CardTitle>
      <CardDescription className="text-green-700">{description}</CardDescription>
    </CardHeader>
    {action && (
      <CardContent className="text-center">
        <Button onClick={action.onClick} className="bg-green-600 hover:bg-green-700">
          {action.label}
        </Button>
      </CardContent>
    )}
  </Card>
);

interface ErrorStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  showRetry?: boolean;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  action,
  showRetry = true,
  onRetry
}) => (
  <Card className="w-full border-red-200 bg-red-50">
    <CardHeader className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
        <AlertCircle className="h-6 w-6 text-red-600" />
      </div>
      <CardTitle className="text-xl text-red-800">{title}</CardTitle>
      <CardDescription className="text-red-700">{description}</CardDescription>
    </CardHeader>
    <CardContent className="text-center space-y-2">
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline" className="border-red-300 text-red-700 hover:bg-red-100">
          Try Again
        </Button>
      )}
      {action && (
        <Button onClick={action.onClick} className="bg-red-600 hover:bg-red-700">
          {action.label}
        </Button>
      )}
    </CardContent>
  </Card>
);

interface TimeoutStateProps {
  title: string;
  description: string;
  onRetry?: () => void;
  timeoutDuration?: number;
}

export const TimeoutState: React.FC<TimeoutStateProps> = ({
  title,
  description,
  onRetry,
  timeoutDuration = 30
}) => (
  <Card className="w-full border-yellow-200 bg-yellow-50">
    <CardHeader className="text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
        <Clock className="h-6 w-6 text-yellow-600" />
      </div>
      <CardTitle className="text-xl text-yellow-800">{title}</CardTitle>
      <CardDescription className="text-yellow-700">{description}</CardDescription>
    </CardHeader>
    <CardContent className="text-center">
      <p className="text-sm text-yellow-600 mb-4">
        This operation timed out after {timeoutDuration} seconds
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
          Try Again
        </Button>
      )}
    </CardContent>
  </Card>
);

// Skeleton loaders for different content types
export const ProfileSkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </CardContent>
  </Card>
);

export const FormSkeleton = () => (
  <Card className="w-full">
    <CardHeader>
      <Skeleton className="h-6 w-[200px]" />
      <Skeleton className="h-4 w-[300px]" />
    </CardHeader>
    <CardContent className="space-y-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-[100px]" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end space-x-2">
        <Skeleton className="h-10 w-[100px]" />
        <Skeleton className="h-10 w-[100px]" />
      </div>
    </CardContent>
  </Card>
);

export const ListSkeleton = ({ items = 5 }: { items?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: items }).map((_, index) => (
      <Card key={index} className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
