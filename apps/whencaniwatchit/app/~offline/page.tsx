export default function OfflinePage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold">You&apos;re offline</h1>
      <p className="mt-2 text-muted-foreground">
        Check your connection and try again.
      </p>
    </div>
  );
}
