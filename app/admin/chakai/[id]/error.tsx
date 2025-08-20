"use client";

export default function ErrorPage({ error }: { error: Error & { digest?: string } }) {
  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Could not update Chakai</h1>
      <p className="text-sm text-red-700">{error.message || 'Something went wrong.'}</p>
      <a className="button mt-4" href="/admin/chakai">Back</a>
    </main>
  );
}


