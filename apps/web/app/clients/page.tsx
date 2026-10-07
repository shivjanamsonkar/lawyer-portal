import { ModuleNav } from "@/components/ModuleNav";
import { ClientDirectory } from "@/components/ClientDirectory";

export default function ClientsPage() {
  return <main className="module-page"><ModuleNav /><header className="module-header"><div><p className="eyebrow">CHAMBERS DIRECTORY</p><h1>Clients</h1><p>Contact details and active client relationships.</p></div></header>
    <ClientDirectory initialClients={[]} loadError={null} />
  </main>;
}