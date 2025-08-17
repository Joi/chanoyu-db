export default function HomePage() {
  return (
    <main>
      <section className="prose">
        <h1>Ito Collection</h1>
        <p>
          This site publishes identifiers for items in the Ito Collection. Given the right URL, it resolves to
          human-readable pages and machine-readable Linked Art JSON-LD metadata for the object.
        </p>
        <p>
          Try the <a href="/lookup">Category Lookup</a> or visit an object at <code>/id/&lt;token&gt;</code>.
        </p>
      </section>
    </main>
  );
}
