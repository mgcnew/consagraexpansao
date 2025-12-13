import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'textarea';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  success?: boolean;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  rows?: number;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  success,
  hint,
  required,
  disabled,
  autoFocus,
  className,
  rows = 3,
}) => {
  const inputId = `field-${name}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  const inputClasses = cn(
    'transition-all duration-200',
    error && 'border-red-500 focus-visible:ring-red-500',
    success && 'border-green-500 focus-visible:ring-green-500',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  const InputComponent = type === 'textarea' ? Textarea : Input;

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label
        htmlFor={inputId}
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium',
          error && 'text-red-500',
          success && 'text-green-600'
        )}
      >
        {label}
        {required && <span className="text-red-500">*</span>}
        {success && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
      </Label>

      <div className="relative">
        <InputComponent
          id={inputId}
          name={name}
          type={type !== 'textarea' ? type : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={inputClasses}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          rows={type === 'textarea' ? rows : undefined}
        />
        {error && (
          <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
        )}
      </div>

      {error && (
        <p id={errorId} className="text-xs text-red-500 flex items-center gap-1 animate-fade-in">
          {error}
        </p>
      )}

      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground flex items-center gap-1">
          <Info className="w-3 h-3" />
          {hint}
        </p>
      )}
    </div>
  );
};

// Hook para validação em tempo real
export const useFieldValidation = (
  value: string,
  validators: Array<(value: string) => string | null>
) => {
  const [error, setError] = React.useState<string | null>(null);
  const [touched, setTouched] = React.useState(false);

  const validate = React.useCallback(() => {
    for (const validator of validators) {
      const result = validator(value);
      if (result) {
        setError(result);
        return false;
      }
    }
    setError(null);
    return true;
  }, [value, validators]);

  const handleBlur = React.useCallback(() => {
    setTouched(true);
    validate();
  }, [validate]);

  return {
    error: touched ? error : null,
    validate,
    handleBlur,
    isValid: !error,
  };
};

// Validadores comuns
export const validators = {
  required: (message = 'Campo obrigatório') => (value: string) =>
    value.trim() ? null : message,
  
  email: (message = 'Email inválido') => (value: string) =>
    !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : message,
  
  minLength: (min: number, message?: string) => (value: string) =>
    value.length >= min ? null : message || `Mínimo ${min} caracteres`,
  
  maxLength: (max: number, message?: string) => (value: string) =>
    value.length <= max ? null : message || `Máximo ${max} caracteres`,
  
  phone: (message = 'Telefone inválido') => (value: string) =>
    !value || /^\d{10,11}$/.test(value.replace(/\D/g, '')) ? null : message,
};

export default FormField;
