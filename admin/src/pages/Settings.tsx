import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Shield, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';
import MFASetup from '@/components/auth/MFASetup';
import DarkModeToggle from '@/components/DarkModeToggle';
import api from '@/lib/api';
import PageIntro from '@/components/PageIntro';

export default function Settings() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('security');
  const [mfaEnabled, setMfaEnabled] = useState(Boolean(user?.mfa_enabled));
  const [disableMfaOpen, setDisableMfaOpen] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [disableError, setDisableError] = useState<string | null>(null);
  const [disabling, setDisabling] = useState(false);

  const disableMfa = async () => {
    setDisabling(true);
    setDisableError(null);
    try {
      await api.post('/auth/mfa/disable', { password: disablePassword });
      // The server revokes every session on downgrade, so sign out locally too.
      setMfaEnabled(false);
      setDisableMfaOpen(false);
      setDisablePassword('');
      logout();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not disable MFA.';
      setDisableError(message);
    } finally {
      setDisabling(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Workspace preferences"
        title="Settings"
        description="Manage your account, security preferences, and appearance."
        actions={<DarkModeToggle className="h-11 w-11 rounded-xl border border-gray-200 bg-white/70" />}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="mt-6">
          <Card className="max-w-2xl border-border/50">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Your personal account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-1">
                <p className="text-sm font-medium text-gray-500">Email Address</p>
                <p className="text-base">{user?.email}</p>
              </div>
              <div className="grid gap-1">
                <p className="text-sm font-medium text-gray-500">Role</p>
                <div className="flex items-center mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {user?.role}
                  </span>
                </div>
              </div>
              <div className="grid gap-1">
                <p className="text-sm font-medium text-gray-500">Account Created</p>
                <p className="text-sm">{user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                }) : 'N/A'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
            <div>
              <ChangePasswordForm />
            </div>
            
            <div className="space-y-6">
              <Card className="border-border/50">
                <CardHeader><CardTitle className="text-lg">Multi-factor authentication</CardTitle><CardDescription>Protect your administrator account with an authenticator app.</CardDescription></CardHeader>
                <CardContent className="space-y-4"><MFASetup enabled={mfaEnabled} onComplete={() => setMfaEnabled(true)} />{mfaEnabled && <button type="button" className="text-sm text-red-600 underline" onClick={() => { setDisableError(null); setDisablePassword(''); setDisableMfaOpen(true); }}>Disable MFA</button>}</CardContent>
              </Card>

              <Dialog open={disableMfaOpen} onOpenChange={(open) => { if (!disabling) setDisableMfaOpen(open); }}>
                <DialogContent className="sm:max-w-[420px]">
                  <DialogHeader>
                    <DialogTitle>Disable multi-factor authentication?</DialogTitle>
                    <DialogDescription>
                      This removes the second factor from your account and signs you out of every device. Confirm your password to continue.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-1.5 py-2">
                    <Label htmlFor="disable-mfa-password">Password</Label>
                    <Input
                      id="disable-mfa-password"
                      type="password"
                      autoComplete="current-password"
                      value={disablePassword}
                      onChange={(event) => setDisablePassword(event.target.value)}
                    />
                    {disableError && <p className="text-xs text-red-600" role="alert">{disableError}</p>}
                  </div>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button type="button" variant="outline" disabled={disabling} onClick={() => setDisableMfaOpen(false)}>Cancel</Button>
                    <Button type="button" variant="destructive" disabled={disabling || !disablePassword} onClick={() => void disableMfa()}>
                      {disabling ? 'Disabling…' : 'Disable MFA'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Card className="border-border/50 bg-gray-50/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <SettingsIcon className="w-5 h-5 text-gray-500" />
                    Security Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-gray-600">
                  <ul className="space-y-3 list-disc pl-5">
                    <li>Use a unique password that you don't use on other websites.</li>
                    <li>Change your password regularly (every 3-6 months).</li>
                    <li>Avoid using personal information like names or birthdays in your password.</li>
                    <li>Never share your password with anyone, not even support staff.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
