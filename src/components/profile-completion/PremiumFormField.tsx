
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PremiumFormFieldProps {
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'date' | 'select' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ElementType;
  options?: { value: string; label: string }[];
  required?: boolean;
  error?: string;
  success?: boolean;
  disabled?: boolean;
  rows?: number;
}

export const PremiumFormField: React.FC<PremiumFormFieldProps> = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  icon: Icon,
  options = [],
  required = false,
  error,
  success,
  disabled = false,
  rows = 3
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasValue = value.length > 0;
  const isFloating = focused || hasValue;

  const renderInput = () => {
    const baseClasses = cn(
      "w-full px-4 py-3 pt-6 border rounded-lg transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-primary/20",
      "disabled:opacity-50 disabled:cursor-not-allowed",
      Icon && "pl-12",
      (type === 'password' && !showPassword) && "pr-12",
      error && "border-destructive focus:border-destructive focus:ring-destructive/20",
      success && "border-success focus:border-success focus:ring-success/20",
      !error && !success && "border-border focus:border-primary"
    );

    if (type === 'select') {
      return (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          className={baseClasses}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          rows={rows}
          className={cn(baseClasses, "resize-none")}
        />
      );
    }

    return (
      <input
        type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        className={baseClasses}
      />
    );
  };

  return (
    <div className="relative group">
      <div className="relative">
        {/* Icon */}
        {Icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
        )}

        {/* Input */}
        {renderInput()}

        {/* Password Toggle */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}

        {/* Success/Error Icons */}
        {(success || error) && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10">
            {success && <Check className="w-5 h-5 text-success" />}
            {error && <AlertCircle className="w-5 h-5 text-destructive" />}
          </div>
        )}

        {/* Floating Label */}
        <motion.label
          className={cn(
            "absolute left-4 pointer-events-none transition-all duration-200",
            Icon && "left-12",
            isFloating
              ? "top-2 text-xs text-primary font-medium"
              : "top-1/2 transform -translate-y-1/2 text-muted-foreground"
          )}
          animate={{
            y: isFloating ? 0 : 0,
            scale: isFloating ? 1 : 1,
          }}
          transition={{ duration: 0.2 }}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </motion.label>

        {/* Focus Border Animation */}
        {focused && (
          <motion.div
            className="absolute inset-0 border-2 border-primary rounded-lg pointer-events-none"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-destructive mt-2 flex items-center space-x-1"
        >
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </motion.p>
      )}
    </div>
  );
};
