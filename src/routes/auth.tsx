import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Kicker } from "@/components/scouting/atoms";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapFirstAdmin } from "@/lib/auth/users.functions";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar | Scouting AF Setúbal 1.ª Divisão" },
      {
        name: "description",
        content:
          "Acesso reservado a analistas e administradores do Scouting AF Setúbal - 1.ª Divisão. As contas são criadas pelo administrador.",
      },
      { property: "og:title", content: "Entrar — Scouting AF Setúbal" },
      { property: "og:description", content: "Área reservada a analistas e administradores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [needsBootstrap, setNeedsBootstrap] = useState<boolean | null>(null);

  useEffect(() => {
    void supabase.rpc("has_any_user").then(({ data, error }) => {
      setNeedsBootstrap(error ? false : data === false);
    });
  }, []);

  useEffect(() => {
    if (user) void navigate({ to: "/", replace: true });
  }, [user, navigate]);

  async function handleSignIn() {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      const banned = /banned|user_banned/i.test(`${error.code ?? ""} ${error.message}`);
      toast.error(
        banned
          ? "Esta conta está desativada. Contacte um administrador."
          : "Credenciais inválidas ou conta inexistente.",
      );
      return;
    }
    toast.success("Sessão iniciada.");
    await router.invalidate();
    void navigate({ to: "/", replace: true });
  }

  async function handleBootstrap() {
    setBusy(true);
    try {
      await bootstrapFirstAdmin({ data: { email, password, displayName } });
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
      toast.success("Conta de administrador criada. Sessão iniciada.");
      await router.invalidate();
      void navigate({ to: "/administracao", replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível criar a conta.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-12 md:py-16">
      <Kicker>Área reservada</Kicker>
      <h1 className="mt-2 font-display text-2xl font-bold tracking-tight">
        {needsBootstrap ? "Criar conta de administrador" : "Entrar"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {needsBootstrap
          ? "Ainda não existem contas. Crie a primeira conta de administrador, que passa a poder criar os restantes utilizadores."
          : "As contas são criadas pelo administrador. Se ainda não tem acesso, peça-lhe as credenciais."}
      </p>

      <div className="panel mt-6 space-y-3 p-5">
        {needsBootstrap && (
          <label className="block">
            <Kicker className="mb-1 block">Nome a mostrar</Kicker>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex.: Paulo Gonçalves"
              autoComplete="name"
            />
          </label>
        )}
        <label className="block">
          <Kicker className="mb-1 block">Email</Kicker>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="analista@clube.pt"
            autoComplete="email"
          />
        </label>
        <label className="block">
          <Kicker className="mb-1 block">Palavra-passe</Kicker>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoComplete={needsBootstrap ? "new-password" : "current-password"}
          />
        </label>
        <Button
          className="w-full"
          disabled={busy || !email || !password || (needsBootstrap === true && displayName.trim().length < 2)}
          onClick={() => (needsBootstrap ? void handleBootstrap() : void handleSignIn())}
        >
          {needsBootstrap ? (
            <>
              <ShieldCheck className="mr-1 h-4 w-4" /> Criar administrador e entrar
            </>
          ) : (
            <>
              <LogIn className="mr-1 h-4 w-4" /> Entrar
            </>
          )}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Perfis de acesso: <strong>Analista</strong> — edita onzes prováveis e notas. <strong>Administrador</strong> —
          além disso, gere fontes, importações, correções e contas.
        </p>
      </div>
    </main>
  );
}
