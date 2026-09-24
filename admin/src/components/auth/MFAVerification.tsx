import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import { getApiErrorMessage } from '@/lib/apiError';
import { backupCodeSchema, mfaCodeSchema, validateSchema } from '@/lib/validation';

export default function MFAVerification() {
  const { verifyMFA, cancelMFA } = useAuth();
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (attempts >= 3) return;
    const validationError = validateSchema(backupCode ? backupCodeSchema : mfaCodeSchema, code);
    if (validationError) {
      setError(validationError);
      return;
    }
    setIsLoading(true);
    try {
      await verifyMFA(code.trim(), backupCode);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, backupCode ? 'That backup code is invalid.' : 'That authenticator code is invalid.'));
      setAttempts((value) => value + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" aria-label="Multi-factor authentication">
      <div>
        <h2 className="text-xl font-semibold">Verify your identity</h2>
        <p className="text-sm text-gray-500 mt-1">Enter the code from your authenticator app.</p>
      </div>
      <Input aria-label={backupCode ? 'Backup code' : 'Authenticator code'} value={code} onChange={(event) => setCode(backupCode ? event.target.value.toUpperCase() : event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode={backupCode ? 'text' : 'numeric'} autoComplete="one-time-code" required disabled={isLoading} aria-invalid={Boolean(error)} />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      {attempts > 0 && attempts < 3 && <p className="text-xs text-gray-500" aria-live="polite">{3 - attempts} attempts remaining.</p>}
      {attempts >= 3 && <p role="alert" className="text-sm text-red-600">Too many failed attempts. Please sign in again.</p>}
      <Button type="submit" className="w-full" disabled={isLoading || attempts >= 3}>{isLoading ? 'Verifying…' : 'Verify'}</Button>
      {attempts >= 3 && <Button type="button" variant="outline" className="w-full" onClick={cancelMFA}>Start over</Button>}
      <button type="button" className="text-sm text-[#6a7051] underline" onClick={() => { setBackupCode((value) => !value); setCode(''); setError(''); }}>
        {backupCode ? 'Use authenticator code' : 'Use a backup code'}
      </button>
    </form>
  );
}
