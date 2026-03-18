import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Leaf } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[60%] h-[100%] rounded-full bg-[#8b9172]/5 blur-3xl -z-10 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[40%] h-[60%] rounded-full bg-[#a6ac8e]/5 blur-3xl -z-10 -translate-x-1/3" />

      <div className="mb-8 flex flex-col items-center">
        <div className="w-16 h-16 bg-[#8b9172] rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <Leaf className="text-white w-8 h-8" />
        </div>
        <h1 className="text-4xl font-serif text-gray-900 tracking-tight">Olive Garden</h1>
        <p className="text-gray-500 font-light tracking-widest uppercase text-sm mt-2">Management Portal</p>
      </div>

      <Card className="w-full max-w-md border-border/50 shadow-xl bg-white/80 backdrop-blur-sm">
        <CardHeader className="space-y-2 pb-6">
          <CardTitle className="text-2xl font-serif text-center">Welcome Back</CardTitle>
          <CardDescription className="text-center font-light">
            Sign in with your administrator credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-gray-600">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@olivegarden.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
              />
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
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="h-11 border-gray-200 focus:border-[#8b9172] focus:ring-[#8b9172]"
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50/50 border border-red-100 p-3 rounded-md flex items-start gap-2">
                <div className="mt-0.5">•</div>
                {error}
              </div>
            )}
            <Button 
              type="submit" 
              className="w-full h-11 bg-[#8b9172] hover:bg-[#6a7051] text-white transition-colors duration-300 mt-2" 
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <p className="mt-8 text-sm text-gray-400 font-light">
        &copy; {new Date().getFullYear()} Olive Garden Resort. All rights reserved.
      </p>
    </div>
  );
}
