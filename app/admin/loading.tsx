/** Shown the moment an admin link is clicked, while the next page loads. */
export default function AdminLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[#166534]/10" />
      <div className="h-4 w-72 animate-pulse rounded bg-[#166534]/10" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-[#166534]/10" />
        ))}
      </div>
    </div>
  );
}
