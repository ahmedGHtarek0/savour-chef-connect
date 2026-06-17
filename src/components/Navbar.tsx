import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Logo3D } from "./Logo3D";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Globe, Palette, LogOut, ShoppingBag, Menu, User } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n";
import { THEMES, useTheme } from "./providers/ThemeProvider";
import { useAuth } from "./providers/AuthProvider";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { NotificationsBell } from "./NotificationsBell";
import { useQuery } from "@tanstack/react-query";

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const { data: roles = [] } = useQuery({
    queryKey: ["my_roles", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user!.id);
      return (data ?? []).map((r: any) => r.role as string);
    },
  });
  // Cart only makes sense for customers — hide for chef/delivery/admin-only accounts.
  const showCart = !user || roles.length === 0 || roles.includes("customer");

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          <Logo3D size={36} />
          <span className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("app.name")}
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Language"><Globe className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {LANGUAGES.map(l => (
                <DropdownMenuItem key={l.code} onClick={() => i18n.changeLanguage(l.code)}>
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Theme"><Palette className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {THEMES.map(th => (
                <DropdownMenuItem key={th} onClick={() => setTheme(th)} className={theme === th ? "font-semibold" : ""}>
                  {th.charAt(0).toUpperCase() + th.slice(1)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              <NotificationsBell />
              {showCart && (
                <Button asChild variant="ghost" size="sm" className="relative">
                  <Link to="/cart"><ShoppingBag className="h-4 w-4" />{count > 0 && <span className="ml-1 text-xs">{count}</span>}</Link>
                </Button>
              )}
              <Button asChild variant="ghost"><Link to="/dashboard">{t("nav.dashboard")}</Link></Button>
              <Button asChild variant="ghost" size="icon" aria-label="Profile"><Link to="/profile"><User className="h-4 w-4" /></Link></Button>
              <Button variant="outline" size="icon" onClick={signOut} aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost"><Link to="/auth">{t("nav.login")}</Link></Button>
              <Button asChild className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-[var(--shadow-elegant)]">
                <Link to="/auth">{t("nav.signup")}</Link>
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 md:hidden">
          {user && (
            <>
              <NotificationsBell />
              {showCart && (
                <Button asChild variant="ghost" size="icon" aria-label="Cart" className="relative">
                  <Link to="/cart">
                    <ShoppingBag className="h-4 w-4" />
                    {count > 0 && (
                      <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                        {count}
                      </span>
                    )}
                  </Link>
                </Button>
              )}
            </>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Menu"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader><SheetTitle>{t("app.name")}</SheetTitle></SheetHeader>
              <div className="mt-6 flex flex-col gap-2">
                {user ? (
                  <>
                    <Button asChild variant="ghost" className="justify-start"><Link to="/dashboard">{t("nav.dashboard")}</Link></Button>
                    <Button asChild variant="ghost" className="justify-start"><Link to="/profile">My profile</Link></Button>
                    <Button asChild variant="ghost" className="justify-start"><Link to="/browse">Browse</Link></Button>
                    <Button asChild variant="ghost" className="justify-start"><Link to="/orders">Orders</Link></Button>
                    <Button asChild variant="ghost" className="justify-start"><Link to="/cart">Cart</Link></Button>
                    <Button asChild variant="ghost" className="justify-start"><Link to="/memberships">Memberships</Link></Button>
                    <Button asChild variant="ghost" className="justify-start"><Link to="/groups">Group orders</Link></Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" className="justify-start"><Link to="/auth">{t("nav.login")}</Link></Button>
                    <Button asChild className="justify-start bg-gradient-to-r from-primary to-accent text-primary-foreground"><Link to="/auth">{t("nav.signup")}</Link></Button>
                  </>
                )}
                <div className="mt-4 border-t border-border pt-4">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Language</p>
                  <div className="flex flex-wrap gap-1">
                    {LANGUAGES.map(l => (
                      <Button key={l.code} variant={i18n.language.startsWith(l.code) ? "secondary" : "ghost"} size="sm" onClick={() => i18n.changeLanguage(l.code)}>
                        {l.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">Theme</p>
                  <div className="flex flex-wrap gap-1">
                    {THEMES.map(th => (
                      <Button key={th} variant={theme === th ? "secondary" : "ghost"} size="sm" onClick={() => setTheme(th)}>
                        {th.charAt(0).toUpperCase() + th.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>
                {user && (
                  <Button variant="outline" className="mt-4 justify-start" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}