'use client';

import { CalendarCheck, Filter, Plus, Trash2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { LessonPlanForm } from '@/components/forms/record-forms';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { curriculumApi } from '@/lib/api/curriculum';
import { mapApiLessonPlan, mapApiLessonPlanStatus, mapLessonPlanStatusToApi, cn } from '@/lib/utils';
import { LessonPlan, LessonPlanStatus, MontessoriArea } from '@/types';
import { useAuth } from '@/lib/auth/auth-context';
import { hasPermission } from '@/lib/auth/permissions';
import { apiClient } from '@/lib/api/client';

const STATUS_STYLES: Record<LessonPlanStatus, string> = {
  Planned:    'bg-sky-400/15 text-sky-300 border-sky-400/20',
  Presented:  'bg-violet-400/15 text-violet-300 border-violet-400/20',
  Practicing: 'bg-amber-400/15 text-amber-300 border-amber-400/20',
  Mastered:   'bg-emerald-400/15 text-emerald-300 border-emerald-400/20',
  Deferred:   'bg-rose-400/15 text-rose-300 border-rose-400/20',
};

const AREA_COLORS: Record<string, string> = {
  'Practical Life':   'text-amber-400',
  'Sensorial':        'text-purple-400',
  'Language':         'text-sky-400',
  'Mathematics':      'text-emerald-400',
  'Cultural':         'text-rose-400',
  'Art':              'text-pink-400',
  'Music':            'text-violet-400',
  'Movement':         'text-orange-400',
  'Social Emotional': 'text-teal-400',
};

const PLAN_STATUSES: (LessonPlanStatus | 'all')[] = ['all', 'Planned', 'Presented', 'Practicing', 'Mastered', 'Deferred'];

export default function LessonPlanningPage() {
  const { user } = useAuth();
  const canManage = user ? hasPermission(user.role, 'lessons.manage') : false;

  const [items, setItems] = useState<LessonPlan[]>([]);
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<LessonPlanStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Load classrooms for filter
  useEffect(() => {
    apiClient.get<any[]>('/classrooms').then((data) => {
      setClassrooms(data.map((c) => ({ id: c.id, name: c.name })));
    }).catch(() => {});
  }, []);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {};
      if (selectedClassroom !== 'all') params.classroomId = selectedClassroom;
      if (selectedStatus !== 'all') params.status = mapLessonPlanStatusToApi(selectedStatus);
      const data = await curriculumApi.plans.list(params);
      setItems(data.map(mapApiLessonPlan));
    } catch (err: any) {
      setError(err?.message || 'Failed to load lesson plans');
    } finally {
      setLoading(false);
    }
  }, [selectedClassroom, selectedStatus]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this scheduled presentation?')) return;
    setDeleting(id);
    try {
      await curriculumApi.plans.delete(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: LessonPlanStatus) => {
    setUpdatingStatus(id);
    try {
      await curriculumApi.plans.update(id, { status: mapLessonPlanStatusToApi(newStatus) });
      setItems((prev) => prev.map((p) => p.id === id ? { ...p, status: newStatus } : p));
    } catch (err: any) {
      alert(err?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const planStatuses: LessonPlanStatus[] = ['Planned', 'Presented', 'Practicing', 'Mastered', 'Deferred'];

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70 mb-1">Learning</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Lesson Planning</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">Schedule and track Montessori presentations for students and classrooms</p>
          </div>
          {canManage && (
            <LessonPlanForm
              onSuccess={loadPlans}
              trigger={
                <Button id="schedule-presentation-btn" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Schedule presentation
                </Button>
              }
            />
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={selectedClassroom} onValueChange={setSelectedClassroom}>
            <SelectTrigger id="classroom-filter" className="w-52">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All classrooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classrooms</SelectItem>
              {classrooms.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v as LessonPlanStatus | 'all')}>
            <SelectTrigger id="status-filter" className="w-48">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              {PLAN_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s === 'all' ? 'All statuses' : s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <span><span className="font-semibold text-foreground">{items.length}</span> presentations</span>
          {planStatuses.map((s) => {
            const count = items.filter((p) => p.status === s).length;
            if (count === 0) return null;
            return (
              <span key={s}>
                <span className={cn('font-semibold', STATUS_STYLES[s].split(' ')[1])}>{count}</span> {s}
              </span>
            );
          })}
        </div>

        {/* Loading / error / empty */}
        {loading && (
          <div className="flex h-48 items-center justify-center text-muted-foreground">Loading plans...</div>
        )}
        {!loading && error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
            <CalendarCheck className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No presentations scheduled yet.</p>
            {canManage && (
              <LessonPlanForm
                onSuccess={loadPlans}
                trigger={<Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" />Schedule first presentation</Button>}
              />
            )}
          </div>
        )}

        {/* Plan cards */}
        {!loading && !error && items.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((plan) => (
              <div
                key={plan.id}
                id={`plan-${plan.id}`}
                className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-border hover:shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground leading-snug">{plan.lessonTitle}</p>
                    <p className={cn('text-xs font-medium mt-0.5', AREA_COLORS[plan.area] || 'text-muted-foreground')}>
                      {plan.area}
                    </p>
                  </div>
                  {canManage && (
                    <button
                      id={`delete-plan-${plan.id}`}
                      onClick={() => handleDelete(plan.id)}
                      disabled={deleting === plan.id}
                      className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                      aria-label="Remove plan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Student / Classroom */}
                <div className="flex items-center gap-2">
                  <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold', plan.studentColor)}>
                    {plan.studentInitials}
                  </span>
                  <div>
                    <p className="text-xs font-medium text-foreground">{plan.studentName}</p>
                    {plan.classroomName && (
                      <p className="text-[10px] text-muted-foreground">{plan.classroomName}</p>
                    )}
                  </div>
                </div>

                {/* Date & Status */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-xs text-muted-foreground">{plan.scheduledDate}</span>
                  {canManage ? (
                    <Select
                      value={plan.status}
                      onValueChange={(v) => handleStatusChange(plan.id, v as LessonPlanStatus)}
                      disabled={updatingStatus === plan.id}
                    >
                      <SelectTrigger id={`status-${plan.id}`} className={cn('h-6 w-32 border text-[10px] font-semibold px-2', STATUS_STYLES[plan.status])}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {planStatuses.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-semibold', STATUS_STYLES[plan.status])}>
                      {plan.status}
                    </span>
                  )}
                </div>

                {/* Notes */}
                {plan.notes && (
                  <p className="text-xs text-muted-foreground italic border-t border-border/50 pt-2 line-clamp-2">
                    {plan.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
