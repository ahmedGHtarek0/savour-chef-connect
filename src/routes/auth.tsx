import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/AuthProvider";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or join — Savora" },
      { name: "description", content: "Sign in to Savora or create an account as a customer, home chef, or delivery partner." },
    ],
  }),
  component: AuthPage,
});

type Role = "customer" | "chef" | "delivery";

function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("customer");

  useEffect(() => { if (user) navigate({ to: "/dashboard" }); }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, username, role, phone },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — check your email to confirm.");
    setMode("signin");
  };

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) toast.error(error.message);
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Navbar />
      <div className="container mx-auto flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-border bg-card/80 p-8 shadow-[var(--shadow-elegant)] backdrop-blur"
        >
          <h1 className="text-2xl font-bold">{t("common.welcome")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("app.tagline")}</p>

          <Tabs value={mode} onValueChange={v => setMode(v as "signin" | "signup")} className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">{t("auth.signin")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signup")}</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="mt-4 space-y-3">
                <div><Label htmlFor="email">{t("auth.email")}</Label><Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label htmlFor="password">{t("auth.password")}</Label><Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground">{t("auth.signin")}</Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="fn">{t("auth.fullName")}</Label><Input id="fn" required value={fullName} onChange={e => setFullName(e.target.value)} /></div>
                  <div><Label htmlFor="un">{t("auth.username")}</Label><Input id="un" required value={username} onChange={e => setUsername(e.target.value)} /></div>
                </div>
                <div><Label htmlFor="em2">{t("auth.email")}</Label><Input id="em2" type="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label htmlFor="ph">{t("auth.phone")}</Label><Input id="ph" type="tel" placeholder="+20..." value={phone} onChange={e => setPhone(e.target.value)} /></div>
                <div><Label htmlFor="pw2">{t("auth.password")}</Label><Input id="pw2" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
                <div>
                  <Label>{t("auth.role")}</Label>
                  <RadioGroup value={role} onValueChange={v => setRole(v as Role)} className="mt-2 grid grid-cols-3 gap-2">
                    {(["customer", "chef", "delivery"] as Role[]).map(r => (
                      <Label key={r} htmlFor={`r-${r}`} className={`flex cursor-pointer items-center justify-center rounded-lg border border-border p-3 text-sm capitalize transition ${role === r ? "border-primary bg-primary/10 font-semibold" : ""}`}>
                        <RadioGroupItem id={`r-${r}`} value={r} className="sr-only" />
                        {t(`auth.${r}`)}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground">{t("auth.signup")}</Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> {t("auth.or")} <div className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogle}>{t("auth.withGoogle")}</Button>
        </motion.div>
      </div>
    </div>
  );
}