'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { hasPermission } from '@/lib/auth/permissions';
import { communicationApi } from '@/lib/api/communication';
import { Announcement } from '@/types';
import { Button } from '@/components/ui/button';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/shared';
import { AnnouncementForm } from '@/components/forms/record-forms';
import { Megaphone, AlertTriangle, Clock, Trash2, Pencil, Send, RefreshCw } from 'lucide-react';

export default function CommunicationPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audienceFilter, setAudienceFilter] = useState('ALL_VISIBLE');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const canManage = user && hasPermission(user.role, 'communication.manage');

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await communicationApi.announcements.list();
      setAnnouncements(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load announcements feed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await communicationApi.announcements.delete(id);
      fetchAnnouncements();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete announcement.');
    }
  };

  // Filter logic
  const filtered = announcements.filter((ann) => {
    const matchesAudience = audienceFilter === 'ALL_VISIBLE' || ann.audience === audienceFilter;
    const matchesPriority = priorityFilter === 'ALL' || ann.priority === priorityFilter;
    return matchesAudience && matchesPriority;
  });

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PageHeader
              eyebrow="Campus Hub"
              title="School Announcements"
              description="Stay informed on notices, schedules, events, and campus broadcasts."
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchAnnouncements} disabled={loading} title="Reload feed">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            {canManage && <AnnouncementForm onSuccess={fetchAnnouncements} />}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="md:col-span-1 space-y-4">
            <div className="rounded-xl border border-border bg-[#11161a] p-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Audience Target
                </label>
                <div className="space-y-1">
                  {[
                    { value: 'ALL_VISIBLE', label: 'All Announcements' },
                    { value: 'ALL', label: 'General / Public' },
                    { value: 'TEACHERS', label: 'For Teachers' },
                    { value: 'PARENTS', label: 'For Parents' },
                    { value: 'ADMINS', label: 'Internal Staff' },
                  ].map((aud) => (
                    <button
                      key={aud.value}
                      onClick={() => setAudienceFilter(aud.value)}
                      className={`w-full text-left px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        audienceFilter === aud.value
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      {aud.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                  Priority Filters
                </label>
                <div className="space-y-1">
                  {[
                    { value: 'ALL', label: 'All Priorities' },
                    { value: 'URGENT', label: 'Urgent Notices' },
                    { value: 'IMPORTANT', label: 'Important' },
                    { value: 'NORMAL', label: 'Normal' },
                  ].map((prio) => (
                    <button
                      key={prio.value}
                      onClick={() => setPriorityFilter(prio.value)}
                      className={`w-full text-left px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                        priorityFilter === prio.value
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      {prio.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Announcements List */}
          <div className="md:col-span-3 space-y-4">
            {error && <div className="rounded bg-destructive/10 p-4 text-xs text-destructive">{error}</div>}

            {loading ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
                Loading announcements...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-sm text-muted-foreground rounded-xl border border-dashed border-border bg-[#11161a]">
                <Megaphone className="h-8 w-8 mb-2 opacity-40 text-muted-foreground" />
                No announcements in this category yet.
              </div>
            ) : (
              <div className="space-y-4">
                {filtered.map((ann) => {
                  const isUrgent = ann.priority === 'URGENT';
                  const isImportant = ann.priority === 'IMPORTANT';
                  return (
                    <div
                      key={ann.id}
                      className={`relative rounded-xl border p-5 bg-[#11161a] transition-all ${
                        isUrgent
                          ? 'border-destructive/60 shadow-[0_0_8px_rgba(239,68,68,0.1)]'
                          : isImportant
                          ? 'border-amber-500/50'
                          : 'border-border'
                      }`}
                    >
                      {/* Header badge details */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          {isUrgent && (
                            <span className="flex items-center gap-1 rounded bg-destructive/10 px-2 py-0.5 text-xs font-bold text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              URGENT
                            </span>
                          )}
                          {isImportant && (
                            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-bold text-amber-500">
                              IMPORTANT
                            </span>
                          )}
                          <span className="rounded bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                            Audience: {ann.audience}
                          </span>
                          {!ann.isPublished && (
                            <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                              Draft / Scheduled
                            </span>
                          )}
                        </div>

                        {/* Created date/meta */}
                        <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                          <Clock className="h-3.5 w-3.5" />
                          {ann.publishedAt
                            ? new Date(ann.publishedAt).toLocaleDateString()
                            : new Date(ann.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Content Title */}
                      <h3 className="text-lg font-bold text-foreground mb-2">{ann.title}</h3>

                      {/* Content Text */}
                      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed mb-4">
                        {ann.content}
                      </p>

                      {/* Footer Info & Actions */}
                      <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-4 text-xs">
                        <div className="text-muted-foreground flex items-center gap-1.5">
                          <Send className="h-3.5 w-3.5 opacity-60" />
                          Posted by:{' '}
                          <span className="font-semibold text-foreground">
                            {ann.creator?.name || 'School Office'}
                          </span>
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-1">
                            <AnnouncementForm
                              announcementId={ann.id}
                              onSuccess={fetchAnnouncements}
                              trigger={
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 hover:bg-muted"
                                  title="Edit Announcement"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/15"
                              onClick={() => handleDelete(ann.id)}
                              title="Delete Announcement"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
