import { useState } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getApiErrorMessage } from '@/lib/apiError';

interface SetupData { qrCode: string; backupCodes: string[]; }

export default function MFASetup({ onComplete, enabled = false }: { onComplete?: () => void; enabled?: boolean }) {
  const [setup, setSetup] = useState<SetupData | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const begin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const response = await api.post<{ data: SetupData }>('/auth/mfa/setup');
      setSetup(response.data.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'Unable to start MFA setup. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      await api.post('/auth/mfa/verify', { token: code });
      setMessage('MFA is enabled for your account.');
      onComplete?.();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, 'That authenticator code was not accepted. Check it and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!setup) return (
    <div className="space-y-3">
      <p className="text-sm" role="status">MFA is currently <strong>{enabled ? 'enabled' : 'disabled'}</strong>.</p>
      {!enabled && <Button onClick={() => void begin()} disabled={isSubmitting}>{isSubmitting ? 'Starting setup…' : 'Enable MFA'}</Button>}
      {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
  return (
    <div className="space-y-4">
      <img src={setup.qrCode} alt="QR code for authenticator setup" className="w-48 h-48" />
      <p className="text-sm">Save these backup codes somewhere secure:</p>
      <code className="block rounded bg-gray-100 p-3 text-sm">{setup.backupCodes.join(' · ')}</code>
      <form onSubmit={(event) => void verify(event)} className="flex gap-2">
        <Input value={code} onChange={(event) => setCode(event.target.value)} placeholder="6-digit code" required aria-label="Authenticator code" />
        <Button type="submit" disabled={isSubmitting || code.length < 6}>{isSubmitting ? 'Verifying…' : 'Verify'}</Button>
      </form>
      {message && <p role="status" className="text-sm text-green-700">{message}</p>}
      {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
