import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <div className="flex items-center justify-between py-2">
      <a href="/" className="text-xl font-semibold tracking-tight hover:opacity-90">
        Ito Chanoyu
      </a>
      <NavigationMenu>
        <NavigationMenuList className="hidden gap-2 sm:flex">
          <NavigationMenuItem>
            <a className="px-3 py-2 hover:underline min-h-[44px] inline-flex items-center" href="/objects">
              Objects
            </a>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <a className="px-3 py-2 hover:underline min-h-[44px] inline-flex items-center" href="/chakai">
              Chakai
            </a>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <a className="px-3 py-2 hover:underline min-h-[44px] inline-flex items-center" href="/lookup">
              Lookup
            </a>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <Button variant="default" className="hidden min-h-[44px] sm:inline-flex">
        Sign in
      </Button>
    </div>
  );
}


