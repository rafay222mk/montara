'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AssessmentCard, AvatarText, DataTable, FilterBar, PageHeader, ScoreDisplay, StatusBadge } from '@/components/shared';
import { AssessmentForm } from '@/components/forms/record-forms';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { assessmentsApi } from '@/lib/api/assessments';
import { mapApiAssessment, mapObservationAreaToApi, mapAssessmentLevelToApi } from '@/lib/utils';
import { Assessment, AssessmentLevel, MontessoriArea } from '@/types';
import { useAuth } from '@/lib/auth/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AssessmentsPage() {
  const [items, setItems] = useState<Assessment[]>([]);
  const [selectedArea, setSelectedArea] = useState<MontessoriArea | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<AssessmentLevel | 'all'>('all');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const isReadOnly = user?.role === 'PARENT';

  const loadAssessments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (selectedArea !== 'all') {
        filters.area = mapObservationAreaToApi(selectedArea);
      }
      if (selectedLevel !== 'all') {
        filters.level = mapAssessmentLevelToApi(selectedLevel);
      }
      const data = await assessmentsApi.list(filters);
      setItems(data.map(mapApiAssessment));
    } catch (err: any) {
      setError(err?.message || 'Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }, [selectedArea, selectedLevel]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  // Export current list to CSV
  const handleExport = () => {
    if (items.length === 0) return;
    const headers = ['Student', 'Assessment', 'Area', 'Skill', 'Score', 'Level', 'Teacher', 'Date'];
    const rows = items.map((item) => [
      item.studentName,
      item.title,
      item.area,
      item.skill,
      item.score,
      item.level,
      item.teacher,
      item.date,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `assessments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const areas: (MontessoriArea | 'all')[] = [
    'all',
    'Practical Life',
    'Sensorial',
    'Language',
    'Mathematics',
    'Cultural',
    'Art',
    'Music',
    'Movement',
    'Social Emotional',
  ];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Learning / Progress markers"
        title="Assessments"
        description="See evidence of learning across every Montessori area."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <FilterBar>
          <Select value={selectedArea} onValueChange={(val) => setSelectedArea(val as any)} disabled={loading}>
            <SelectTrigger className="w-[150px] bg-card border-border h-10 text-xs">
              <SelectValue placeholder="All areas" />
            </SelectTrigger>
            <SelectContent>
              {areas.map((a) => (
                <SelectItem key={a} value={a}>
                  {a === 'all' ? 'All areas' : a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedLevel} onValueChange={(val) => setSelectedLevel(val as any)} disabled={loading}>
            <SelectTrigger className="w-[150px] bg-card border-border h-10 text-xs">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              <SelectItem value="Beginning">Beginning</SelectItem>
              <SelectItem value="Developing">Developing</SelectItem>
              <SelectItem value="Proficient">Proficient</SelectItem>
              <SelectItem value="Advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>

        <Button variant="outline" className="sm:mb-5 gap-2" onClick={handleExport} disabled={loading || items.length === 0}>
          <Download className="h-4 w-4" /> Export
        </Button>

        {!isReadOnly && <AssessmentForm onSuccess={loadAssessments} />}
      </div>

      {loading && (
        <div className="flex justify-center items-center h-48">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/15 p-4 text-sm text-destructive mb-6">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">No assessments recorded</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Create an assessment to start documenting child progress levels.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="mb-6 grid gap-4 md:hidden">
            {items.map((item) => (
              <AssessmentCard key={item.id} assessment={item} />
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable headers={['Student', 'Assessment', 'Area / skill', 'Score', 'Level', 'Teacher', 'Date']}>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <AvatarText initials={item.initials} name={item.studentName} color={item.color} />
                  </TableCell>
                  <TableCell className="text-sm font-medium">{item.title}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">{item.area}</span>
                    <span className="mt-1 block text-xs text-muted-foreground/70">{item.skill}</span>
                  </TableCell>
                  <TableCell>
                    <ScoreDisplay score={item.score} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={item.level} />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.teacher}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{item.date}</TableCell>
                </TableRow>
              ))}
            </DataTable>
          </div>
        </>
      )}
    </AppShell>
  );
}
