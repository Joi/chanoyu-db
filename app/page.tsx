export default function HomePage() {
  return (
    <main>
      <section className="prose">
        <h1>Soichi Ito Chanoyu Database</h1>
        <h2 lang="ja">伊藤宗一茶の湯データベース</h2>

        <p>
          Welcome to a comprehensive database for managing and documenting tea ceremony utensils and related
          materials. This platform integrates tea utensils with Wikidata links and Getty Art &amp; Architecture
          Thesaurus (AAT) classifications, connecting items with people, tea gatherings (茶会/chakai), and tea room
          locations.
        </p>

        <h3>Features:</h3>
        <ul>
          <li>Publicly accessible canonical links for tea utensils and references</li>
          <li>Access-controlled pages for private tea gathering records and collection items</li>
          <li>Systematic classification using international museum standards</li>
          <li>Cross-referenced documentation of tea ceremony culture and history</li>
        </ul>

        <p>
          <strong>For Members:</strong> <a href="/login">Login here</a> to access private collections and tea
          gathering records.
        </p>
        <p>
          <strong>Open Source:</strong>{' '}
          <a href="https://github.com/Joi/chanoyu-db" target="_blank" rel="noopener noreferrer">
            View our codebase and contribute on GitHub
          </a>
        </p>

        <p className="mt-8 text-[10px] text-gray-500">&quot;Soichi/宗一&quot; is the tea name of Joichi Ito / 伊藤穰一</p>
      </section>
    </main>
  );
}
