import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorState({ title = 'Something needs attention', description = 'We could not load this information right now.', onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-destructive/25 bg-destructive/[0.04] p-8 text-center"><AlertCircle className="h-6 w-6 text-red-300" /><p className="mt-3 text-sm font-medium">{title}</p><p className="mt-1 max-w-sm text-xs text-muted-foreground">{description}</p>{onRetry && <Button variant="outline" size="sm" className="mt-4 gap-2" onClick={onRetry}><RefreshCw className="h-3.5 w-3.5" /> Try again</Button>}</div>;
}
