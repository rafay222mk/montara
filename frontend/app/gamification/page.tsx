'use client';

import { Trophy, Star, Award, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { gamificationApi } from '@/lib/api/gamification';
import { ApiLeaderboardEntry, ApiStudentBadge, ApiBadge } from '@/types';
import { useAuth } from '@/lib/auth/auth-context';
import { hasPermission } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';

const BADGE_CATEGORY_COLORS: Record<string, string> = {
  ATTENDANCE:    'bg-amber-400/15 text-amber-300 border-amber-400/20',
  ACADEMIC:      'bg-sky-400/15 text-sky-300 border-sky-400/20',
  BEHAVIOR:      'bg-emerald-400/15 text-emerald-300 border-emerald-400/20',
  PARTICIPATION: 'bg-violet-400/15 text-violet-300 border-violet-400/20',
  SPECIAL:       'bg-rose-400/15 text-rose-300 border-rose-400/20',
};

const STUDENT_COLORS = [
  'bg-rose-400/20 text-rose-200',
  'bg-sky-400/20 text-sky-200',
  'bg-amber-400/20 text-amber-200',
  'bg-emerald-400/20 text-emerald-200',
  'bg-cyan-400/20 text-cyan-200',
  'bg-orange-400/20 text-orange-200',
];

function studentColor(id: string) {
  return STUDENT_COLORS[(id.charCodeAt(0) || 0) % STUDENT_COLORS.length];
}

function initials(first: string, last: string) {
  return `${(first?.[0] || '').toUpperCase()}${(last?.[0] || '').toUpperCase()}`;
}

// ── Award Points Dialog ─────────────────────────────────────
function AwardPointsDialog({ students, onSuccess }: { students: { id: string; name: string }[]; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [points, setPoints] = useState('10');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !reason.trim()) { setError('Student and reason are required'); return; }
    setError(null); setLoading(true);
    try {
      await gamificationApi.points.award({ studentId, points: parseInt(points) || 10, reason: reason.trim() });
      setOpen(false); setStudentId(''); setReason(''); setPoints('10');
      onSuccess();
    } catch (err: any) { setError(err?.message || 'Failed to award points'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="award-points-btn" size="sm" variant="outline">
          <Star className="mr-2 h-4 w-4" /> Award points
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Award Points</DialogTitle>
          <DialogDescription>Recognise a student with points for their effort or achievement.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2"><Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Points</Label>
            <Input type="number" min={1} max={1000} value={points} onChange={(e) => setPoints(e.target.value)} disabled={loading} />
          </div>
          <div className="space-y-2"><Label>Reason</Label>
            <Input placeholder="e.g. Completed Pink Tower independently" value={reason} onChange={(e) => setReason(e.target.value)} disabled={loading} required />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !studentId}>{loading ? 'Awarding...' : 'Award points'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Award Badge Dialog ──────────────────────────────────────
function AwardBadgeDialog({ students, badges, onSuccess }: { students: { id: string; name: string }[]; badges: ApiBadge[]; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !badgeId) { setError('Select both student and badge'); return; }
    setError(null); setLoading(true);
    try {
      await gamificationApi.badges.award({ studentId, badgeId, notes: notes.trim() || undefined });
      setOpen(false); setStudentId(''); setBadgeId(''); setNotes('');
      onSuccess();
    } catch (err: any) { setError(err?.message || 'Failed to award badge'); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="award-badge-btn" size="sm" variant="outline">
          <Award className="mr-2 h-4 w-4" /> Award badge
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Award Badge</DialogTitle>
          <DialogDescription>Grant a badge/achievement to a student.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="space-y-2"><Label>Student</Label>
            <Select value={studentId} onValueChange={setStudentId} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>{students.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Badge</Label>
            <Select value={badgeId} onValueChange={setBadgeId} disabled={loading}>
              <SelectTrigger><SelectValue placeholder="Select badge" /></SelectTrigger>
              <SelectContent>{badges.map((b) => <SelectItem key={b.id} value={b.id}>{b.icon} {b.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Notes (optional)</Label>
            <Textarea placeholder="Why this badge?" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={loading} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading || !studentId || !badgeId}>{loading ? 'Awarding...' : 'Award badge'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Create Badge Dialog ─────────────────────────────────────
function CreateBadgeDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🏅');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('SPECIAL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Name is required'); return; }
    setError(null); setLoading(true);
    try {
      await gamificationApi.badges.create({ name: name.trim(), icon, description: description.trim() || undefined, category });
      setOpen(false); setName(''); setIcon('🏅'); setDescription(''); setCategory('SPECIAL');
      onSuccess();
    } catch (err: any) { setError(err?.message || 'Failed to create badge'); }
    finally { setLoading(false); }
  };

  const categories = ['ATTENDANCE', 'ACADEMIC', 'BEHAVIOR', 'PARTICIPATION', 'SPECIAL'];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button id="create-badge-btn" size="sm">
          <Plus className="mr-2 h-4 w-4" /> Create badge
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader><DialogTitle>Create Badge</DialogTitle><DialogDescription>Define a new achievement badge for students.</DialogDescription></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-2 col-span-1"><Label>Icon</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} maxLength={4} disabled={loading} className="text-center text-xl" />
            </div>
            <div className="space-y-2 col-span-3"><Label>Badge name</Label>
              <Input placeholder="e.g. Perfect Week" value={name} onChange={(e) => setName(e.target.value)} disabled={loading} required />
            </div>
          </div>
          <div className="space-y-2"><Label>Category</Label>
            <Select value={category} onValueChange={setCategory} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Description</Label>
            <Textarea placeholder="What does this badge represent?" value={description} onChange={(e) => setDescription(e.target.value)} disabled={loading} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create badge'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Main Page ───────────────────────────────────────────────
export default function GamificationPage() {
  const { user } = useAuth();
  const canManage = user ? hasPermission(user.role, 'gamification.manage') : false;

  const [leaderboard, setLeaderboard] = useState<ApiLeaderboardEntry[]>([]);
  const [recentBadges, setRecentBadges] = useState<ApiStudentBadge[]>([]);
  const [badges, setBadges] = useState<ApiBadge[]>([]);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [lbRes, badgesAllRes, badgeDefsRes, studentsRes] = await Promise.allSettled([
        gamificationApi.points.leaderboard(20),
        gamificationApi.badges.allStudentBadges(),
        gamificationApi.badges.list(),
        apiClient.get<any[]>('/students?isActive=true'),
      ]);
      if (lbRes.status === 'fulfilled') setLeaderboard(lbRes.value);
      if (badgesAllRes.status === 'fulfilled') setRecentBadges(badgesAllRes.value.slice(0, 20));
      if (badgeDefsRes.status === 'fulfilled') setBadges(badgeDefsRes.value);
      if (studentsRes.status === 'fulfilled') setStudents(studentsRes.value.map((s: any) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })));
    } catch (err: any) { setError(err?.message || 'Failed to load gamification data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleDeleteBadgeDef = async (id: string) => {
    if (!confirm('Delete this badge?')) return;
    try { await gamificationApi.badges.delete(id); setBadges((prev) => prev.filter((b) => b.id !== id)); }
    catch (err: any) { alert(err?.message || 'Failed to delete badge'); }
  };

  const handleRevokeBadge = async (id: string) => {
    if (!confirm('Revoke this badge award?')) return;
    try { await gamificationApi.badges.revokeAward(id); setRecentBadges((prev) => prev.filter((b) => b.id !== id)); }
    catch (err: any) { alert(err?.message || 'Failed to revoke badge'); }
  };

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70 mb-1">Learning</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Gamification</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">Student points, badges, and leaderboard</p>
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-2">
              <AwardPointsDialog students={students} onSuccess={loadData} />
              <AwardBadgeDialog students={students} badges={badges} onSuccess={loadData} />
              <CreateBadgeDialog onSuccess={loadData} />
            </div>
          )}
        </div>

        {loading && <div className="flex h-48 items-center justify-center text-muted-foreground">Loading...</div>}
        {!loading && error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>}

        {!loading && !error && (
          <div className="grid gap-6 xl:grid-cols-3">
            {/* Leaderboard */}
            <div className="xl:col-span-2 space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-400" /> Leaderboard
              </h2>
              {leaderboard.length === 0 ? (
                <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">No points awarded yet.</div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, i) => (
                    <div key={entry.studentId} id={`leaderboard-${entry.studentId}`} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-3 transition-all hover:border-border">
                      <span className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                        i === 0 ? 'bg-amber-400/20 text-amber-300' :
                        i === 1 ? 'bg-slate-400/20 text-slate-300' :
                        i === 2 ? 'bg-orange-400/20 text-orange-300' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {i + 1}
                      </span>
                      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold', studentColor(entry.studentId))}>
                        {initials(entry.firstName, entry.lastName)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{entry.firstName} {entry.lastName}</p>
                        <p className="text-xs text-muted-foreground">{entry.badgeCount} badge{entry.badgeCount !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="h-3.5 w-3.5 text-amber-400" />
                        <span className="text-sm font-bold text-foreground">{entry.totalPoints.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right column: badges feed + badge catalog */}
            <div className="space-y-6">
              {/* Recent Badge Awards */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Award className="h-4 w-4 text-violet-400" /> Recent Badges
                </h2>
                {recentBadges.length === 0 ? (
                  <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">No badges awarded yet.</div>
                ) : (
                  <div className="space-y-2">
                    {recentBadges.map((sb) => (
                      <div key={sb.id} id={`badge-award-${sb.id}`} className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2.5 hover:border-border">
                        <span className="text-xl shrink-0">{sb.badge?.icon || '🏅'}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{sb.badge?.name || 'Badge'}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {sb.student ? `${sb.student.firstName} ${sb.student.lastName}` : ''}
                          </p>
                        </div>
                        <span className={cn('hidden rounded-full border px-2 py-0.5 text-[9px] font-semibold sm:block', BADGE_CATEGORY_COLORS[sb.badge?.category || 'SPECIAL'] || '')}>
                          {(sb.badge?.category || 'SPECIAL').charAt(0) + (sb.badge?.category || 'SPECIAL').slice(1).toLowerCase()}
                        </span>
                        {canManage && (
                          <button id={`revoke-badge-${sb.id}`} onClick={() => handleRevokeBadge(sb.id)}
                            className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                            aria-label="Revoke badge">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Badge Catalog */}
              <div className="space-y-3">
                <h2 className="text-sm font-semibold text-foreground">Badge Catalog</h2>
                {badges.length === 0 ? (
                  <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">No badges defined yet.</div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {badges.map((badge) => (
                      <div key={badge.id} id={`badge-def-${badge.id}`} className="group flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs text-foreground hover:border-border">
                        <span>{badge.icon}</span>
                        <span className="font-medium">{badge.name}</span>
                        {canManage && (
                          <button id={`delete-badge-${badge.id}`} onClick={() => handleDeleteBadgeDef(badge.id)}
                            className="ml-1 shrink-0 rounded text-muted-foreground opacity-0 transition-all hover:text-destructive group-hover:opacity-100"
                            aria-label="Delete badge">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
