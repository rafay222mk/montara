'use client';

import { BookOpen, Search, Layers, Plus, Trash2, CheckCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { LessonForm } from '@/components/forms/record-forms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { curriculumApi } from '@/lib/api/curriculum';
import { mapApiLesson } from '@/lib/utils';
import { CurriculumLesson, MontessoriArea } from '@/types';
import { useAuth } from '@/lib/auth/auth-context';
import { hasPermission } from '@/lib/auth/permissions';
import { cn } from '@/lib/utils';

const AREA_COLORS: Record<string, string> = {
  'Practical Life':  'bg-amber-400/15 text-amber-300 border-amber-400/20',
  'Sensorial':       'bg-purple-400/15 text-purple-300 border-purple-400/20',
  'Language':        'bg-sky-400/15 text-sky-300 border-sky-400/20',
  'Mathematics':     'bg-emerald-400/15 text-emerald-300 border-emerald-400/20',
  'Cultural':        'bg-rose-400/15 text-rose-300 border-rose-400/20',
  'Art':             'bg-pink-400/15 text-pink-300 border-pink-400/20',
  'Music':           'bg-violet-400/15 text-violet-300 border-violet-400/20',
  'Movement':        'bg-orange-400/15 text-orange-300 border-orange-400/20',
  'Social Emotional':'bg-teal-400/15 text-teal-300 border-teal-400/20',
};

const API_AREA_MAP: Record<string, MontessoriArea> = {
  PRACTICAL_LIFE:  'Practical Life',
  SENSORIAL:       'Sensorial',
  LANGUAGE:        'Language',
  MATHEMATICS:     'Mathematics',
  CULTURAL:        'Cultural',
  ART:             'Art',
  MUSIC:           'Music',
  MOVEMENT:        'Movement',
  SOCIAL_EMOTIONAL:'Social Emotional',
};

const AREA_TO_API: Record<MontessoriArea, string> = Object.fromEntries(
  Object.entries(API_AREA_MAP).map(([k, v]) => [v, k])
) as Record<MontessoriArea, string>;

const montessoriAreas: MontessoriArea[] = [
  'Practical Life', 'Sensorial', 'Language', 'Mathematics', 'Cultural',
  'Art', 'Music', 'Movement', 'Social Emotional',
];

export default function CurriculumPage() {
  const { user } = useAuth();
  const canManage = user ? hasPermission(user.role, 'curriculum.manage') : false;

  const [items, setItems] = useState<CurriculumLesson[]>([]);
  const [selectedArea, setSelectedArea] = useState<MontessoriArea | 'all'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadLessons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { isActive: true };
      if (selectedArea !== 'all') params.area = AREA_TO_API[selectedArea];
      if (search.trim()) params.search = search.trim();
      const data = await curriculumApi.lessons.list(params);
      setItems(data.map(mapApiLesson));
    } catch (err: any) {
      setError(err?.message || 'Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  }, [selectedArea, search]);

  useEffect(() => {
    const timer = setTimeout(loadLessons, 300);
    return () => clearTimeout(timer);
  }, [loadLessons]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lesson from the curriculum catalog?')) return;
    setDeleting(id);
    try {
      await curriculumApi.lessons.delete(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete lesson');
    } finally {
      setDeleting(null);
    }
  };

  // Group by area for display
  const grouped = montessoriAreas.reduce<Record<string, CurriculumLesson[]>>((acc, area) => {
    const areaItems = items.filter((i) => i.area === area);
    if (areaItems.length > 0) acc[area] = areaItems;
    return acc;
  }, {});

  return (
    <AppShell>
      <div className="space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground/70 mb-1">Learning</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">Curriculum Catalog</h1>
            <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">Browse and manage Montessori lessons and materials</p>
          </div>
          {canManage && (
            <LessonForm
              onSuccess={loadLessons}
              trigger={
                <Button id="add-lesson-btn" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add lesson
                </Button>
              }
            />
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="curriculum-search"
              placeholder="Search lessons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedArea} onValueChange={(v) => setSelectedArea(v as MontessoriArea | 'all')}>
            <SelectTrigger id="area-filter" className="w-48">
              <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All areas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All areas</SelectItem>
              {montessoriAreas.map((a) => (
                <SelectItem key={a} value={a}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span><span className="font-semibold text-foreground">{items.length}</span> lessons</span>
          <span><span className="font-semibold text-foreground">{Object.keys(grouped).length}</span> areas</span>
        </div>

        {/* Loading / error / empty */}
        {loading && (
          <div className="flex h-48 items-center justify-center text-muted-foreground">
            Loading curriculum...
          </div>
        )}
        {!loading && error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}
        {!loading && !error && items.length === 0 && (
          <div className="flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border text-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No lessons found.</p>
            {canManage && (
              <LessonForm
                onSuccess={loadLessons}
                trigger={<Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" />Add first lesson</Button>}
              />
            )}
          </div>
        )}

        {/* Grouped lesson cards */}
        {!loading && !error && Object.entries(grouped).map(([area, areaLessons]) => (
          <div key={area} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className={cn('rounded-full border px-3 py-0.5 text-xs font-semibold', AREA_COLORS[area] || 'bg-muted text-muted-foreground border-border')}>
                {area}
              </span>
              <span className="text-xs text-muted-foreground">{areaLessons.length} lessons</span>
              <div className="flex-1 border-t border-border/50" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {areaLessons.map((lesson) => (
                <div
                  key={lesson.id}
                  id={`lesson-${lesson.id}`}
                  className="group relative flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-border hover:shadow-sm"
                >
                  {/* Sequence badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                        {lesson.sequence}
                      </span>
                      <span className="text-sm font-medium leading-snug text-foreground">{lesson.title}</span>
                    </div>
                    {canManage && (
                      <button
                        id={`delete-lesson-${lesson.id}`}
                        onClick={() => handleDelete(lesson.id)}
                        disabled={deleting === lesson.id}
                        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        aria-label="Delete lesson"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {lesson.description || 'No description provided.'}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      Age: {lesson.ageGroup}
                    </span>
                    {lesson.materialsNeeded && (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        <CheckCircle className="h-2.5 w-2.5" />
                        Has materials
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
