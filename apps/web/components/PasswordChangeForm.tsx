"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function PasswordChangeForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("new_password"));
    if (newPassword !== String(form.get("confirm_password"))) {
      setError("Passwords do not match.");
      setSaving(false);
      return;
    }
    try {
      const response = await fetch(`${window.location.origin}/api/backend/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: String(form.get("current_password")), new_password: newPassword }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.detail ?? "Could not change password.");
      }
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not change password.");
    } finally {
      setSaving(false);
    }
  }

  return <form className="editor-form auth-form" onSubmit={submit}>
    <label>Temporary password<input name="current_password" type="password" required autoComplete="current-password" /></label>
    <label>New password<input name="new_password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
    <label>Confirm new password<input name="confirm_password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="primary-button auth-submit" disabled={saving}>{saving ? "Updating..." : "Change password"}</button>
  </form>;
}
