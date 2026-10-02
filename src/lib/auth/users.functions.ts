// Funções de servidor para gestão de contas (apenas administradores).
// Módulo fino: sem lógica ao nível do módulo (ver regras de bundling).
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const roleSchema = z.enum(["administrador", "analista"]);

const newUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  displayName: z.string().min(2).max(80),
  role: roleSchema,
});

export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => newUserSchema.omit({ role: true }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { count, error: countError } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) throw new Error("Já existem contas criadas. Peça acesso a um administrador.");

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "Não foi possível criar a conta.");

    const userId = created.user.id;
    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .insert({ id: userId, display_name: data.displayName });
    if (pErr) throw new Error(pErr.message);
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: userId, role: "administrador" });
    if (rErr) throw new Error(rErr.message);

    return { ok: true as const };
  });

export const listAppUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "administrador",
    });
    if (!isAdmin) throw new Error("Sem permissão de administrador.");

    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("id, display_name, created_at, active, deactivated_at")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const { data: roles, error: rErr } = await context.supabase.from("user_roles").select("user_id, role");
    if (rErr) throw new Error(rErr.message);

    return (profiles ?? []).map((p) => ({
      id: p.id,
      displayName: p.display_name,
      createdAt: p.created_at,
      active: p.active,
      deactivatedAt: p.deactivated_at,
      roles: (roles ?? []).filter((r) => r.user_id === p.id).map((r) => r.role),
    }));
  });

export const createAppUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => newUserSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "administrador",
    });
    if (!isAdmin) throw new Error("Sem permissão de administrador.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });
    if (error || !created.user) throw new Error(error?.message ?? "Não foi possível criar a conta.");

    const userId = created.user.id;
    const { error: pErr } = await supabaseAdmin
      .from("profiles")
      .insert({ id: userId, display_name: data.displayName });
    if (pErr) throw new Error(pErr.message);
    const { error: rErr } = await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: data.role });
    if (rErr) throw new Error(rErr.message);

    return { ok: true as const, id: userId };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid(), role: roleSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "administrador",
    });
    if (!isAdmin) throw new Error("Sem permissão de administrador.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: data.userId, role: data.role });
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const setUserActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ userId: z.string().uuid(), active: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "administrador",
    });
    if (!isAdmin) throw new Error("Sem permissão de administrador.");
    if (data.userId === context.userId) throw new Error("Não pode desativar a sua própria conta.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.active) {
      // Garante que fica sempre pelo menos um administrador ativo.
      const { data: admins, error: aErr } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "administrador");
      if (aErr) throw new Error(aErr.message);
      const adminIds = (admins ?? []).map((a) => a.user_id);
      if (adminIds.includes(data.userId)) {
        const { count, error: cErr } = await supabaseAdmin
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .in("id", adminIds)
          .eq("active", true);
        if (cErr) throw new Error(cErr.message);
        if ((count ?? 0) <= 1) throw new Error("Tem de existir sempre um administrador ativo.");
      }
    }

    const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      ban_duration: data.active ? "none" : "876000h",
    });
    if (banError) throw new Error(banError.message);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        active: data.active,
        deactivated_at: data.active ? null : new Date().toISOString(),
        status_changed_by: context.userId,
      })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    return { ok: true as const, active: data.active };
  });

export const deleteAppUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ userId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "administrador",
    });
    if (!isAdmin) throw new Error("Sem permissão de administrador.");
    if (data.userId === context.userId) throw new Error("Não pode eliminar a sua própria conta.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
