import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SlideUpPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export const SlideUpPanel: React.FC<SlideUpPanelProps> = ({
  isOpen,
  onClose,
  children,
  title
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      const touchY = e.touches[0].clientY;
      const deltaY = touchY - startY;
      
      if (deltaY > 0) {
        setCurrentY(deltaY);
      }
    };

    const handleTouchEnd = () => {
      if (currentY > 100) {
        onClose();
      }
      setIsDragging(false);
      setCurrentY(0);
    };

    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, startY, currentY, onClose]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden animate-fade-in"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div
        ref={panelRef}
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 bg-card rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto md:hidden transition-transform duration-300 ease-out",
          isDragging ? '' : 'animate-slide-up'
        )}
        style={{
          transform: `translateY(${currentY}px)`
        }}
      >
        {/* Drag Handle */}
        <div 
          className="flex justify-center py-3 border-b border-border/20"
          onTouchStart={handleTouchStart}
        >
          <div className="w-12 h-1 bg-muted rounded-full" />
        </div>
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-border/20">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Content */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </>
  );
};