export type LedgerEntry = {
  caseId: string;
  caseNumber: string;
  clientName: string;
  clientPhone: string;
  agreedFee: number;
  received: number;
};

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function reminderLink(entry: LedgerEntry): string {
  const phone = entry.clientPhone.replace(/\D/g, "");
  const due = Math.max(0, entry.agreedFee - entry.received);
  const message = `Hello ${entry.clientName}, this is a reminder regarding the outstanding professional fee of ${inr.format(due)} for matter ${entry.caseNumber}. Please let us know when convenient. - AdvocatePro Chambers`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
  return <div className="matter-table-wrap"><table className="matter-table ledger-table"><thead><tr><th>MATTER / CLIENT</th><th>AGREED</th><th>RECEIVED</th><th>OUTSTANDING</th><th>REMINDER</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.caseId}><td><strong>{entry.caseNumber}</strong><small>{entry.clientName}</small></td><td>{inr.format(entry.agreedFee)}</td><td>{inr.format(entry.received)}</td><td><strong>{inr.format(Math.max(0, entry.agreedFee - entry.received))}</strong></td><td>{entry.clientPhone ? <a className="whatsapp-link" href={reminderLink(entry)} target="_blank" rel="noreferrer">WhatsApp</a> : <span>No client phone</span>}</td></tr>)}</tbody></table></div>;
}