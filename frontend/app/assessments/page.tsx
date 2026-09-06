'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Download, Pencil, Sparkles, Trash2 } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { AssessmentCard, AvatarText, ConfirmDialog, DataTable, FilterBar, PageHeader, ScoreDisplay, StatusBadge } from '@/components/shared';
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
  const [searchQuery, setSearchQuery] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deletion state for table view
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingItem, setDeletingItem] = useState<Assessment | null>(null);

  const { user } = useAuth();
  const canCreate = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN' || user?.role === 'TEACHER';
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'SCHOOL_ADMIN';

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

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await assessmentsApi.delete(deletingItem.id);
      setDeletingItem(null);
      loadAssessments();
    } catch (err) {
      console.error('Failed to delete assessment:', err);
    }
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.studentName.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.skill.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q) ||
        item.teacher.toLowerCase().includes(q) ||
        item.comments.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  const hasActiveFilters = Boolean(searchQuery || selectedArea !== 'all' || selectedLevel !== 'all');

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedArea('all');
    setSelectedLevel('all');
  };

  // Export current list to CSV
  const handleExport = () => {
    if (filteredItems.length === 0) return;
    const headers = ['Student', 'Assessment', 'Area', 'Skill', 'Score', 'Level', 'Teacher', 'Date'];
    const rows = filteredItems.map((item) => [
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

  const tableHeaders = canManage
    ? ['Student', 'Assessment', 'Area / skill', 'Score', 'Level', 'Teacher', 'Date', 'Actions']
    : ['Student', 'Assessment', 'Area / skill', 'Score', 'Level', 'Teacher', 'Date'];

  return (
    <AppShell>
      <PageHeader
        eyebrow="Learning / Progress markers"
        title="Assessments"
        description="See evidence of learning across every Montessori area."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <FilterBar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search assessments by student, title, skill..."
          onReset={handleResetFilters}
          hasActiveFilters={hasActiveFilters}
        >
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

        <Button variant="outline" className="sm:mb-5 gap-2" onClick={handleExport} disabled={loading || filteredItems.length === 0}>
          <Download className="h-4 w-4" /> Export
        </Button>

        {canCreate && <AssessmentForm onSuccess={loadAssessments} />}
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

      {!loading && !error && filteredItems.length === 0 && (
        <div className="rounded-lg border border-dashed border-border bg-card p-12 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/60 mb-3" />
          <h3 className="text-sm font-semibold text-foreground">
            {hasActiveFilters ? 'No assessments match your filters' : 'No assessments recorded'}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {hasActiveFilters ? 'Try adjusting your search query or level filters.' : 'Create an assessment to start documenting child progress levels.'}
          </p>
        </div>
      )}

      {!loading && !error && filteredItems.length > 0 && (
        <>
          <div className="mb-6 grid gap-4 md:hidden">
            {filteredItems.map((item) => (
              <AssessmentCard
                key={item.id}
                assessment={item}
                canManage={canManage}
                onUpdated={loadAssessments}
                onDeleted={loadAssessments}
              />
            ))}
          </div>

          <div className="hidden md:block">
            <DataTable headers={tableHeaders}>
              {filteredItems.map((item) => (
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
                  {canManage && (
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <AssessmentForm
                          assessmentId={item.id}
                          onSuccess={loadAssessments}
                          trigger={
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Edit assessment">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          }
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          title="Delete assessment"
                          onClick={() => setDeletingItem(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </DataTable>
          </div>

          <ConfirmDialog
            open={!!deletingItem}
            onOpenChange={(open) => !open && setDeletingItem(null)}
            title="Delete Assessment"
            description={deletingItem ? `Are you sure you want to delete the assessment "${deletingItem.title}" for ${deletingItem.studentName}?` : ''}
            confirmLabel="Delete"
            onConfirm={handleDelete}
          />
        </>
      )}
    </AppShell>
  );
}
