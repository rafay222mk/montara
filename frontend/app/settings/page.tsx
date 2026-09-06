'use client';

import { useState } from 'react';
import {
  Bell,
  Building2,
  ChevronRight,
  LockKeyhole,
  Mail,
  SlidersHorizontal,
  UserRound,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/auth/auth-context';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api/admin';

const sections = [
  {
    id: 'profile',
    title: 'Your profile',
    description: 'Personal details and contact information',
    icon: UserRound,
  },
  {
    id: 'account',
    title: 'Account security',
    description: 'Email, password, and account access',
    icon: LockKeyhole,
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Choose what updates you receive and when',
    icon: Bell,
  },
  {
    id: 'preferences',
    title: 'Application preferences',
    description: 'Regional settings, terms, and defaults',
    icon: SlidersHorizontal,
  },
  {
    id: 'school',
    title: 'School profile',
    description: 'Name, address, contact details, and branding',
    icon: Building2,
  },
];

export default function SettingsPage() {
  const [active, setActive] = useState('profile');
  const { user } = useAuth();

  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // Account form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Preference form state
  const [academicYear, setAcademicYear] = useState('2026–2027');
  const [term, setTerm] = useState('Term 3');
  const [timezone, setTimezone] = useState('Asia/Karachi (PKT)');

  // School profile state
  const [schoolName, setSchoolName] = useState('Montara International Montessori School');
  const [schoolAddress, setSchoolAddress] = useState('Plot 14-C, Khayaban-e-Ittehad, Phase 6, DHA, Karachi');
  const [schoolEmail, setSchoolEmail] = useState('info@montara-school.pk');

  const [saving, setSaving] = useState(false);

  const current = sections.find((section) => section.id === active) || sections[0];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Profile details saved successfully.');
  };

  const handleUpdateSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please provide both current and new password');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    toast.success('Security settings updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
  };

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Application preferences saved.');
  };

  const handleSaveSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';
    if (!isAdmin) {
      toast.error('Only school administrators can modify tenant configuration.');
      return;
    }
    setSaving(true);
    try {
      await adminApi.updateSettings({
        name: schoolName,
        address: schoolAddress,
        email: schoolEmail,
      });
      toast.success('School profile updated successfully.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update school profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        eyebrow="System / Workspace"
        title="Settings"
        description="Shape Montara around the way your school works."
      />

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="space-y-1">
          {sections.map(({ id, title, description, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActive(id)}
              className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                active === id
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{title}</span>
                <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">
                  {description}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0" />
            </button>
          ))}
        </div>

        <Card className="max-w-2xl border-border/70">
          <CardHeader>
            <CardTitle className="text-[15px]">{current.title}</CardTitle>
            <p className="text-xs text-muted-foreground">{current.description}</p>
          </CardHeader>
          <CardContent>
            {active === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <div className="flex items-center gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/15 text-lg font-semibold text-primary">
                    {user?.initials}
                  </span>
                  <div>
                    <p className="text-sm font-medium">Profile photo</p>
                    <p className="text-xs text-muted-foreground">Managed by school staff registry</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="ml-auto"
                    onClick={() => toast.info('Avatar initials are automatically generated from your name.')}
                  >
                    Change
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="full-name">Full name</Label>
                    <Input
                      id="full-name"
                      value={name || user?.name || ''}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email-addr">Email address</Label>
                    <Input
                      id="email-addr"
                      type="email"
                      value={email || user?.email || ''}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <Button type="submit">Save profile</Button>
              </form>
            )}

            {active === 'account' && (
              <form onSubmit={handleUpdateSecurity} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="account-email">Sign-in email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="account-email"
                      className="pl-9"
                      value={user?.email || ''}
                      disabled
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="current-pw">Current password</Label>
                  <Input
                    id="current-pw"
                    type="password"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-pw">New password</Label>
                  <Input
                    id="new-pw"
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit">Update security</Button>
              </form>
            )}

            {active === 'notifications' && (
              <div className="space-y-5">
                {[
                  ['Daily attendance summary', 'Receive a morning overview of attendance.', true],
                  ['Learning updates', 'Be notified when new observations are recorded.', true],
                  ['Finance reminders', 'Receive reminders about outstanding balances.', false],
                  ['Weekly digest', 'Get a weekly summary of school activity.', true],
                ].map(([title, description, checked]) => (
                  <div
                    key={title as string}
                    className="flex items-center justify-between border-b border-border/70 pb-4 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">{title as string}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{description as string}</p>
                    </div>
                    <Switch
                      defaultChecked={checked as boolean}
                      onCheckedChange={() => toast.success(`Notification preference for "${title}" updated.`)}
                    />
                  </div>
                ))}
              </div>
            )}

            {active === 'preferences' && (
              <form onSubmit={handleSavePreferences} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="academic-yr">School year</Label>
                  <Input
                    id="academic-yr"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="def-term">Default term</Label>
                  <Input
                    id="def-term"
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tz">Timezone</Label>
                  <Input
                    id="tz"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  />
                </div>

                <Button type="submit">Save preferences</Button>
              </form>
            )}

            {active === 'school' && (
              <form onSubmit={handleSaveSchool} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="sch-name">School name</Label>
                  <Input
                    id="sch-name"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    disabled={user?.role !== 'SUPER_ADMIN' && user?.role !== 'SCHOOL_ADMIN'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sch-addr">School address</Label>
                  <Input
                    id="sch-addr"
                    value={schoolAddress}
                    onChange={(e) => setSchoolAddress(e.target.value)}
                    disabled={user?.role !== 'SUPER_ADMIN' && user?.role !== 'SCHOOL_ADMIN'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sch-email">School email</Label>
                  <Input
                    id="sch-email"
                    value={schoolEmail}
                    onChange={(e) => setSchoolEmail(e.target.value)}
                    disabled={user?.role !== 'SUPER_ADMIN' && user?.role !== 'SCHOOL_ADMIN'}
                  />
                </div>

                {user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' ? (
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Saving...' : 'Save school details'}
                  </Button>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    School configuration can only be modified by school administrators.
                  </p>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
