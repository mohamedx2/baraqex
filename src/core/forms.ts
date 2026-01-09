/**
 * Form handling utilities
 */

import { useState, useEffect, useRef, useCallback, useMemo } from './hooks.js';

export interface FormField {
  value: any;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState {
  fields: Record<string, FormField>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  submitCount: number;
}

export interface ValidationRule {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  min?: number | { value: number; message: string };
  max?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  validate?: (value: any, values: any) => string | undefined | boolean;
}

export interface FormOptions<T extends Record<string, any>> {
  initialValues: T;
  validate?: (values: T) => Record<string, string>;
  validationRules?: Record<keyof T, ValidationRule>;
  onSubmit?: (values: T, form: FormConfig<T>) => void | Promise<void>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface FormConfig<T extends Record<string, any>> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  submitCount: number;
  handleChange: (e: any) => void;
  handleBlur: (e: any) => void;
  handleSubmit: (e?: any) => Promise<void>;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched?: boolean) => void;
  setValues: (values: Partial<T>) => void;
  setErrors: (errors: Record<string, string>) => void;
  resetForm: (nextValues?: Partial<T>) => void;
  validateField: (field: keyof T) => string | undefined;
  validateForm: () => Record<string, string>;
  getFieldProps: (field: keyof T) => {
    name: string;
    value: any;
    onChange: (e: any) => void;
    onBlur: (e: any) => void;
  };
  register: (field: keyof T) => {
    name: string;
    value: any;
    onChange: (e: any) => void;
    onBlur: (e: any) => void;
  };
}

/**
 * Validate a single field against rules
 */
function validateFieldValue(value: any, rules: ValidationRule, allValues: any): string | undefined {
  // Required
  if (rules.required) {
    const isEmpty = value === undefined || value === null || value === '' || 
      (Array.isArray(value) && value.length === 0);
    if (isEmpty) {
      return typeof rules.required === 'string' ? rules.required : 'This field is required';
    }
  }
  
  // Skip other validations if empty and not required
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  
  // MinLength
  if (rules.minLength !== undefined) {
    const minLength = typeof rules.minLength === 'object' ? rules.minLength.value : rules.minLength;
    const message = typeof rules.minLength === 'object' 
      ? rules.minLength.message 
      : `Minimum length is ${minLength}`;
    if (String(value).length < minLength) {
      return message;
    }
  }
  
  // MaxLength
  if (rules.maxLength !== undefined) {
    const maxLength = typeof rules.maxLength === 'object' ? rules.maxLength.value : rules.maxLength;
    const message = typeof rules.maxLength === 'object'
      ? rules.maxLength.message
      : `Maximum length is ${maxLength}`;
    if (String(value).length > maxLength) {
      return message;
    }
  }
  
  // Min (number)
  if (rules.min !== undefined) {
    const min = typeof rules.min === 'object' ? rules.min.value : rules.min;
    const message = typeof rules.min === 'object'
      ? rules.min.message
      : `Minimum value is ${min}`;
    if (Number(value) < min) {
      return message;
    }
  }
  
  // Max (number)
  if (rules.max !== undefined) {
    const max = typeof rules.max === 'object' ? rules.max.value : rules.max;
    const message = typeof rules.max === 'object'
      ? rules.max.message
      : `Maximum value is ${max}`;
    if (Number(value) > max) {
      return message;
    }
  }
  
  // Pattern
  if (rules.pattern !== undefined) {
    const pattern = rules.pattern instanceof RegExp ? rules.pattern : rules.pattern.value;
    const message = rules.pattern instanceof RegExp
      ? 'Invalid format'
      : rules.pattern.message;
    if (!pattern.test(String(value))) {
      return message;
    }
  }
  
  // Custom validate
  if (rules.validate) {
    const result = rules.validate(value, allValues);
    if (result === false) {
      return 'Invalid value';
    }
    if (typeof result === 'string') {
      return result;
    }
  }
  
  return undefined;
}

/**
 * useForm hook - comprehensive form state management
 */
export function useForm<T extends Record<string, any>>(options: FormOptions<T>): FormConfig<T> {
  const { 
    initialValues, 
    validate, 
    validationRules,
    onSubmit,
    validateOnChange = true,
    validateOnBlur = true
  } = options;
  
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrorsState] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  
  const initialValuesRef = useRef(initialValues);
  
  // Compute validity and dirty state
  const isValid = Object.keys(errors).length === 0;
  const isDirty = Object.values(dirty).some(Boolean);
  
  // Validate a single field
  const validateField = useCallback((field: keyof T): string | undefined => {
    const value = values[field];
    
    // Use validation rules if provided
    if (validationRules && validationRules[field]) {
      return validateFieldValue(value, validationRules[field], values);
    }
    
    // Use custom validate function
    if (validate) {
      const allErrors = validate(values);
      return allErrors[field as string];
    }
    
    return undefined;
  }, [values, validate, validationRules]);
  
  // Validate entire form
  const validateForm = useCallback((): Record<string, string> => {
    const newErrors: Record<string, string> = {};
    
    // Validate using rules
    if (validationRules) {
      for (const field in validationRules) {
        const error = validateFieldValue(values[field], validationRules[field], values);
        if (error) {
          newErrors[field] = error;
        }
      }
    }
    
    // Validate using custom function
    if (validate) {
      const customErrors = validate(values);
      Object.assign(newErrors, customErrors);
    }
    
    return newErrors;
  }, [values, validate, validationRules]);
  
  // Run validation when values change
  useEffect(() => {
    if (validateOnChange) {
      const newErrors = validateForm();
      setErrorsState(newErrors);
    }
  }, [values, validateOnChange, validateForm]);
  
  // Handle input changes
  const handleChange = useCallback((e: any) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setValuesState(prev => ({ ...prev, [name]: fieldValue }));
    setDirty(prev => ({ ...prev, [name]: true }));
  }, []);
  
  // Handle field blur
  const handleBlur = useCallback((e: any) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validateOnBlur) {
      const error = validateField(name as keyof T);
      setErrorsState(prev => {
        if (error) {
          return { ...prev, [name]: error };
        }
        const { [name]: _, ...rest } = prev;
        return rest;
      });
    }
  }, [validateOnBlur, validateField]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e?: any) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    
    setSubmitCount(prev => prev + 1);
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    for (const key in values) {
      allTouched[key] = true;
    }
    setTouched(allTouched);
    
    // Validate
    const formErrors = validateForm();
    setErrorsState(formErrors);
    
    if (Object.keys(formErrors).length > 0) {
      return;
    }
    
    if (onSubmit) {
      setIsSubmitting(true);
      try {
        await onSubmit(values, formConfig);
      } finally {
        setIsSubmitting(false);
      }
    }
  }, [values, validateForm, onSubmit]);
  
  // Set field value programmatically
  const setFieldValue = useCallback((field: keyof T, value: any) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
    setDirty(prev => ({ ...prev, [field as string]: true }));
  }, []);
  
  // Set field error programmatically
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrorsState(prev => ({ ...prev, [field as string]: error }));
  }, []);
  
  // Set field touched
  const setFieldTouched = useCallback((field: keyof T, isTouched: boolean = true) => {
    setTouched(prev => ({ ...prev, [field as string]: isTouched }));
  }, []);
  
  // Set multiple values
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);
  
  // Set multiple errors
  const setErrors = useCallback((newErrors: Record<string, string>) => {
    setErrorsState(newErrors);
  }, []);
  
  // Reset form
  const resetForm = useCallback((nextValues?: Partial<T>) => {
    setValuesState(nextValues ? { ...initialValuesRef.current, ...nextValues } : initialValuesRef.current);
    setErrorsState({});
    setTouched({});
    setDirty({});
    setSubmitCount(0);
  }, []);
  
  // Get props for a field (shorthand)
  const getFieldProps = useCallback((field: keyof T) => ({
    name: field as string,
    value: values[field] ?? '',
    onChange: handleChange,
    onBlur: handleBlur
  }), [values, handleChange, handleBlur]);
  
  const formConfig: FormConfig<T> = {
    values,
    errors,
    touched,
    dirty,
    isValid,
    isDirty,
    isSubmitting,
    submitCount,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,
    resetForm,
    validateField,
    validateForm,
    getFieldProps,
    register: getFieldProps
  };
  
  return formConfig;
}

/**
 * useField hook - for individual field management
 */
export function useField<T = any>(
  name: string,
  form: FormConfig<any>
): {
  field: { name: string; value: T; onChange: (e: any) => void; onBlur: (e: any) => void };
  meta: { touched: boolean; error?: string; dirty: boolean };
  helpers: { setValue: (value: T) => void; setError: (error: string) => void; setTouched: (touched: boolean) => void };
} {
  return {
    field: form.getFieldProps(name) as any,
    meta: {
      touched: form.touched[name] || false,
      error: form.errors[name],
      dirty: form.dirty[name] || false
    },
    helpers: {
      setValue: (value: T) => form.setFieldValue(name, value),
      setError: (error: string) => form.setFieldError(name, error),
      setTouched: (touched: boolean) => form.setFieldTouched(name, touched)
    }
  };
}

// Common validation patterns
export const patterns = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  phone: /^\+?[1-9]\d{1,14}$/,
  url: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
};

export default {
  useForm,
  useField,
  patterns
};
