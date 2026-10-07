import { CaseDirectory } from "@/components/CaseDirectory";
import { ModuleNav } from "@/components/ModuleNav";
export default function CasesPage() {
  return <main className="module-page"><ModuleNav /><header className="module-header"><div><p className="eyebrow">CHAMBERS DIRECTORY</p><h1>Matters & cases</h1><p>Track proceedings, hearing dates, and preparation notes.</p></div></header>
    <CaseDirectory initialCases={[]} clients={[]} loadError={null} />
  </main>;
}