"use client";
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <div className="flex items-center justify-between py-2">
      <Link href="/" className="text-xl font-semibold tracking-tight hover:opacity-90">
        Ito Chanoyu
      </Link>
      <NavigationMenu>
        <NavigationMenuList className="hidden gap-2 sm:flex">
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href="/members"
                className="inline-flex min-h-[44px] items-center px-3 py-2 hover:underline"
                aria-current={pathname?.startsWith("/members") ? "page" : undefined}
              >
                Members
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href="/objects"
                className="inline-flex min-h-[44px] items-center px-3 py-2 hover:underline"
                aria-current={pathname?.startsWith("/objects") ? "page" : undefined}
              >
                Objects
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href="/chakai"
                className="inline-flex min-h-[44px] items-center px-3 py-2 hover:underline"
                aria-current={pathname?.startsWith("/chakai") ? "page" : undefined}
              >
                Chakai
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href="/media"
                className="inline-flex min-h-[44px] items-center px-3 py-2 hover:underline"
                aria-current={pathname?.startsWith("/media") ? "page" : undefined}
              >
                Media
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink asChild>
              <Link
                href="/lookup"
                className="inline-flex min-h-[44px] items-center px-3 py-2 hover:underline"
                aria-current={pathname === "/lookup" ? "page" : undefined}
              >
                Lookup
              </Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Button variant="default" className="hidden min-h-[44px] sm:inline-flex">
        Sign in
      </Button>
    </div>
  );
}


