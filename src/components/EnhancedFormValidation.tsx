
import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { validateInput, useRealTimeValidation, VALIDATION_SCHEMAS } from '@/utils/inputValidation';
import { monitoring } from '@/utils/monitoring';

interface ValidationAlertProps {
  type: 'error' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
}

export const ValidationAlert: React.FC<ValidationAlertProps> = ({
  type,
  title,
  message,
  onDismiss,
  actions = []
}) => {
  const iconMap = {
    error: <AlertCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    success: <CheckCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />
  };

  const variantMap = {
    error: 'destructive',
    warning: 'default',
    success: 'default',
    info: 'default'
  } as const;

  return (
    <Alert variant={variantMap[type]} className="relative">
      <div className="flex items-start space-x-3">
        {iconMap[type]}
        <div className="flex-1">
          <h4 className="font-medium">{title}</h4>
          <AlertDescription className="mt-1">{message}</AlertDescription>
          {actions.length > 0 && (
            <div className="mt-3 flex space-x-2">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant={action.variant || 'outline'}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="absolute top-2 right-2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </Alert>
  );
};

interface ValidationSummaryProps {
  errors: Record<string, string>;
  warnings?: Record<string, string>;
  onFieldFocus?: (field: string) => void;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  warnings = {},
  onFieldFocus
}) => {
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());

  const visibleErrors = Object.entries(errors).filter(([field]) => !dismissedErrors.has(field));
  const visibleWarnings = Object.entries(warnings).filter(([field]) => !dismissedWarnings.has(field));

  const dismissError = (field: string) => {
    setDismissedErrors(prev => new Set(prev).add(field));
  };

  const dismissWarning = (field: string) => {
    setDismissedWarnings(prev => new Set(prev).add(field));
  };

  if (visibleErrors.length === 0 && visibleWarnings.length === 0) {
    return null;
  }

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span>Validation Issues</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {visibleErrors.map(([field, error]) => (
          <ValidationAlert
            key={field}
            type="error"
            title={`${field.replace('_', ' ').toUpperCase()}`}
            message={error}
            onDismiss={() => dismissError(field)}
            actions={onFieldFocus ? [
              {
                label: 'Go to field',
                onClick: () => onFieldFocus(field),
                variant: 'outline'
              }
            ] : []}
          />
        ))}
        
        {visibleWarnings.map(([field, warning]) => (
          <ValidationAlert
            key={field}
            type="warning"
            title={`${field.replace('_', ' ').toUpperCase()}`}
            message={warning}
            onDismiss={() => dismissWarning(field)}
            actions={onFieldFocus ? [
              {
                label: 'Go to field',
                onClick: () => onFieldFocus(field),
                variant: 'outline'
              }
            ] : []}
          />
        ))}
      </CardContent>
    </Card>
  );
};

interface RealTimeValidationProps {
  value: any;
  field: string;
  schema: any;
  onValidation?: (result: { isValid: boolean; error: string | null; sanitizedValue: any }) => void;
  showSuccessState?: boolean;
}

export const RealTimeValidation: React.FC<RealTimeValidationProps> = ({
  value,
  field,
  schema,
  onValidation,
  showSuccessState = true
}) => {
  const { validateField } = useRealTimeValidation(schema);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    error: string | null;
    sanitizedValue: any;
  }>({ isValid: true, error: null, sanitizedValue: value });

  useEffect(() => {
    const result = validateField(field, value);
    setValidationResult(result);
    
    if (onValidation) {
      onValidation(result);
    }
    
    // Track validation metrics
    monitoring.recordMetric('real_time_validation', 1, {
      field,
      valid: result.isValid ? 'true' : 'false',
      has_error: result.error ? 'true' : 'false'
    });
  }, [value, field, validateField, onValidation]);

  if (!validationResult.error && !showSuccessState) {
    return null;
  }

  return (
    <div className="mt-1">
      {validationResult.error && (
        <div className="flex items-center space-x-2 text-sm text-destructive">
          <AlertCircle className="h-3 w-3" />
          <span>{validationResult.error}</span>
        </div>
      )}
      {!validationResult.error && showSuccessState && value && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="h-3 w-3" />
          <span>Valid</span>
        </div>
      )}
    </div>
  );
};

interface ValidationProgressProps {
  completedFields: number;
  totalFields: number;
  errors: Record<string, string>;
  warnings?: Record<string, string>;
}

export const ValidationProgress: React.FC<ValidationProgressProps> = ({
  completedFields,
  totalFields,
  errors,
  warnings = {}
}) => {
  const progressPercentage = (completedFields / totalFields) * 100;
  const errorCount = Object.keys(errors).length;
  const warningCount = Object.keys(warnings).length;

  const getProgressColor = () => {
    if (errorCount > 0) return 'bg-destructive';
    if (warningCount > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusMessage = () => {
    if (errorCount > 0) {
      return `${errorCount} error${errorCount > 1 ? 's' : ''} to fix`;
    }
    if (warningCount > 0) {
      return `${warningCount} warning${warningCount > 1 ? 's' : ''} to review`;
    }
    if (completedFields === totalFields) {
      return 'All fields completed successfully';
    }
    return `${completedFields} of ${totalFields} fields completed`;
  };

  return (
    <Card className="border-muted">
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Validation Progress</span>
            <span className="text-muted-foreground">{Math.round(progressPercentage)}%</span>
          </div>
          
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{getStatusMessage()}</span>
            <div className="flex items-center space-x-4">
              {errorCount > 0 && (
                <div className="flex items-center space-x-1 text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errorCount}</span>
                </div>
              )}
              {warningCount > 0 && (
                <div className="flex items-center space-x-1 text-yellow-600">
                  <AlertCircle className="h-3 w-3" />
                  <span>{warningCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced form validation hook
export const useEnhancedFormValidation = (schema: any) => {
  const [data, setData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());

  const validateForm = (formData: Record<string, any>) => {
    const result = validateInput(formData, schema);
    setErrors(result.errors);
    return result;
  };

  const validateField = (field: string, value: any) => {
    const fieldSchema = { [field]: schema[field] };
    const fieldData = { [field]: value };
    const result = validateInput(fieldData, fieldSchema);
    
    setErrors(prev => ({
      ...prev,
      [field]: result.errors[field] || ''
    }));
    
    return result;
  };

  const handleFieldChange = (field: string, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
    
    if (touched.has(field)) {
      validateField(field, value);
    }
  };

  const handleFieldBlur = (field: string) => {
    setTouched(prev => new Set(prev).add(field));
    if (data[field] !== undefined) {
      validateField(field, data[field]);
    }
  };

  const resetValidation = () => {
    setErrors({});
    setWarnings({});
    setTouched(new Set());
  };

  return {
    data,
    errors,
    warnings,
    touched,
    validateForm,
    validateField,
    handleFieldChange,
    handleFieldBlur,
    resetValidation,
    isValid: Object.keys(errors).length === 0
  };
};
