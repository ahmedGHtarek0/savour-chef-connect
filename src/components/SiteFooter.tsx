import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { ChefHat, Instagram, Twitter, Github, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-border/40 bg-gradient-to-b from-background via-background to-card/30">
      <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_70%)]" />
      <div className="container relative mx-auto grid gap-12 px-4 py-16 md:grid-cols-5">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <ChefHat className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight">Savora</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">Connecting talented home chefs with food lovers through an AI-powered marketplace experience.</p>
          <form className="mt-6 flex max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}>
            <Input placeholder="you@email.com" className="bg-card/60 backdrop-blur" />
            <Button type="submit" className="bg-gradient-to-r from-primary to-accent text-primary-foreground">Subscribe</Button>
          </form>
          <div className="mt-6 flex gap-3 text-muted-foreground">
            <a href="#" aria-label="Instagram" className="rounded-full border border-border p-2 transition hover:text-primary hover:border-primary/50"><Instagram className="h-4 w-4" /></a>
            <a href="#" aria-label="Twitter" className="rounded-full border border-border p-2 transition hover:text-primary hover:border-primary/50"><Twitter className="h-4 w-4" /></a>
            <a href="#" aria-label="Github" className="rounded-full border border-border p-2 transition hover:text-primary hover:border-primary/50"><Github className="h-4 w-4" /></a>
            <a href="mailto:hello@savora.app" aria-label="Email" className="rounded-full border border-border p-2 transition hover:text-primary hover:border-primary/50"><Mail className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Product</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth" className="hover:text-foreground">Browse</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Become a chef</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Membership</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Company</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><a className="hover:text-foreground" href="#">About</a></li>
            <li><a className="hover:text-foreground" href="#">Careers</a></li>
            <li><a className="hover:text-foreground" href="#">Press</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Legal</h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><a className="hover:text-foreground" href="#">Terms</a></li>
            <li><a className="hover:text-foreground" href="#">Privacy</a></li>
            <li><a className="hover:text-foreground" href="#">Cookies</a></li>
          </ul>
        </div>
      </div>
      <div className="container relative mx-auto flex flex-col items-center justify-between gap-4 border-t border-border/40 px-4 py-6 text-xs text-muted-foreground md:flex-row">
        <p>© {new Date().getFullYear()} {t("app.name")} — Crafted with care.</p>
        <p className="opacity-70">San Francisco · Istanbul · Cairo</p>
      </div>
    </footer>
  );
}