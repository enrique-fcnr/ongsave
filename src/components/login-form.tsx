"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { z } from "zod";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { authClient } from "@/lib/auth-client";
export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="form-grid"
      onSubmit={async (e) => {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
          const values = Object.fromEntries(new FormData(e.currentTarget));
          const { email, password } = z
            .object({ email: z.email(), password: z.string().min(6) })
            .parse(values);
          const { error } = await authClient.signIn.email({ email, password });
          if (error)
            throw new Error("E-mail ou senha incorretos. Confira sua conta e tente novamente.");
          router.replace("/home");
          router.refresh();
        } catch (e) {
          setError(
            e instanceof z.ZodError
              ? "Informe um e-mail válido e senha com ao menos 6 caracteres."
              : e instanceof Error
                ? e.message
                : "Falha ao entrar.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <label className="field">
        E-mail
        <Input
          name="email"
          type="email"
          autoComplete="username"
          placeholder="voce@organizacao.com"
          required
        />
      </label>
      <label className="field">
        Senha
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="Sua senha"
          minLength={6}
          required
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={busy || !configured}>
        {busy ? (
          <LoaderCircle className="spin" size={18} />
        ) : (
          <>
            Entrar no ONGSave
            <ArrowRight size={17} />
          </>
        )}
      </Button>
    </form>
  );
}
