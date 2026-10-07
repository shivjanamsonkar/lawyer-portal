import { ModuleNav } from "@/components/ModuleNav";
import { AdminUserTable } from "@/components/AdminUserTable";

export default function AdminDashboardPage() {
  return <main className="module-page"><ModuleNav /><header className="module-header"><div><p className="eyebrow">ACCOUNT GOVERNANCE</p><h1>Admin approval</h1><p>Review registration requests and manage chamber access.</p></div></header>
    <section className="panel admin-panel"><AdminUserTable /></section>
  </main>;
}
