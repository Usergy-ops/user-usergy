
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ElementType;
}

interface MultiSelectFieldProps {
  label: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
  maxColumns?: number;
}

export const MultiSelectField: React.FC<MultiSelectFieldProps> = ({
  label,
  options,
  selected,
  onChange,
  placeholder = "Select options",
  searchable = false,
  maxColumns = 3
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = searchable
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter(item => item !== value));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {selected.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {selected.length} selected
          </span>
        )}
      </div>

      {/* Search */}
      {searchable && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search options..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>
      )}

      {/* Selected Items */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(value => {
            const option = options.find(opt => opt.value === value);
            return (
              <motion.div
                key={value}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
              >
                <span>{option?.label || value}</span>
                <button
                  onClick={() => handleRemove(value)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Options Grid */}
      <div className={cn(
        "grid gap-3",
        maxColumns === 1 && "grid-cols-1",
        maxColumns === 2 && "grid-cols-1 md:grid-cols-2",
        maxColumns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        maxColumns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}>
        {filteredOptions.map((option) => {
          const isSelected = selected.includes(option.value);
          const Icon = option.icon;

          return (
            <motion.button
              key={option.value}
              onClick={() => handleToggle(option.value)}
              className={cn(
                "relative p-4 rounded-lg border transition-all duration-200 text-left group",
                "hover:shadow-md hover:scale-105",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border hover:border-primary/50"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Selection Indicator */}
              <div className={cn(
                "absolute top-3 right-3 w-5 h-5 border-2 rounded-full transition-all duration-200",
                isSelected
                  ? "bg-primary border-primary"
                  : "border-muted-foreground/30 group-hover:border-primary/50"
              )}>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Check className="w-3 h-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </motion.div>
                )}
              </div>

              {/* Content */}
              <div className="flex items-start space-x-3">
                {Icon && (
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                    isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className={cn(
                    "font-medium transition-colors",
                    isSelected ? "text-primary" : "text-foreground"
                  )}>
                    {option.label}
                  </h4>
                  {option.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {filteredOptions.length === 0 && searchable && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No options found for "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
};
