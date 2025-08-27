export default function Loading() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="h-5 w-64 bg-gray-200 rounded animate-pulse mb-3" />
      <div className="relative w-full" style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#f1f1f1', borderRadius: 6, overflow: 'hidden', border: '1px solid #eee' }} />
      <div className="grid mt-6" style={{ gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="space-y-2">
          <div className="h-4 w-40 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-56 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-52 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-44 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </main>
  );
}



