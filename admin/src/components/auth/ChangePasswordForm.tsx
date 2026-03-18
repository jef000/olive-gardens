import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { CheckCircle2, LockKeyhole } from 'lucide-react';
import api from '@/lib/api';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
}

export default function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
    match: false,
    different: false
  });

  useEffect(() => {
    setValidations({
      length: newPassword.length >= 8,
      upper: /[A-Z]/.test(newPassword),
      lower: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[^A-Za-z0-9]/.test(newPassword),
      match: newPassword === confirmPassword && newPassword.length > 0,
      different: currentPassword !== newPassword && newPassword.length > 0
    });
  }, [currentPassword, newPassword, confirmPassword]);

  const isFormValid = Object.values(validations).every(Boolean) && currentPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    
    setError('');
    setIsLoading(true);

    try {
      await api.post('/auth/change-password', { 
        currentPassword,
        newPassword 
      });
      setIsSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to change password');
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

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md border-border/50 shadow-sm">
        <CardHeader className="space-y-4 pb-6 pt-8 items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-2">
            <CheckCircle2 className="text-green-600 w-8 h-8" />
          </div>
          <CardTitle className="text-xl font-serif">Password Updated</CardTitle>
          <CardDescription className="text-sm font-light text-gray-600">
            Your password has been changed successfully. Use your new password next time you sign in.
          </CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button 
            variant="outline" 
            onClick={() => setIsSuccess(false)}
            className="w-full"
          >
            Change Password Again
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md border-border/50 shadow-sm">
      <CardHeader className="space-y-1.5">
        <div className="flex items-center gap-2">
          <LockKeyhole className="w-5 h-5 text-gray-500" />
          <CardTitle className="text-lg font-medium">Change Password</CardTitle>
        </div>
        <CardDescription className="text-sm font-light">
          Update your account password to maintain security.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-gray-600 text-sm">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-10 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-gray-600 text-sm">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-10 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-gray-600 text-sm">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
                className={`h-10 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172] ${confirmPassword && !validations.match ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
              />
            </div>
          </div>

          {newPassword && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-100">
              <p className="text-xs font-medium text-gray-700 mb-2">Password Requirements:</p>
              <div className="grid grid-cols-2 gap-2">
                <ValidationItem isValid={validations.length} text="8+ characters" />
                <ValidationItem isValid={validations.upper} text="Uppercase letter" />
                <ValidationItem isValid={validations.lower} text="Lowercase letter" />
                <ValidationItem isValid={validations.number} text="One number" />
                <ValidationItem isValid={validations.special} text="Special character" />
                <ValidationItem isValid={validations.different} text="Different from old" />
                <ValidationItem isValid={validations.match} text="Passwords match" />
              </div>
            </div>
          )}
          
          {error && (
            <div className="text-sm text-red-600 bg-red-50/50 border border-red-100 p-3 rounded-md flex items-start gap-2">
              <div className="mt-0.5">•</div>
              {error}
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full h-10 bg-[#8b9172] hover:bg-[#6a7051] text-white transition-colors duration-300" 
            disabled={isLoading || !isFormValid}
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
