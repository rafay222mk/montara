import { Loader2 } from 'lucide-react';

export function LoadingState({ label = 'Loading your workspace…' }: { label?: string }) {
  return <div className="flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-border bg-card/40 p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /><p className="mt-3 text-sm text-muted-foreground">{label}</p></div>;
}
