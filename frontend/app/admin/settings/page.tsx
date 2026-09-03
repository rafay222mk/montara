'use client';

import { useEffect, useState } from 'react';
import { Building2, Save, SlidersHorizontal, Globe } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { adminApi } from '@/lib/api/admin';
import { SchoolSettings } from '@/types';
import { toast } from 'sonner';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getSettings()
      .then((data) => {
        setSettings(data);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load school settings');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await adminApi.updateSettings({
        name: settings.name,
        logoUrl: settings.logoUrl || null,
        phone: settings.phone || null,
        email: settings.email || null,
        address: settings.address || null,
        timezone: settings.timezone || null,
        currency: settings.currency || null,
        academicYear: settings.academicYear || null,
      });
      setSettings(updated);
      toast.success('Workspace settings updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof SchoolSettings, val: string) => {
    setSettings((prev) => prev ? { ...prev, [key]: val } : null);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex justify-center items-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppShell>
    );
  }

  if (error || !settings) {
    return (
      <AppShell>
        <PageHeader eyebrow="System / Administration" title="Workspace settings" />
        <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive mt-4">
          {error || 'Settings not available'}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader
        eyebrow="System / Administration"
        title="Workspace settings"
        description="Configure Montara metadata, branding details, and default term configurations."
      />

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          {/* School Profile */}
          <Card>
            <CardHeader className="flex-row items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-4 w-4" />
              </span>
              <div>
                <CardTitle className="text-[15px]">School Profile</CardTitle>
                <p className="text-xs text-muted-foreground">General branding & workspace identity.</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="school-name">School Name</Label>
                <Input
                  id="school-name"
                  value={settings.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="logo-url">Logo URL</Label>
                <Input
                  id="logo-url"
                  value={settings.logoUrl || ''}
                  placeholder="https://example.com/logo.png"
                  onChange={(e) => updateField('logoUrl', e.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="school-email">Contact Email</Label>
                  <Input
                    id="school-email"
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => updateField('email', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="school-phone">Contact Phone</Label>
                  <Input
                    id="school-phone"
                    value={settings.phone || ''}
                    onChange={(e) => updateField('phone', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="school-address">Address</Label>
                <Textarea
                  id="school-address"
                  value={settings.address || ''}
                  rows={2}
                  onChange={(e) => updateField('address', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic & Configuration */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex-row items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <SlidersHorizontal className="h-4 w-4" />
                </span>
                <div>
                  <CardTitle className="text-[15px]">Academic Configuration</CardTitle>
                  <p className="text-xs text-muted-foreground">Define active calendar years & currency.</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="academic-year">Active Academic Year</Label>
                  <Input
                    id="academic-year"
                    value={settings.academicYear || ''}
                    placeholder="e.g. 2026-2027"
                    onChange={(e) => updateField('academicYear', e.target.value)}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="currency">Currency Code</Label>
                    <Input
                      id="currency"
                      value={settings.currency || ''}
                      placeholder="e.g. USD"
                      onChange={(e) => updateField('currency', e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={settings.timezone || ''}
                      placeholder="e.g. EST"
                      onChange={(e) => updateField('timezone', e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="gap-2">
                <Save className="h-4 w-4" />
                {saving ? 'Saving changes...' : 'Save settings'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
