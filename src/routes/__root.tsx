import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  const err = error instanceof Error ? error : new Error(String(error));
  console.error(err);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(err, { boundary: "tanstack_root_error_component" });
  }, [err]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Scouting AF Setúbal — 1.ª Divisão" },
      {
        name: "description",
        content:
          "Relatórios de scouting pré-jogo para o Campeonato Distrital da AF Setúbal - 1.ª Divisão, com fontes identificadas e dados da época em curso.",
      },
      { property: "og:title", content: "Scouting AF Setúbal — 1.ª Divisão" },
      {
        property: "og:description",
        content: "Relatórios técnicos pré-jogo com dados verificáveis e fonte identificada.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700;800&family=Barlow:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-PT">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthNav() {
  const { user, isAdmin, displayName, roles } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!user) {
    return (
      <Link
        to="/auth"
        className="rounded px-3 py-1.5 transition-colors hover:bg-primary-foreground/10"
        activeProps={{ className: "rounded px-3 py-1.5 bg-primary-foreground/15 font-semibold" }}
      >
        Entrar
      </Link>
    );
  }

  return (
    <>
      {isAdmin && (
        <Link
          to="/administracao"
          className="rounded px-3 py-1.5 transition-colors hover:bg-primary-foreground/10"
          activeProps={{ className: "rounded px-3 py-1.5 bg-primary-foreground/15 font-semibold" }}
        >
          Administração
        </Link>
      )}
      <span className="ml-1 hidden text-xs opacity-80 sm:inline">
        {displayName ?? user.email}
        {roles.length ? ` · ${roles[0]}` : ""}
      </span>
      <button
        type="button"
        className="rounded px-3 py-1.5 transition-colors hover:bg-primary-foreground/10"
        onClick={async () => {
          await queryClient.cancelQueries();
          queryClient.clear();
          await supabase.auth.signOut();
          await router.invalidate();
          void router.navigate({ to: "/auth", replace: true });
        }}
      >
        Sair
      </button>
    </>
  );
}

function SiteHeader() {
  return (
    <header className="no-print border-b border-border bg-primary text-primary-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-accent text-sm font-bold text-accent-foreground">
            AF
          </span>
          <span className="font-display text-sm font-bold uppercase tracking-widest">
            Scouting AF Setúbal · 1.ª Divisão
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <Link
            to="/"
            className="rounded px-3 py-1.5 transition-colors hover:bg-primary-foreground/10"
            activeProps={{ className: "rounded px-3 py-1.5 bg-primary-foreground/15 font-semibold" }}
            activeOptions={{ exact: true }}
          >
            Jogos
          </Link>
          <AuthNav />
        </nav>
      </div>
    </header>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
      <div className="min-h-screen bg-background">
        <SiteHeader />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <footer className="no-print border-t border-border py-6 text-center text-xs text-muted-foreground">
          Dados apresentados com fonte e data de atualização. Quando um dado não existe, é indicado como “Dados não
          disponíveis”.
        </footer>
      </div>
      <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

