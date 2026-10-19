"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { logIn } from "@/lib/api";
import { AlertCircle, Eye, EyeOff, Lock, Shield, UserRound } from "lucide-react";

function nationalMobileNumber(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  return digits.slice(0, 10);
}

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ phone: "", password: "" });

  function updateField(name: "phone" | "password", value: string): void {
    setFormData((current) => ({ ...current, [name]: name === "phone" ? nationalMobileNumber(value) : value }));
    if (error) setError(null);
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const submitted = new FormData(event.currentTarget);
      const phone = nationalMobileNumber(String(submitted.get("phone") ?? formData.phone));
      if (phone.length !== 10) {
        setError("Enter a valid 10-digit mobile number.");
        setSaving(false);
        return;
      }
      const session = await logIn({ phone: `+91${phone}`, password: String(submitted.get("password") ?? formData.password) });
      router.push(session.must_change_password ? "/change-password" : session.user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in.");
    } finally {
      setSaving(false);
    }
  }

  return <form className="signin-form" onSubmit={submit}>
    <div className="signin-field">
      <label htmlFor="phone" className="signin-label"><UserRound size={16} aria-hidden="true" />Mobile number</label>
      <div className="signin-control phone-control">
        <input id="phone" name="phone" type="tel" autoComplete="tel" required maxLength={16} placeholder="+91 98765 43210" value={formData.phone} onChange={(event) => updateField("phone", event.target.value)} aria-describedby="phone-hint" />
      </div>
      <p id="phone-hint" className="signin-hint">India +91 · Use the mobile number registered with your chambers.</p>
    </div>

    <div className="signin-field">
      <label htmlFor="password" className="signin-label"><Lock size={16} aria-hidden="true" />Password</label>
      <div className="signin-control password-control">
        <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required placeholder="Enter your password" value={formData.password} onChange={(event) => updateField("password", event.target.value)} />
        <button type="button" className="signin-password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
      </div>
      <p className="signin-hint">Forgot your password? Contact your chamber administrator.</p>
    </div>

    {error && <div className="form-error-container" role="alert"><AlertCircle className="error-icon" /><p className="form-error">{error}</p></div>}

    <button className="signin-submit" type="submit" disabled={saving}>
      {saving ? <><span className="spinner" aria-hidden="true" />Signing in…</> : <><Shield size={17} aria-hidden="true" />Sign in to chambers</>}
    </button>
  </form>;
}
