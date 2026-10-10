"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { logIn } from "@/lib/api";
import { Gavel, Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight, Shield, User } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError(null);
  };

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const session = await logIn({ phone: formData.phone.trim(), password: formData.password });
      router.push(session.must_change_password ? "/change-password" : session.user.role === "SUPER_ADMIN" ? "/admin/dashboard" : "/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not sign in.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="login-card">
      <div className="login-header">
        <div className="login-logo">
          <div className="logo-icon">
            <Gavel className="w-8 h-8 text-indigo-600" />
          </div>
          <span className="logo-text">AdvocatePro</span>
        </div>
        <p className="login-tagline">Secure Chambers Access</p>
      </div>

      <div className="login-divider">
        <span className="divider-text">SIGN IN</span>
      </div>

      <form className="login-form" onSubmit={submit} noValidate>
        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            <User className="label-icon" />
            Mobile Number
          </label>
          <div className="input-wrapper">
            <Mail className="input-icon" />
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={handleChange}
              className="form-input"
              maxLength={15}
            />
            <span className="input-suffix">
              <span className="country-code">+91</span>
            </span>
          </div>
          <p className="form-hint">Enter your registered mobile number</p>
        </div>

        <div className="form-group">
          <label htmlFor="password" className="form-label">
            <Lock className="label-icon" />
            Password
          </label>
          <div className="input-wrapper">
            <Lock className="input-icon" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="form-hint">
            <a href="#" className="hint-link">Forgot password?</a>
          </p>
        </div>

        {error && (
          <div className="form-error-container">
            <AlertCircle className="error-icon" />
            <p className="form-error">{error}</p>
          </div>
        )}

        <button className="submit-button" type="submit" disabled={saving}>
          <span className="button-content">
            {saving ? (
              <>
                <svg className="spinner" viewBox="0 0 24 24">
                  <circle className="path" cx="12" cy="12" r="10" stroke="none" />
                </svg>
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <Shield className="button-icon" />
                <span>Sign in</span>
                <ArrowRight className="button-arrow" />
              </>
            )}
          </span>
        </button>
      </form>

      <div className="login-footer">
        <p>Don't have an account? <a href="/signup">Request approval</a></p>
        <p className="security-note">
          <Shield className="shield-icon" />
          Your information is secure. We never store passwords in plain text.
        </p>
      </div>
    </div>
  );
}
