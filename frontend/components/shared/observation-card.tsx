import { Card, CardContent } from '@/components/ui/card';
import { AvatarText } from '@/components/shared';
import { AreaBadge, ProgressBadge } from '@/components/shared/learning';
import { Observation } from '@/types';

export function ObservationCard({ observation }: { observation: Observation }) { return <Card className="transition-colors hover:border-primary/25"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><AvatarText initials={observation.initials} name={observation.studentName} meta={`${observation.teacher} · ${observation.date}`} color={observation.color} /><ProgressBadge progress={observation.progress} /></div><div className="mt-4 flex flex-wrap items-center gap-2"><AreaBadge area={observation.area} /><span className="text-xs text-muted-foreground">{observation.skill}</span></div><p className="mt-3 text-sm leading-6 text-foreground/90">{observation.note}</p></CardContent></Card>; }
