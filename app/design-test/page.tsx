import Card from '@/app/components/Card'

/**
 * Tea Ceremony Design System Test Page
 *
 * This page demonstrates the new design system with:
 * - Tea ceremony colors (shibui, wabi, yugen, matcha)
 * - Ma-based spacing
 * - Bilingual typography
 * - Card components
 */

export default function DesignTestPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border pa-md">
        <h1 className="text-3xl font-bold text-yugen">
          <span lang="en">Tea Ceremony Design System</span>
          {' / '}
          <span lang="ja">茶の湯デザインシステム</span>
        </h1>
        <p className="text-muted-foreground mt-2">
          A design system aligned with tea ceremony aesthetics
        </p>
      </header>

      <main className="ma-lg max-w-6xl mx-auto">
        {/* Color Palette Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Color Palette - Tea Ceremony Aesthetics
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Shibui */}
            <div className="card">
              <div className="w-full h-24 bg-shibui rounded mb-3"></div>
              <h3 className="font-medium text-sm">渋い (Shibui)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Subtle, unobtrusive elegance
              </p>
              <code className="text-xs mt-2 block">bg-shibui</code>
            </div>

            {/* Wabi */}
            <div className="card">
              <div className="w-full h-24 bg-wabi border border-border rounded mb-3"></div>
              <h3 className="font-medium text-sm">侘び (Wabi)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Beauty in imperfection, naturalness
              </p>
              <code className="text-xs mt-2 block">bg-wabi</code>
            </div>

            {/* Yugen */}
            <div className="card">
              <div className="w-full h-24 bg-yugen rounded mb-3"></div>
              <h3 className="font-medium text-sm">幽玄 (Yugen)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Profound grace, subtle depth
              </p>
              <code className="text-xs mt-2 block">bg-yugen</code>
            </div>

            {/* Matcha */}
            <div className="card">
              <div className="w-full h-24 bg-matcha rounded mb-3"></div>
              <h3 className="font-medium text-sm">抹茶 (Matcha)</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tea green for accents
              </p>
              <code className="text-xs mt-2 block">bg-matcha</code>
            </div>
          </div>
        </section>

        {/* Spacing (Ma) Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            間 (Ma) - Negative Space & Breathing Room
          </h2>

          <div className="space-y-4">
            <div className="card bg-wabi">
              <div className="pa-sm bg-matcha text-white rounded">
                <code>pa-sm</code> - Small pause (0.75rem padding)
              </div>
            </div>

            <div className="card bg-wabi">
              <div className="pa-md bg-shibui text-white rounded">
                <code>pa-md</code> - Natural breath (1.5rem padding)
              </div>
            </div>

            <div className="card bg-wabi">
              <div className="pa-lg bg-yugen text-white rounded">
                <code>pa-lg</code> - Contemplative space (3rem padding)
              </div>
            </div>
          </div>
        </section>

        {/* Card Component Examples */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Card Components
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              title="Simple Card"
              subtitle="Basic card with title and subtitle"
            >
              <p className="text-sm text-muted-foreground">
                This card uses the tea ceremony design system.
              </p>
            </Card>

            <Card
              href="/admin"
              title="Linked Card"
              subtitle="Hover to see the effect"
            >
              <p className="text-sm text-muted-foreground">
                Cards can be clickable links.
              </p>
            </Card>

            <Card
              title={
                <>
                  <span lang="en">Bilingual Card</span>
                  <br />
                  <span lang="ja">二言語カード</span>
                </>
              }
              subtitle="Structural bilingual support"
            >
              <p className="text-sm">
                <span lang="en">Typography adjusts per language</span>
                <br />
                <span lang="ja">言語ごとにタイポグラフィが調整されます</span>
              </p>
            </Card>
          </div>
        </section>

        {/* Typography Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Bilingual Typography
          </h2>

          <div className="card">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">English Text</h3>
                <p lang="en" className="text-foreground">
                  The quick brown fox jumps over the lazy dog. This text uses
                  English typography with letter-spacing: 0.01em and line-height: 1.6.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Japanese Text</h3>
                <p lang="ja" className="text-foreground">
                  茶道は、日本の伝統的な芸術の一つです。この文章は日本語のタイポグラフィを使用しています。
                  字間：0.05em、行間：1.8です。
                </p>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Mixed (Structural Bilingual)</h3>
                <p className="text-foreground">
                  <span lang="en">Tea ceremony</span>
                  {' '}
                  <span lang="ja">茶道</span>
                  {' '}
                  <span lang="en">is a traditional Japanese art form.</span>
                  {' '}
                  <span lang="ja">は日本の伝統的な芸術の一つです。</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 text-foreground">
            Buttons & Interactive Elements
          </h2>

          <div className="card">
            <div className="flex flex-wrap gap-3">
              <button className="btn btn-primary">
                Primary Button
              </button>
              <button className="btn btn-outline">
                Outline Button
              </button>
              <button className="btn bg-matcha text-white hover:bg-matcha/90">
                Matcha Accent
              </button>
              <button className="btn bg-shibui text-white hover:bg-shibui/90">
                Shibui Subtle
              </button>
            </div>
          </div>
        </section>

        {/* Philosophy Section */}
        <section className="mb-8">
          <div className="card bg-shibui text-white">
            <h2 className="text-2xl font-semibold mb-4">
              Design Philosophy
            </h2>
            <div className="space-y-3">
              <div>
                <strong>渋い (Shibui)</strong> - Subtle, unobtrusive elegance.
                Colors are muted, never garish.
              </div>
              <div>
                <strong>侘び (Wabi)</strong> - Beauty in imperfection and naturalness.
                Embrace browser rendering differences.
              </div>
              <div>
                <strong>幽玄 (Yugen)</strong> - Profound grace and mysterious depth.
                Deep, contemplative colors.
              </div>
              <div>
                <strong>間 (Ma)</strong> - Negative space, pause, breathing room.
                Space between elements is intentional.
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border pa-md text-center text-muted-foreground text-sm">
        <p>
          <span lang="en">Tea Ceremony Design System</span>
          {' · '}
          <span lang="ja">茶の湯デザインシステム</span>
        </p>
        <p className="mt-2">
          View <a href="/docs/TEA_CEREMONY_DESIGN_SYSTEM.md" className="link">documentation</a>
        </p>
      </footer>
    </div>
  )
}
