import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, MailCheck } from 'lucide-react';
import AuthShell from '@/components/AuthShell';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { emailSchema, validateSchema } from '@/lib/validation';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const validationError = validateSchema(emailSchema, email);
    setFieldError(validationError || '');
    if (validationError) return;
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setIsSubmitted(true);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'We could not process the request. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell>
      <Card className="glass-strong relative w-full max-w-md rounded-3xl border-white/20 shadow-brand-lg">
        {isSubmitted ? (
          <>
            <CardHeader className="space-y-4 pb-6 pt-8 items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <MailCheck className="text-green-600 w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-serif">Check Your Email</CardTitle>
              <CardDescription className="text-base font-light text-gray-600 max-w-xs mx-auto leading-relaxed">
                If an account exists with <span className="font-medium text-gray-900">{email}</span>, 
                we've sent instructions to reset your password.
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col space-y-4 pb-8">
              <p className="text-sm text-center text-gray-500">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Link to="/login" className="w-full">
                <Button variant="outline" className="w-full h-11 border-gray-200">
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Login
                </Button>
              </Link>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-serif text-center">Reset Password</CardTitle>
              <CardDescription className="text-center font-light">
                Enter your email address and we'll send you a link to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-gray-600">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@olivegarden.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setFieldError(''); }}
                    required
                    autoComplete="email"
                    inputMode="email"
                    disabled={isLoading}
                    aria-invalid={Boolean(fieldError)}
                    aria-describedby={fieldError ? 'forgot-email-error' : undefined}
                    className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
                  />
                  {fieldError && <p id="forgot-email-error" className="text-xs text-red-600">{fieldError}</p>}
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
                  {isLoading ? 'Sending Request...' : 'Send Reset Link'}
                </Button>
                
                <div className="text-center mt-6">
                  <Link to="/login" className="text-sm text-[#8b9172] hover:underline font-medium inline-flex items-center">
                    <ArrowLeft className="mr-1 h-3 w-3" /> Back to Login
                  </Link>
                </div>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </AuthShell>
  );
}
