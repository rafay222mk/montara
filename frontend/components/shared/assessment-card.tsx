'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { AvatarText, ConfirmDialog, StatusBadge } from '@/components/shared';
import { AreaBadge, ScoreDisplay } from '@/components/shared/learning';
import { Button } from '@/components/ui/button';
import { AssessmentForm } from '@/components/forms/record-forms';
import { assessmentsApi } from '@/lib/api/assessments';
import { Assessment } from '@/types';

export function AssessmentCard({
  assessment,
  canManage = false,
  onUpdated,
  onDeleted,
}: {
  assessment: Assessment;
  canManage?: boolean;
  onUpdated?: () => void;
  onDeleted?: () => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await assessmentsApi.delete(assessment.id);
      onDeleted?.();
    } catch (err) {
      console.error('Failed to delete assessment:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="transition-colors hover:border-primary/25">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <AvatarText
            initials={assessment.initials}
            name={assessment.studentName}
            meta={`${assessment.teacher} · ${assessment.date}`}
            color={assessment.color}
          />
          <div className="flex items-center gap-2">
            <ScoreDisplay score={assessment.score} />
            {canManage && (
              <div className="flex items-center gap-1">
                <AssessmentForm
                  assessmentId={assessment.id}
                  onSuccess={onUpdated}
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
          <AreaBadge area={assessment.area} />
          <StatusBadge status={assessment.level} />
        </div>
        <p className="mt-3 text-sm font-medium">{assessment.title}</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{assessment.comments}</p>

        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete Assessment"
          description={`Are you sure you want to delete the assessment "${assessment.title}" for ${assessment.studentName}?`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
        />
      </CardContent>
    </Card>
  );
}
