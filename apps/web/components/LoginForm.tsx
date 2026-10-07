"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { logIn } from "@/lib/api";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const session = await logIn({ phone: String(form.get("phone")).trim(), password: String(form.get("password")) });
      router.push(session.must_change_password ? "/change-password" : session.user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in.");
    } finally {
      setSaving(false);
    }
  }

  return <form className="editor-form auth-form" onSubmit={submit}>
    <label>Mobile number<input name="phone" type="tel" required autoComplete="tel" /></label>
    <label>Password<input name="password" type="password" required autoComplete="current-password" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="primary-button auth-submit" disabled={saving}>{saving ? "Signing in..." : "Sign in"}</button>
  </form>;
}
