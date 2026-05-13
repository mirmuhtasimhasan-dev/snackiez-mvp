export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-orange-500">
          Snackiez
        </h1>

        <p className="mt-4 text-gray-600 text-lg">
          Delicious food delivered fast
        </p>

        <a
          href="/menu"
          className="inline-block mt-6 bg-orange-500 text-white px-6 py-3 rounded-xl font-semibold"
        >
          View Menu
        </a>
      </div>
    </main>
  );
}