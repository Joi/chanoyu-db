export default function Loading() {
  return (
    <main className="max-w-3xl mx-auto p-6">
      <div className="h-5 w-56 bg-gray-200 rounded animate-pulse mb-2" />
      <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mb-4" />
      <div className="grid mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
        <div className="h-48 w-full bg-gray-100 rounded animate-pulse" />
        <div className="h-48 w-full bg-gray-100 rounded animate-pulse" />
        <div className="h-48 w-full bg-gray-100 rounded animate-pulse" />
      </div>
      <div className="h-80 w-full bg-gray-100 rounded animate-pulse mb-6" />
      <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
    </main>
  );
}



