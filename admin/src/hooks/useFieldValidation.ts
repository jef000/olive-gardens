import { useEffect, useState } from 'react';

export function useFieldValidation<T>(value: T, validate: (value: T) => string | null, delay = 300) {
  const [state, setState] = useState<'idle' | 'validating' | 'valid' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const timeout = window.setTimeout(() => { const result = validate(value); setError(result); setState(result ? 'error' : 'valid'); }, delay);
    return () => window.clearTimeout(timeout);
  }, [value, validate, delay]);
  return { state, error, isValid: state === 'valid' };
}
