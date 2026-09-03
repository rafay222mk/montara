import { Card, CardContent } from '@/components/ui/card';
import { AvatarText } from '@/components/shared';
import { AreaBadge, ScoreDisplay } from '@/components/shared/learning';
import { StatusBadge } from '@/components/shared';
import { Assessment } from '@/types';

export function AssessmentCard({ assessment }: { assessment: Assessment }) { return <Card className="transition-colors hover:border-primary/25"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><AvatarText initials={assessment.initials} name={assessment.studentName} meta={`${assessment.teacher} · ${assessment.date}`} color={assessment.color} /><ScoreDisplay score={assessment.score} /></div><div className="mt-4 flex flex-wrap items-center gap-2"><AreaBadge area={assessment.area} /><StatusBadge status={assessment.level} /></div><p className="mt-3 text-sm font-medium">{assessment.title}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{assessment.comments}</p></CardContent></Card>; }
