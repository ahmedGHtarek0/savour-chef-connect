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
import { useServerFn } from "@tanstack/react-start";
import { generateUsername } from "@/lib/ai-username.functions";
import { Sparkles } from "lucide-react";
import { Loader2 } from "lucide-react";

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

const demoAccounts = [
  { label: "Admin", email: "admin@savora.com" },
  { label: "Chef Amira", email: "chef.amira@savora.com" },
  { label: "Customer", email: "customer5@savora.com" },
  { label: "Delivery", email: "driver.mido@savora.com" },
] as const;

function normalizeDemoEmail(value: string) {
  const normalized = value.trim().toLowerCase().replace(/[–—]/g, "-").replace(/\s+/g, "");
  if (normalized === "driver.mido/rami/fady@savora.com") return "driver.mido@savora.com";
  if (normalized === "customer5-8@savora.com") return "customer5@savora.com";
  return normalized;
}

// Resolve "phone OR email OR username" → email for supabase password sign-in.
async function resolveLoginEmail(identifier: string): Promise<string | null> {
  const value = normalizeDemoEmail(identifier);
  if (value.includes("@")) return value;
  // Try phone, then username
  const { data: byPhone } = await supabase.from("profiles").select("email").eq("phone", value).maybeSingle();
  if (byPhone?.email) return byPhone.email;
  const { data: byUser } = await supabase.from("profiles").select("email").ilike("username", value).maybeSingle();
  if (byUser?.email) return byUser.email;
  return null;
}

function AuthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const aiUsername = useServerFn(generateUsername);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [genBusy, setGenBusy] = useState(false);
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
    const signInEmail = await resolveLoginEmail(email);
    if (!signInEmail) { setLoading(false); return toast.error("No account found for that phone / email / username"); }
    const { error } = await supabase.auth.signInWithPassword({ email: signInEmail, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!username) { setLoading(false); return toast.error("Username is required"); }
    // Pre-check username uniqueness
    const { data: existingUser } = await supabase
      .from("profiles").select("id").ilike("username", username).maybeSingle();
    if (existingUser) { setLoading(false); return toast.error("Username already taken — pick another"); }
    // Pre-check phone uniqueness when provided
    if (phone) {
      const { data: existingPhone } = await supabase
        .from("profiles").select("id").eq("phone", phone).maybeSingle();
      if (existingPhone) { setLoading(false); return toast.error("Phone already registered"); }
    }
    // Derive an email when user leaves it blank — Supabase auth requires one
    const effectiveEmail = email.trim() || `${username.toLowerCase()}@savora.user`;
    const { error } = await supabase.auth.signUp({
      email: effectiveEmail, password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName, username, role, phone },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created — signing you in…");
    // Auto sign in (email confirmation is disabled)
    const { error: signErr } = await supabase.auth.signInWithPassword({ email: effectiveEmail, password });
    if (signErr) { setMode("signin"); return toast.error(signErr.message); }
    navigate({ to: "/dashboard" });
  };

  const handleGenUsername = async () => {
    setGenBusy(true);
    try {
      const { username: u } = await aiUsername({ data: { hint: fullName } });
      setUsername(u);
      toast.success("Username generated");
    } catch (e: any) { toast.error(e.message); }
    finally { setGenBusy(false); }
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
                <div><Label htmlFor="email">Phone or email</Label><Input id="email" type="text" inputMode="text" autoComplete="username" placeholder="+20… or you@example.com" required value={email} onChange={e => setEmail(e.target.value)} /></div>
                <div><Label htmlFor="password">{t("auth.password")}</Label><Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} /></div>
                <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in…</> : t("auth.signin")}
                </Button>
              </form>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {demoAccounts.map(account => (
                  <Button
                    key={account.email}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setEmail(account.email); setPassword("1234"); }}
                  >
                    {account.label}
                  </Button>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label htmlFor="fn">{t("auth.fullName")}</Label><Input id="fn" required value={fullName} onChange={e => setFullName(e.target.value)} /></div>
                  <div>
                    <Label htmlFor="un">{t("auth.username")}</Label>
                    <div className="flex gap-1">
                      <Input id="un" required value={username} onChange={e => setUsername(e.target.value)} />
                      <Button type="button" variant="outline" size="icon" onClick={handleGenUsername} disabled={genBusy} title="Generate with AI">
                        <Sparkles className={`h-4 w-4 ${genBusy ? "animate-pulse" : ""}`} />
                      </Button>
                    </div>
                  </div>
                </div>
                <div><Label htmlFor="em2">{t("auth.email")} <span className="text-xs text-muted-foreground">(optional)</span></Label><Input id="em2" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></div>
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