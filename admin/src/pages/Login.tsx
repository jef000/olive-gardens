import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AuthShell from '@/components/AuthShell';
import MFAVerification from '@/components/auth/MFAVerification';
import { getApiErrorMessage } from '@/lib/apiError';
import { emailSchema, validateSchema } from '@/lib/validation';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { login, mfaChallenge } = useAuth();
  const location = useLocation();
  const notice = (location.state as { message?: string } | null)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const nextFieldErrors = {
      email: validateSchema(emailSchema, email) || undefined,
      password: password ? undefined : 'Password is required',
    };
    setFieldErrors(nextFieldErrors);
    if (nextFieldErrors.email || nextFieldErrors.password) return;

    setIsLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Unable to sign in. Check your credentials and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <Card className="glass-strong relative w-full max-w-md rounded-3xl border-white/20 shadow-brand-lg">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-2xl font-serif text-center text-gray-900 dark:text-white">Welcome Back</CardTitle>
          <CardDescription className="text-center font-light">
            Sign in with your administrator credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notice && !mfaChallenge && <div role="status" className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
          {mfaChallenge ? <MFAVerification /> : <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-gray-600">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@olivegarden.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setFieldErrors((current) => ({ ...current, email: undefined })); }}
                required
                autoComplete="email"
                inputMode="email"
                disabled={isLoading}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
              />
              {fieldErrors.email && <p id="email-error" className="text-xs text-red-600">{fieldErrors.email}</p>}
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-gray-600">Password</Label>
                <Link to="/forgot-password" className="text-xs text-[#8b9172] hover:underline font-medium">Forgot password?</Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((current) => ({ ...current, password: undefined })); }}
                required
                autoComplete="current-password"
                disabled={isLoading}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
              />
              {fieldErrors.password && <p id="password-error" className="text-xs text-red-600">{fieldErrors.password}</p>}
            </div>
            {error && (
              <div role="alert" aria-live="polite" className="text-sm text-red-600 bg-red-50/50 border border-red-100 p-3 rounded-md flex items-start gap-2">
                <div className="mt-0.5">•</div>
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-brand-600 via-brand-500 to-gold-500 text-white shadow-brand transition-all duration-300 hover:shadow-brand-lg hover:brightness-105 mt-2" 
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>}
        </CardContent>
      </Card>
    </AuthShell>
  );
}
