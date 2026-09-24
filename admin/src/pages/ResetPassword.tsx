import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import AuthShell from '@/components/AuthShell';
import api from '@/lib/api';
import { getApiErrorMessage } from '@/lib/apiError';
import { passwordSchema, validateSchema } from '@/lib/validation';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validation rules state
  const [validations, setValidations] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
    match: false
  });

  useEffect(() => {
    // If no token in URL, redirect to login or show error
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  useEffect(() => {
    setValidations({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password),
      match: password === confirmPassword && password.length > 0
    });
  }, [password, confirmPassword]);

  const isFormValid = Object.values(validations).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('This reset link is missing or invalid. Request a new link to continue.');
      return;
    }
    const passwordError = validateSchema(passwordSchema, password);
    if (passwordError || !validations.match) {
      setError(passwordError || 'Passwords do not match.');
      return;
    }
    
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', { 
        token, 
        newPassword: password 
      });
      setIsSuccess(true);
      
      // Optional: Auto redirect after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'We could not reset your password. Request a new link and try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean, text: string }) => (
    <div className={`flex items-center text-xs ${isValid ? 'text-green-600' : 'text-gray-500'}`}>
      {isValid ? (
        <CheckCircle2 className="w-3 h-3 mr-1.5" />
      ) : (
        <div className="w-3 h-3 rounded-full border border-gray-300 mr-1.5" />
      )}
      {text}
    </div>
  );

  return (
    <AuthShell>
      <Card className="glass-strong relative w-full max-w-md rounded-3xl border-white/20 shadow-brand-lg">
        {isSuccess ? (
          <>
            <CardHeader className="space-y-4 pb-6 pt-8 items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="text-green-600 w-8 h-8" />
              </div>
              <CardTitle className="text-2xl font-serif">Password Reset Successfully</CardTitle>
              <CardDescription className="text-base font-light text-gray-600">
                Your password has been updated. You can now sign in with your new credentials.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Link to="/login" className="w-full">
                <Button className="w-full h-11 bg-[#8b9172] hover:bg-[#6a7051]">
                  Sign In Now
                </Button>
              </Link>
            </CardFooter>
          </>
        ) : (
          <>
            <CardHeader className="space-y-2 pb-6">
              <CardTitle className="text-2xl font-serif text-center">Create New Password</CardTitle>
              <CardDescription className="text-center font-light">
                Please enter and confirm your new password below.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!token ? (
                <div className="text-center py-6">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 font-medium mb-4">{error}</p>
                  <Link to="/forgot-password">
                    <Button variant="outline" className="w-full">
                      Request New Link
                    </Button>
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <div className="space-y-4">
                    <div className="space-y-2.5">
                      <Label htmlFor="password" className="text-gray-600">New Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        required
                        autoComplete="new-password"
                        aria-invalid={Boolean(error)}
                        disabled={isLoading}
                        className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
                        placeholder="••••••••"
                      />
                    </div>
                    
                    <div className="space-y-2.5">
                      <Label htmlFor="confirmPassword" className="text-gray-600">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        required
                        autoComplete="new-password"
                        aria-invalid={Boolean(confirmPassword && !validations.match)}
                        disabled={isLoading}
                        className={`h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172] ${confirmPassword && !validations.match ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-100">
                    <p className="text-xs font-medium text-gray-700 mb-2">Password must contain:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <ValidationItem isValid={validations.length} text="At least 8 characters" />
                      <ValidationItem isValid={validations.upper} text="One uppercase letter" />
                      <ValidationItem isValid={validations.lower} text="One lowercase letter" />
                      <ValidationItem isValid={validations.number} text="One number" />
                      <ValidationItem isValid={validations.special} text="One special character" />
                      <ValidationItem isValid={validations.match} text="Passwords match" />
                    </div>
                  </div>
                  
                  {error && (
                    <div role="alert" aria-live="polite" className="text-sm text-red-600 bg-red-50/50 border border-red-100 p-3 rounded-md flex items-start gap-2">
                      <div className="mt-0.5">•</div>
                      {error}
                    </div>
                  )}
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-gradient-to-r from-brand-600 via-brand-500 to-gold-500 text-white shadow-brand transition-all duration-300 hover:shadow-brand-lg hover:brightness-105 mt-4" 
                    disabled={isLoading || !isFormValid}
                  >
                    {isLoading ? 'Resetting Password...' : 'Reset Password'}
                  </Button>
                  
                  <div className="text-center mt-6">
                    <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center">
                      <ArrowLeft className="mr-1 h-3 w-3" /> Cancel and return to login
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </>
        )}
      </Card>
    </AuthShell>
  );
}
