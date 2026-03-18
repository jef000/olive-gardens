import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings as SettingsIcon, Shield, User } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import ChangePasswordForm from '@/components/auth/ChangePasswordForm';

export default function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('security');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account settings and security preferences
          </p>
        </div>
      </div>

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
