import { LedgerDirectory } from "@/components/LedgerDirectory";
import { ModuleNav } from "@/components/ModuleNav";

export default function LedgerPage() {
  return <main className="module-page"><ModuleNav /><header className="module-header"><div><p className="eyebrow">FINANCIAL MANAGEMENT</p><h1>Fee ledger</h1><p>Agreed fees, payments received, and balances outstanding.</p></div></header>
    <LedgerDirectory initialRows={[]} loadError={null} />
  </main>;
}