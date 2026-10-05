// Menu skeleton: title, category circles and a grid of cards.
export default function MenuLoading() {
  return (
    <main aria-busy="true" aria-label="Loading menu" className="mx-auto max-w-6xl animate-pulse px-4 pb-16 pt-8">
      <div className="h-12 w-40 rounded-lg bg-alt" />
      <div className="mt-3 h-4 w-64 max-w-full rounded bg-alt" />

      <div className="mt-6 flex gap-3 overflow-hidden border-b border-line pb-3">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="flex w-16 shrink-0 flex-col items-center gap-2">
            <div className="h-12 w-12 rounded-full bg-alt" />
            <div className="h-3 w-12 rounded bg-alt" />
          </div>
        ))}
      </div>

      <div className="mt-6 h-8 w-48 rounded-lg bg-alt" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-line bg-card">
            <div className="aspect-square bg-alt sm:aspect-[4/3]" />
            <div className="space-y-2 p-3">
              <div className="h-4 w-3/4 rounded bg-alt" />
              <div className="h-3 w-full rounded bg-alt" />
              <div className="h-5 w-16 rounded bg-alt" />
              <div className="h-9 w-full rounded-full bg-alt" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
