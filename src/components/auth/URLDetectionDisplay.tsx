
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ExternalLink } from 'lucide-react';

interface URLDetectionDisplayProps {
  currentUrl: string;
  expectedType: 'user' | 'client' | 'unknown';
}

export const URLDetectionDisplay: React.FC<URLDetectionDisplayProps> = ({
  currentUrl,
  expectedType
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Current URL</p>
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-mono text-muted-foreground break-all">{currentUrl}</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <p className="text-sm font-medium">Expected Account Type</p>
        <Badge variant={expectedType === 'unknown' ? 'secondary' : 'default'}>
          {expectedType}
        </Badge>
        {expectedType !== 'unknown' && (
          <p className="text-xs text-muted-foreground">
            Based on URL: {expectedType}.usergy.ai
          </p>
        )}
      </div>
    </div>
  );
};
