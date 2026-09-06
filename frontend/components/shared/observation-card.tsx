'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AvatarText, ConfirmDialog } from '@/components/shared';
import { AreaBadge, ProgressBadge } from '@/components/shared/learning';
import { Button } from '@/components/ui/button';
import { ObservationForm } from '@/components/forms/record-forms';
import { observationsApi } from '@/lib/api/observations';
import { Observation } from '@/types';

export function ObservationCard({
  observation,
  canManage = false,
  onUpdated,
  onDeleted,
}: {
  observation: Observation;
  canManage?: boolean;
  onUpdated?: () => void;
  onDeleted?: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await observationsApi.delete(observation.id);
      onDeleted?.();
    } catch (err) {
      console.error('Failed to delete observation:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="transition-colors hover:border-primary/25">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <AvatarText
            initials={observation.initials}
            name={observation.studentName}
            meta={`${observation.teacher} · ${observation.date}`}
            color={observation.color}
          />
          <div className="flex items-center gap-2">
            <ProgressBadge progress={observation.progress} />
            {canManage && (
              <div className="flex items-center gap-1">
                <ObservationForm
                  observationId={observation.id}
                  onSuccess={onUpdated}
                  trigger={
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" title="Edit observation">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  title="Delete observation"
                  onClick={() => setDeleteOpen(true)}
                  disabled={deleting}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <AreaBadge area={observation.area} />
          <span className="text-xs text-muted-foreground">{observation.skill}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-foreground/90">{observation.note}</p>

        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete Observation"
          description={`Are you sure you want to remove the observation "${observation.skill}" for ${observation.studentName}?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
        />
      </CardContent>
    </Card>
  );
}
