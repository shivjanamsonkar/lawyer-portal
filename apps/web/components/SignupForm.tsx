"use client";

import { FormEvent, useState } from "react";
import { signUp } from "@/lib/api";

export function SignupForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    setError(null);
    setMessage(null);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm_password"))) {
      setError("Passwords do not match.");
      setSaving(false);
      return;
    }
    try {
      const result = await signUp({
        full_name: String(form.get("full_name")).trim(),
        phone: String(form.get("phone")).trim(),
        email: String(form.get("email")).trim(),
        chamber_address: String(form.get("chamber_address")).trim(),
        password,
      });
      setMessage(result.message);
      formElement.reset();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not create account.");
    } finally {
      setSaving(false);
    }
  }

  return <form className="editor-form auth-form" onSubmit={submit}>
    <label>Full name<input name="full_name" required maxLength={255} autoComplete="name" /></label>
    <label>Mobile number<input name="phone" type="tel" required minLength={7} maxLength={20} autoComplete="tel" /></label>
    <label>Email address<input name="email" type="email" required maxLength={255} autoComplete="email" /></label>
    <label>Chamber / office address<textarea name="chamber_address" required maxLength={2000} rows={2} autoComplete="street-address" /></label>
    <label>Password<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
    <label>Confirm password<input name="confirm_password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label>
    {error && <p className="form-error" role="alert">{error}</p>}
    {message && <p className="auth-success" role="status">{message}</p>}
    <button className="primary-button auth-submit" disabled={saving}>{saving ? "Submitting..." : "Submit for approval"}</button>
  </form>;
}
