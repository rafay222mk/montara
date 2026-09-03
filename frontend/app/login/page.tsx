'use client';

import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, GraduationCap, Leaf } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if user is already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-background">
      <div className="subtle-grid absolute inset-0 opacity-40" />
      
      {/* Left side panel (desktop only) */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-border/80 bg-[#11161a] p-12 lg:flex">
        <div>
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="text-base font-bold tracking-[0.22em]">MONTARA</span>
          </Link>
        </div>
        <div className="max-w-md">
          <Leaf className="mb-8 h-8 w-8 text-primary" />
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            A calmer way to nurture every child’s potential.
          </h1>
          <p className="mt-5 text-base leading-7 text-muted-foreground">
            One connected workspace for your Montessori community, from the first observation to the next breakthrough.
          </p>
          <div className="mt-10 flex gap-8 border-t border-border/70 pt-6">
            <div>
              <p className="text-2xl font-semibold">248</p>
              <p className="mt-1 text-xs text-muted-foreground">Students growing</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">94.6%</p>
              <p className="mt-1 text-xs text-muted-foreground">Daily attendance</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2024 Montara Education. Designed for human connection.
        </p>
      </div>

      {/* Right side panel (sign in form) */}
      <div className="relative flex w-full items-center justify-center px-5 py-12 sm:px-10 lg:w-1/2">
        <div className="w-full max-w-[400px]">
          <div className="mb-10 lg:hidden">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-5 w-5" />
              </span>
              <span className="text-base font-bold tracking-[0.22em]">MONTARA</span>
            </Link>
          </div>
          
          <div className="mb-8">
            <p className="eyebrow mb-3">Welcome back</p>
            <h2 className="text-2xl font-semibold tracking-tight">Sign in to your workspace</h2>
            <p className="mt-2 text-sm text-muted-foreground">Continue caring for your school community.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-xs font-medium text-destructive">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@school.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-primary hover:underline"
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  className="pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox id="remember" disabled={loading} />
              <Label htmlFor="remember" className="text-xs font-normal text-muted-foreground">
                Keep me signed in
              </Label>
            </div>

            <Button type="submit" className="h-11 w-full gap-2" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in to Montara'}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>
          
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Need access?{' '}
            <button className="font-medium text-primary hover:underline" disabled={loading}>
              Contact your school administrator
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
