// Sessão e permissões (analista / administrador) partilhadas pela aplicação.
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "administrador" | "analista";

interface AuthValue {
  loading: boolean;
  user: User | null;
  displayName: string | null;
  roles: AppRole[];
  isAdmin: boolean;
  isAnalyst: boolean;
  /** Pode editar onzes prováveis e notas do analista */
  canEdit: boolean;
  refresh: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setRoles([]);
        setDisplayName(null);
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void (async () => {
      const [{ data: roleRows }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("display_name, active").eq("id", user.id).maybeSingle(),
      ]);
      if (!active) return;
      if (profile && profile.active === false) {
        // Conta desativada por um administrador: termina a sessão de imediato.
        await supabase.auth.signOut();
        return;
      }
      setRoles((roleRows ?? []).map((r) => r.role as AppRole));
      setDisplayName(profile?.display_name ?? null);
    })();
    return () => {
      active = false;
    };
  }, [user, tick]);

  const value = useMemo<AuthValue>(() => {
    const isAdmin = roles.includes("administrador");
    const isAnalyst = roles.includes("analista");
    return {
      loading,
      user,
      displayName,
      roles,
      isAdmin,
      isAnalyst,
      canEdit: isAdmin || isAnalyst,
      refresh: () => setTick((t) => t + 1),
    };
  }, [loading, user, displayName, roles]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth tem de ser usado dentro de <AuthProvider>.");
  return ctx;
}
