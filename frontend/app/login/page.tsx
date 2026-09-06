'use client';

import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, GraduationCap, Leaf, Mail, Phone, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth/auth-context';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Dialog states for previously dead buttons
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const { login, isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Load remembered email on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const remembered = localStorage.getItem('montara_remember_email');
      if (remembered) {
        setEmail(remembered);
        setRememberMe(true);
      }
    }
  }, []);

  // Redirect to role-appropriate home if user is already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const target = user.role === 'PARENT' ? '/parent' : '/';
      router.push(target);
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }

    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('montara_remember_email', email.trim());
      } else {
        localStorage.removeItem('montara_remember_email');
      }
      await login(email.trim(), password);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotSubmitted(true);
  };

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground animate-pulse">Entering workspace...</p>
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
              <p className="text-2xl font-semibold">18</p>
              <p className="mt-1 text-xs text-muted-foreground">Active classrooms</p>
            </div>
            <div>
              <p className="text-2xl font-semibold">96.2%</p>
              <p className="mt-1 text-xs text-muted-foreground">Term attendance</p>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 Montara International Montessori School. All rights reserved.
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
              <Label htmlFor="email">Work or Parent email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@school.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSubmitted(false);
                    setForgotOpen(true);
                  }}
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
                  autoComplete="current-password"
                  required
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
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(Boolean(checked))}
                disabled={loading}
              />
              <Label htmlFor="remember" className="text-xs font-normal text-muted-foreground cursor-pointer">
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
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              className="font-medium text-primary hover:underline"
              disabled={loading}
            >
              Contact your school administrator
            </button>
          </p>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Reset Password
            </DialogTitle>
            <DialogDescription>
              Montara uses centralized academic authentication for data safety.
            </DialogDescription>
          </DialogHeader>

          {!forgotSubmitted ? (
            <form onSubmit={handleForgotSubmit} className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                If you forgot your password or need your login credentials reset, enter your registered email below to log a credential assistance request with school IT.
              </p>
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Registered email address</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  placeholder="name@domain.com"
                  defaultValue={email}
                  required
                />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setForgotOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit Request</Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/10 p-3 text-xs text-primary">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>
                  Password reset request logged. Your school administrator has been notified.
                </span>
              </div>
              <div className="rounded-md border border-border bg-card p-3 text-xs space-y-1">
                <p className="font-semibold text-foreground">Immediate Assistance:</p>
                <p className="text-muted-foreground">
                  Contact Fatima Noor (Lead Administrator) at <span className="text-foreground">fatima@admin.com</span> or call the office at <span className="text-foreground">+92 21 3584 9201</span>.
                </p>
              </div>
              <DialogFooter>
                <Button type="button" onClick={() => setForgotOpen(false)} className="w-full">
                  Close
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact School Dialog */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <GraduationCap className="h-5 w-5 text-primary" />
              Montara International Montessori School
            </DialogTitle>
            <DialogDescription>
              School Administration & Support Desk
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2 text-xs">
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">Campus Location</p>
                  <p className="text-muted-foreground mt-0.5">Plot 14-C, Khayaban-e-Ittehad, Phase 6, DHA, Karachi</p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-border/60 pt-3">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Reception & Help Desk</p>
                  <p className="text-muted-foreground mt-0.5">+92 21 3584 9201</p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-border/60 pt-3">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Administrative Email</p>
                  <p className="text-muted-foreground mt-0.5">info@montara-school.pk / fatima@admin.com</p>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              For new student enrollments, guardian accounts, or employee portal onboarding, campus administration operates Monday through Friday, 8:00 AM – 3:30 PM PKT.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" onClick={() => setContactOpen(false)} className="w-full">
              Back to Sign In
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
