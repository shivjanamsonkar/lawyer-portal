"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { IndianRupee, Plus, X } from "lucide-react";
import { createPayment, listLedger, type LedgerRecord } from "@/lib/api";
import { LedgerTable, type LedgerEntry } from "@/components/LedgerTable";

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function LedgerDirectory({ initialRows, loadError }: { initialRows: LedgerRecord[]; loadError: string | null }) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    listLedger().then((records) => { if (active) setRows(records); }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  const entries: LedgerEntry[] = rows.map((row) => ({ caseId: row.case_id, caseNumber: row.case_number, clientName: row.client_name ?? `${row.petitioner} v. ${row.respondent}`, clientPhone: row.client_phone ?? "", agreedFee: Number(row.agreed_fee), received: Number(row.received_amount) }));
  const outstanding = rows.reduce((total, row) => total + Number(row.pending_balance), 0);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const caseId = String(data.get("case_id"));
    setSaving(true);
    setError(null);
    try {
      await createPayment(caseId, { amount_paid: String(data.get("amount_paid")), payment_mode: String(data.get("payment_mode")), notes: String(data.get("notes")).trim() || undefined });
      setRows(await listLedger());
      setOpen(false);
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not record payment."); }
    finally { setSaving(false); }
  }

  return <>
    {loadError && <div className="service-notice" role="status">{loadError}</div>}
    {error && !open && <div className="service-notice" role="alert">{error}</div>}
    <section className="ledger-overview"><div className="ledger-overview-icon"><IndianRupee size={18} /></div><div><span>Total outstanding</span><strong>{rows.length ? money.format(outstanding) : "--"}</strong></div><small>Across {rows.length} matters</small><button className="primary-button" disabled={!rows.length} onClick={() => { setError(null); setOpen(true); }}><Plus size={15} /> Record payment</button></section>
    <section className="panel ledger-panel"><div className="panel-heading"><div><h2>Case balances</h2><p>WhatsApp reminders open in a new tab.</p></div></div>{entries.length ? <LedgerTable entries={entries} /> : <div className="empty-state compact"><IndianRupee size={23} /><strong>{loadError ? "Ledger unavailable" : "No case fees recorded"}</strong><span>{loadError ? "Check API availability and reload." : "Agreed fees and recorded payments will appear here."}</span></div>}</section>
    {open && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="alarm-modal form-modal" role="dialog" aria-modal="true" aria-labelledby="payment-form-title"><button className="modal-close" aria-label="Close payment form" onClick={() => setOpen(false)}><X size={17} /></button><h2 id="payment-form-title">Record payment</h2><p>Post a payment to a case ledger.</p><form className="editor-form" onSubmit={submit}><label>Case<select name="case_id" required defaultValue=""><option value="" disabled>Select a matter</option>{rows.map((row) => <option key={row.case_id} value={row.case_id}>{row.case_number} · {row.client_name ?? `${row.petitioner} v. ${row.respondent}`}</option>)}</select></label><label>Amount (INR)<input name="amount_paid" type="number" min="0.01" step="0.01" required inputMode="decimal" /></label><label>Payment mode<select name="payment_mode" required defaultValue="UPI"><option>UPI</option><option>Cash</option><option>Bank Transfer</option><option>Cheque</option></select></label><label>Notes<textarea name="notes" rows={2} /></label>{error && <p className="form-error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save payment"}</button></div></form></section></div>}
  </>;
}