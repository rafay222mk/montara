import { CheckCircle2, CircleDashed, CircleDot, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ObservationProgress } from '@/types';

const styles: Record<ObservationProgress, string> = {
  'Not Started': 'border-border bg-muted text-muted-foreground', Introduced: 'border-sky-400/25 bg-sky-400/10 text-sky-300', Practicing: 'border-secondary/25 bg-secondary/10 text-secondary', Developing: 'border-orange-400/25 bg-orange-400/10 text-orange-300', Mastered: 'border-primary/25 bg-primary/10 text-primary',
};
const icons: Record<ObservationProgress, React.ElementType> = { 'Not Started': CircleDashed, Introduced: CircleDot, Practicing: Sparkles, Developing: Sparkles, Mastered: CheckCircle2 };

export function ProgressBadge({ progress }: { progress: ObservationProgress }) { const Icon = icons[progress]; return <Badge variant="outline" className={cn('gap-1 font-medium', styles[progress])}><Icon className="h-3 w-3" />{progress}</Badge>; }
export function AreaBadge({ area }: { area: string }) { return <span className="inline-flex rounded-full border border-primary/20 bg-primary/[0.07] px-2.5 py-1 text-[11px] font-medium text-primary">{area}</span>; }
export function ScoreDisplay({ score }: { score: number }) { return <span className={cn('text-sm font-semibold', score >= 80 ? 'text-primary' : score >= 65 ? 'text-secondary' : 'text-rose-300')}>{score}<span className="text-xs font-normal text-muted-foreground">/100</span></span>; }
