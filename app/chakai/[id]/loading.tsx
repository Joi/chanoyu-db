export default function Loading() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="h-5 w-48 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mb-4" />
      <div className="h-40 w-full bg-gray-100 rounded animate-pulse mb-6" />
      <div className="grid gap-3">
        <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse" />
        <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
      </div>
    </main>
  );
}



