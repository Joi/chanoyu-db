import * as React from "react";

type AppShellProps = {
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  children: React.ReactNode;
};

export default function AppShell({ header, sidebar, children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 backdrop-blur">
        <div className="mx-auto max-w-container px-4 py-3">{header}</div>
      </header>
      <div className="mx-auto grid max-w-container grid-cols-12 gap-4 px-4 py-6">
        <aside className="col-span-3 hidden lg:block">{sidebar}</aside>
        <main className="col-span-12 lg:col-span-9">{children}</main>
      </div>
    </div>
  );
}


