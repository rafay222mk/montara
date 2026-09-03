export default function Loading() {
  return (
    <div className="flex min-h-[55vh] w-full flex-col items-center justify-center gap-3">
      <div className="relative flex h-10 w-10 items-center justify-center">
        <div className="absolute h-10 w-10 animate-ping rounded-full bg-primary/20" />
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
      <p className="text-xs font-medium text-muted-foreground animate-pulse">Loading workspace...</p>
    </div>
  );
}
