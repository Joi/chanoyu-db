import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CollectionCard, CollectionCardSkeleton } from "@/src/components/collection-card";

export default function StyleGuide() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Style Guide</h1>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Cards</h2>
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
          </CardHeader>
          <CardContent>Card content goes here.</CardContent>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Collection Card</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CollectionCard
            href="/objects/demo"
            title="Demo Object Title With A Slightly Longer Name"
            subtitle="Optional muted metadata appears here"
            imageUrl={null}
          />
          <CollectionCardSkeleton />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Inputs</h2>
        <div className="max-w-sm">
          <Input placeholder="Type here..." />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Tabs</h2>
        <Tabs defaultValue="account">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Account settings</TabsContent>
          <TabsContent value="password">Password settings</TabsContent>
        </Tabs>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Skeletons</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CollectionCardSkeleton />
          <CollectionCardSkeleton />
          <CollectionCardSkeleton />
        </div>
      </section>
    </div>
  );
}


