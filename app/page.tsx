export default function HomePage() {
  return (
    <main>
      <section className="prose">
        <h1>Ito Collection</h1>
        <ul className="list-disc pl-5">
          <li><a className="underline" href="/admin/items">Items</a> — list and manage items</li>
          <li><a className="underline" href="/admin/items-and-images">Items and Images</a> — manage items with images</li>
          <li><a className="underline" href="/admin/media">Images</a> — browse and edit media</li>
          <li><a className="underline" href="/admin/classifications">Classifications</a> — browse and edit categories</li>
          <li><a className="underline" href="/admin/members">Members</a> — manage users</li>
          <li><a className="underline" href="/lookup">Lookup</a> — find AAT/Wikidata classifications</li>
        </ul>
      </section>
    </main>
  );
}
