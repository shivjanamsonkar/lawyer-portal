import Link from "next/link";
import { Gavel } from "lucide-react";
import { LogoutButton } from "@/components/LogoutButton";

const links = [
  { label: "Overview", href: "/" },
  { label: "Cases", href: "/cases" },
  { label: "Clients", href: "/clients" },
  { label: "Alarms", href: "/alarms" },
  { label: "Ledger", href: "/ledger" },
  { label: "Admin", href: "/admin/dashboard" },
];

export function ModuleNav() {
  return <nav className="module-nav" aria-label="Main navigation">
    <Link href="/" className="module-brand"><span><Gavel size={16} /></span>AdvocatePro</Link>
    <div>{links.map(({ label, href }) => <Link href={href} key={href}>{label}</Link>)}</div>
    <LogoutButton />
  </nav>;
}