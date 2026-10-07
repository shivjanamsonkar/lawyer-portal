import Link from "next/link";
import { Gavel } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({ eyebrow, title, description, children, footer }: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return <main className="auth-shell">
    <Link href="/login" className="brand-lockup auth-brand"><span className="brand-mark"><Gavel size={19} strokeWidth={1.8} /></span><span><strong>AdvocatePro</strong><small>CHAMBERS</small></span></Link>
    <section className="auth-panel"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="auth-description">{description}</p>{children}<div className="auth-footer">{footer}</div></section>
    <p className="auth-confidential">CONFIDENTIAL · CHAMBERS ACCESS</p>
  </main>;
}
