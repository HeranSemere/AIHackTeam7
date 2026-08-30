export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent opacity-50" aria-hidden />
      <p className="text-sm text-ink/50">{label ?? "Loading…"}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const message = error instanceof Error ? error.message : "Something went wrong.";

  return (
    <div className="mx-auto max-w-md rounded-xl2 border border-clay/20 bg-clay-light p-6 text-center">
      <p className="font-semibold text-clay">Couldn&apos;t load this</p>
      <p className="mt-2 text-sm text-clay/90">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full bg-clay px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Try again
        </button>
      )}
    </div>
  );
}
