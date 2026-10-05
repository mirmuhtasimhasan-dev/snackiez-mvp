// Shown instantly while a customer page loads (home and any page without
// its own loading file).
export default function Loading() {
  return (
    <main aria-busy="true" aria-label="Loading" className="animate-pulse">
      <div className="h-[45vh] bg-alt lg:h-[60vh]" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="h-9 w-56 rounded-lg bg-alt" />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-2xl border border-line bg-card">
              <div className="aspect-square bg-alt sm:aspect-[4/3]" />
              <div className="space-y-2 p-3">
                <div className="h-4 w-3/4 rounded bg-alt" />
                <div className="h-3 w-full rounded bg-alt" />
                <div className="h-9 w-full rounded-full bg-alt" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
