import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Database, FileUp, History, ShieldAlert, Trash2, UserCheck, UserPlus, UserX } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DemoTag, Kicker, SectionTitle } from "@/components/scouting/atoms";
import { connectors, getDataset } from "@/lib/scouting/sources";
import { useScoutingStore } from "@/lib/scouting/store";
import { cn } from "@/lib/utils";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { createAppUser, deleteAppUser, listAppUsers, setUserActive, setUserRole } from "@/lib/auth/users.functions";

export const Route = createFileRoute("/_authenticated/administracao")({
  head: () => ({
    meta: [
      { title: "Administração de dados | Scouting AF Setúbal 1.ª Divisão" },
      {
        name: "description",
        content:
          "Gestão das fontes de dados, importação manual/CSV, correções do analista, contas e registo de alterações do Scouting AF Setúbal.",
      },
      { property: "og:title", content: "Administração de dados — Scouting AF Setúbal" },
      {
        property: "og:description",
        content: "Fontes configuráveis, importação CSV, gestão de contas e registo de todas as correções manuais.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const STATUS_TEXT = {
  ativo: "Ativo",
  "por-ligar": "Por ligar (requer autorização/API)",
  manual: "Disponível manualmente",
} as const;

function AdminPage() {
  const ds = getDataset();
  const store = useScoutingStore();
  const { isAdmin, loading, displayName } = useAuth();
  const [csv, setCsv] = useState("");
  const [entity, setEntity] = useState("");
  const [field, setField] = useState("");
  const [before, setBefore] = useState("");
  const [after, setAfter] = useState("");

  if (loading) {
    return <main className="mx-auto max-w-6xl px-4 py-10 text-sm text-muted-foreground">A verificar permissões…</main>;
  }

  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <div className="panel space-y-3 p-6 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-destructive" />
          <h1 className="font-display text-xl font-bold">Acesso restrito a administradores</h1>
          <p className="text-sm text-muted-foreground">
            A sua conta tem perfil de analista. Pode consultar relatórios e editar onzes prováveis, mas a gestão de
            fontes, importações e contas está reservada a administradores.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Voltar aos jogos</Link>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
      <header className="mb-8">
        <Kicker>Área de administração</Kicker>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight">Fontes, importação, correções e contas</h1>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Sessão de administrador{displayName ? ` (${displayName})` : ""}. A aplicação nunca preenche lacunas com
          informação fictícia. Enquanto não existir uma fonte automática autorizada, os dados reais entram por
          importação manual/CSV ou correção do analista, sempre com registo.
        </p>
      </header>

      <UsersSection />

      <section className="mb-10">
        <SectionTitle title="Fontes de dados" subtitle="Camada configurável de conectores." />
        <div className="grid gap-3 md:grid-cols-2">
          {connectors.map((c) => (
            <div key={c.id} className="panel p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{c.label}</h2>
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noreferrer noopener" className="text-xs text-accent underline">
                      {c.url}
                    </a>
                  )}
                </div>
                <span className="rounded bg-surface px-2 py-0.5 text-[11px] font-semibold text-surface-foreground">
                  {STATUS_TEXT[c.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
              <p className="mt-2 text-xs">Fornece: {c.provides.join(" · ")}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Última sincronização: {c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString("pt-PT") : "Dados não disponíveis"}
              </p>
            </div>
          ))}
        </div>
        <div className="panel mt-3 flex flex-wrap items-center gap-2 p-4">
          <Database className="h-4 w-4 text-accent" />
          <span className="text-sm">Conjunto de dados ativo: {ds.source.label}</span>
          {ds.isDemo && <DemoTag />}
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle title="Importação manual / CSV" subtitle="Cole os dados reais para carregar sobre uma fonte identificada." />
        <div className="panel space-y-3 p-4">
          <p className="text-xs text-muted-foreground">
            Formato esperado (uma linha por registo):
            <code className="ml-1 rounded bg-muted px-1">jornada;data;equipa_casa;equipa_fora;golos_casa;golos_fora;campo;fonte</code>
          </p>
          <Textarea
            rows={6}
            placeholder="1;2026-09-06 17:00;Equipa A;Equipa B;2;1;Campo Municipal;AF Setúbal"
            value={csv}
            onChange={(e) => setCsv(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => {
                const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
                if (!lines.length) {
                  toast.error("Cole primeiro as linhas a importar.");
                  return;
                }
                const invalid = lines.filter((l) => l.split(";").length < 6);
                if (invalid.length) {
                  toast.error(`${invalid.length} linha(s) com colunas insuficientes. Nada foi importado.`);
                  return;
                }
                store.logChange({
                  entity: "Importação CSV",
                  field: "jogos",
                  before: "—",
                  after: `${lines.length} linha(s) validada(s)`,
                  author: displayName ?? "Administrador",
                });
                toast.success(
                  `${lines.length} linha(s) validada(s) e registada(s). A gravação em base de dados fica ativa ao ligar o backend.`,
                );
              }}
            >
              <FileUp className="mr-1 h-4 w-4" /> Validar e registar importação
            </Button>
            <span className="text-xs text-muted-foreground">
              A validação não altera dados de demonstração — evita misturar exemplo com dados reais.
            </span>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle title="Correção manual de dados" subtitle="Toda a alteração fica registada com data, campo e valores." />
        <div className="panel grid gap-3 p-4 sm:grid-cols-2">
          <label className="block">
            <Kicker className="mb-1 block">Registo / entidade</Kicker>
            <Input value={entity} onChange={(e) => setEntity(e.target.value)} placeholder="Ex.: Jogador — Tiago Silva" />
          </label>
          <label className="block">
            <Kicker className="mb-1 block">Campo</Kicker>
            <Input value={field} onChange={(e) => setField(e.target.value)} placeholder="Ex.: minutos" />
          </label>
          <label className="block">
            <Kicker className="mb-1 block">Valor anterior</Kicker>
            <Input value={before} onChange={(e) => setBefore(e.target.value)} placeholder="Ex.: 540" />
          </label>
          <label className="block">
            <Kicker className="mb-1 block">Novo valor</Kicker>
            <Input value={after} onChange={(e) => setAfter(e.target.value)} placeholder="Ex.: 630" />
          </label>
          <div className="sm:col-span-2">
            <Button
              onClick={() => {
                if (!entity || !field || !after) {
                  toast.error("Preencha entidade, campo e novo valor.");
                  return;
                }
                store.logChange({
                  entity,
                  field,
                  before: before || "—",
                  after,
                  author: displayName ?? "Administrador",
                });
                setEntity(""); setField(""); setBefore(""); setAfter("");
                toast.success("Alteração registada.");
              }}
            >
              Registar alteração
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-10">
        <SectionTitle title="Registo de alterações" subtitle="Histórico das correções e importações." />
        <div className="panel divide-y divide-border">
          {store.audit.length ? (
            store.audit.map((a) => (
              <div key={a.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
                <History className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs tabular-nums text-muted-foreground">{new Date(a.at).toLocaleString("pt-PT")}</span>
                <span className="font-medium">{a.entity}</span>
                <span className="text-muted-foreground">{a.field}:</span>
                <span className="text-muted-foreground line-through">{a.before}</span>
                <span className="font-semibold">{a.after}</span>
                <span className="ml-auto text-xs text-muted-foreground">{a.author}</span>
              </div>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-muted-foreground">Sem alterações registadas.</p>
          )}
        </div>
      </section>

      <section>
        <SectionTitle title="Relatórios guardados" subtitle="Histórico de versões por jogo." />
        <div className="panel divide-y divide-border">
          {store.reports.length ? (
            store.reports.map((r) => (
              <div key={r.id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-2.5 text-sm">
                <span className="font-medium">{r.title}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  v{r.version} · {new Date(r.createdAt).toLocaleString("pt-PT")}
                </span>
                <Link to="/relatorio/$matchId" params={{ matchId: r.matchId }} className="text-xs text-accent underline">
                  Abrir relatório
                </Link>
              </div>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-muted-foreground">Ainda sem relatórios guardados.</p>
          )}
        </div>
      </section>
    </main>
  );
}

function UsersSection() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const fetchUsers = useServerFn(listAppUsers);
  const create = useServerFn(createAppUser);
  const changeRole = useServerFn(setUserRole);
  const changeActive = useServerFn(setUserActive);
  const removeUser = useServerFn(deleteAppUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<AppRole>("analista");
  const [touched, setTouched] = useState(false);

  const users = useQuery({ queryKey: ["app-users"], queryFn: () => fetchUsers() });

  const errors = {
    name: name.trim().length < 2 ? "Indique o nome a mostrar (mínimo 2 caracteres)." : null,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()) ? null : "Indique um email válido.",
    password: password.length < 8 ? "A palavra-passe precisa de pelo menos 8 caracteres." : null,
  };
  const isValid = !errors.name && !errors.email && !errors.password;

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ["app-users"] });

  const createMutation = useMutation({
    mutationFn: () => create({ data: { email: email.trim(), password, displayName: name.trim(), role } }),
    onSuccess: () => {
      toast.success(`Conta criada como ${role}. Já pode entrar com a palavra-passe inicial.`);
      setEmail(""); setPassword(""); setName(""); setRole("analista"); setTouched(false);
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Não foi possível criar a conta."),
  });

  const roleMutation = useMutation({
    mutationFn: (vars: { userId: string; role: AppRole }) => changeRole({ data: vars }),
    onSuccess: (_d, vars) => {
      toast.success(`Perfil alterado para ${vars.role}.`);
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Não foi possível alterar as permissões."),
  });

  const activeMutation = useMutation({
    mutationFn: (vars: { userId: string; active: boolean }) => changeActive({ data: vars }),
    onSuccess: (_d, vars) => {
      toast.success(vars.active ? "Conta ativada." : "Conta desativada — o acesso foi bloqueado.");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Não foi possível alterar o estado da conta."),
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => removeUser({ data: { userId } }),
    onSuccess: () => {
      toast.success("Conta eliminada.");
      invalidate();
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Não foi possível eliminar a conta."),
  });

  const pending = activeMutation.isPending || roleMutation.isPending || deleteMutation.isPending;

  return (
    <section className="mb-10">
      <SectionTitle
        title="Contas e permissões"
        subtitle="O registo é fechado: apenas administradores criam, ativam/desativam e atribuem perfis."
      />
      <div className="panel mb-3 grid gap-3 p-4 sm:grid-cols-2">
        <label className="block">
          <Kicker className="mb-1 block">Nome a mostrar</Kicker>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            aria-invalid={touched && !!errors.name}
            placeholder="Ex.: Rui Marques"
          />
          {touched && errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
        </label>
        <label className="block">
          <Kicker className="mb-1 block">Email</Kicker>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={touched && !!errors.email}
            placeholder="analista@clube.pt"
          />
          {touched && errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </label>
        <label className="block">
          <Kicker className="mb-1 block">Palavra-passe inicial</Kicker>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={touched && !!errors.password}
            placeholder="Mínimo 8 caracteres"
          />
          {touched && errors.password && <p className="mt-1 text-xs text-destructive">{errors.password}</p>}
        </label>
        <label className="block">
          <Kicker className="mb-1 block">Perfil</Kicker>
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as AppRole)}
          >
            <option value="analista">Analista — edita onzes prováveis e notas</option>
            <option value="administrador">Administrador — acesso total e gestão de contas</option>
          </select>
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-2">
          <Button
            disabled={createMutation.isPending}
            onClick={() => {
              setTouched(true);
              if (!isValid) {
                toast.error("Corrija os campos assinalados antes de criar a conta.");
                return;
              }
              createMutation.mutate();
            }}
          >
            <UserPlus className="mr-1 h-4 w-4" />
            {createMutation.isPending ? "A criar conta…" : "Criar conta"}
          </Button>
          <span className="text-xs text-muted-foreground">
            O utilizador entra imediatamente com este email e palavra-passe.
          </span>
        </div>
      </div>

      <div className="panel divide-y divide-border">
        {users.isLoading && <p className="px-4 py-3 text-sm text-muted-foreground">A carregar contas…</p>}
        {users.isError && (
          <p className="px-4 py-3 text-sm text-destructive">Não foi possível carregar as contas.</p>
        )}
        {users.data?.length === 0 && (
          <p className="px-4 py-3 text-sm text-muted-foreground">Ainda não existem contas.</p>
        )}
        {users.data?.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 text-sm">
            <span className="font-medium">{u.displayName}</span>
            {u.id === user?.id && <span className="text-[11px] text-muted-foreground">(a sua conta)</span>}
            <span className="text-xs text-muted-foreground">
              {u.roles.length ? u.roles.join(" · ") : "sem perfil atribuído"}
            </span>
            <span
              className={cn(
                "rounded px-2 py-0.5 text-[11px] font-semibold",
                u.active ? "bg-surface text-surface-foreground" : "bg-destructive/10 text-destructive",
              )}
            >
              {u.active ? "Ativa" : "Inativa"}
            </span>
            <span className="text-xs tabular-nums text-muted-foreground">
              {u.active
                ? `desde ${new Date(u.createdAt).toLocaleDateString("pt-PT")}`
                : `desativada em ${u.deactivatedAt ? new Date(u.deactivatedAt).toLocaleDateString("pt-PT") : "—"}`}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <select
                className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                value={(u.roles[0] as AppRole) ?? "analista"}
                disabled={pending}
                onChange={(e) => roleMutation.mutate({ userId: u.id, role: e.target.value as AppRole })}
                aria-label={`Perfil de ${u.displayName}`}
              >
                <option value="analista">Analista</option>
                <option value="administrador">Administrador</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={u.id === user?.id || pending}
                onClick={() => activeMutation.mutate({ userId: u.id, active: !u.active })}
              >
                {u.active ? (
                  <>
                    <UserX className="mr-1 h-3.5 w-3.5" /> Desativar
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-1 h-3.5 w-3.5" /> Ativar
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={u.id === user?.id || pending}
                onClick={() => {
                  if (!window.confirm(`Eliminar definitivamente a conta de ${u.displayName}?`)) return;
                  deleteMutation.mutate(u.id);
                }}
                aria-label={`Eliminar conta de ${u.displayName}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Uma conta inativa mantém o histórico e os relatórios, mas não consegue iniciar sessão. Tem de existir sempre
        um administrador ativo.
      </p>
    </section>
  );
}

