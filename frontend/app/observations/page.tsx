'use client';

import { CalendarDays, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { FilterBar, ObservationCard, PageHeader } from '@/components/shared';
import { ObservationForm } from '@/components/forms/record-forms';
import { Button } from '@/components/ui/button';
import { observationsApi } from '@/lib/api/observations';
import { mapApiObservation, mapObservationAreaToApi, mapObservationStatusToApi } from '@/lib/utils';
import { MontessoriArea, Observation, ObservationProgress } from '@/types';
import { useAuth } from '@/lib/auth/auth-context';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ObservationsPage() {
  const [items, setItems] = useState<Observation[]>([]);
  const [selectedArea, setSelectedArea] = useState<MontessoriArea | 'all'>('all');
  const [selectedProgress, setSelectedProgress] = useState<ObservationProgress | 'all'>('all');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const isReadOnly = user?.role === 'PARENT';

  const loadObservations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: any = {};
      if (selectedArea !== 'all') {
        filters.area = mapObservationAreaToApi(selectedArea);
      }
      if (selectedProgress !== 'all') {
        filters.progress = mapObservationStatusToApi(selectedProgress);
      }
      const apiData = await observationsApi.list(filters);
      setItems(apiData.map(mapApiObservation));
    } catch (err: any) {
      setError(err?.message || 'Failed to load observations');
    } finally {
      setLoading(false);
    }
  }, [selectedArea, selectedProgress]);

  useEffect(() => {
    loadObservations();
  }, [loadObservations]);

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
        eyebrow="Learning / Child-led records"
        title="Observations"
        description="Capture the small moments that show how each child is unfolding."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
        <FilterBar>
          <Select value={selectedProgress} onValueChange={(val) => setSelectedProgress(val as any)} disabled={loading}>
            <SelectTrigger className="w-[160px] bg-card border-border h-10 text-xs">
              <SelectValue placeholder="All progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All progress</SelectItem>
              <SelectItem value="Not Started">Not Started</SelectItem>
              <SelectItem value="Introduced">Introduced</SelectItem>
              <SelectItem value="Practicing">Practicing</SelectItem>
              <SelectItem value="Developing">Developing</SelectItem>
              <SelectItem value="Mastered">Mastered</SelectItem>
            </SelectContent>
          </Select>
        </FilterBar>

        {!isReadOnly && <ObservationForm onSuccess={loadObservations} />}
      </div>

      <div className="mb-5 flex flex-wrap gap-2 items-center">
        {areas.map((area) => {
          const isActive = selectedArea === area;
          const displayLabel = area === 'all' ? 'All areas' : area;
          return (
            <Button
              key={area}
              variant={isActive ? 'secondary' : 'ghost'}
              size="sm"
              className={isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}
              onClick={() => setSelectedArea(area)}
              disabled={loading}
            >
              {displayLabel}
            </Button>
          );
        })}
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
          <h3 className="text-sm font-semibold text-foreground">No observations recorded</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Capture a meaningful moment from the prepared environment.
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {items.map((item) => (
            <ObservationCard key={item.id} observation={item} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
