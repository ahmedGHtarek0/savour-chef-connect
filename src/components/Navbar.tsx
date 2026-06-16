import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Logo3D } from "./Logo3D";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Globe, Palette, LogOut } from "lucide-react";
import { LANGUAGES } from "@/lib/i18n";
import { THEMES, useTheme } from "./providers/ThemeProvider";
import { useAuth } from "./providers/AuthProvider";
import { supabase } from "@/integrations/supabase/client";

export function Navbar() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          <Logo3D size={36} />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {t("app.name")}
          </span>
        </Link>

        <div className="flex items-center gap-2">
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
              <Button asChild variant="ghost"><Link to="/dashboard">{t("nav.dashboard")}</Link></Button>
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
      </div>
    </header>
  );
}