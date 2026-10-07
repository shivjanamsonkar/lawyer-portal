"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel, Pencil, Plus, Trash2, X } from "lucide-react";
import type { CasePayload, CaseRecord, Client } from "@/lib/api";
import { createCase, deleteCase, listCases, listClients, listLedger, updateCase } from "@/lib/api";
import { CaseCard } from "@/components/CaseCard";

export function CaseDirectory({ initialCases, clients: initialClients, loadError }: { initialCases: CaseRecord[]; clients: Client[]; loadError: string | null }) {
  const router = useRouter();
  const [cases, setCases] = useState(initialCases);
  const [clients, setClients] = useState(initialClients);
  const [ledger, setLedger] = useState<Awaited<ReturnType<typeof listLedger>>>([]);
  const [selected, setSelected] = useState<CaseRecord | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([listCases(), listClients(), listLedger()]).then(([records, directory, balances]) => {
      if (!active) return;
      setCases(records);
      setClients(directory);
      setLedger(balances);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  function beginEdit(record: CaseRecord | null): void { setSelected(record); setError(null); setOpen(true); }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const cnr = String(data.get("cnr_number")).trim().toUpperCase();
    const clientId = String(data.get("client_id"));
    const fee = String(data.get("agreed_fee") || "0");
    const payload: CasePayload = {
      client_id: clientId || null, cnr_number: cnr || null,
      case_number: String(data.get("case_number")).trim(), court_name: String(data.get("court_name")).trim(),
      court_room: String(data.get("court_room")).trim() || null, judge_name: String(data.get("judge_name")).trim() || null,
      petitioner: String(data.get("petitioner")).trim(), respondent: String(data.get("respondent")).trim(),
      case_type: String(data.get("case_type")), stage: String(data.get("stage")),
      next_hearing_date: String(data.get("next_hearing_date")) || null, agreed_fee: fee,
      preparation_notes: String(data.get("preparation_notes")).trim() || null,
    };
    try {
      const result = selected ? await updateCase(selected.id, payload) : await createCase(payload);
      setCases((current) => selected ? current.map((record) => record.id === result.id ? result : record) : [...current, result]);
      setOpen(false);
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save matter."); }
    finally { setSaving(false); }
  }

  async function remove(record: CaseRecord): Promise<void> {
    if (!window.confirm(`Delete ${record.case_number}? Its payment ledger will also be deleted.`)) return;
    try { await deleteCase(record.id); setCases((current) => current.filter((item) => item.id !== record.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete matter."); }
  }

  return <>
    <div className="directory-toolbar"><span><Gavel size={15} /> {cases.length} registered matters</span><button className="primary-button" onClick={() => beginEdit(null)}><Plus size={16} /> New matter</button></div>
    {loadError && <div className="service-notice" role="status">{loadError}</div>}
    {error && !open && <div className="service-notice" role="alert">{error}</div>}
    {cases.length ? <div className="case-list">{cases.map((record) => <div className="case-directory-row" key={record.id}><CaseCard record={record} clientName={clients.find((client) => client.id === record.client_id)?.name ?? null} pendingBalance={ledger.find((entry) => entry.case_id === record.id)?.pending_balance ?? null} /><div className="row-actions"><button aria-label={`Edit ${record.case_number}`} title="Edit matter" onClick={() => beginEdit(record)}><Pencil size={15} /></button><button aria-label={`Delete ${record.case_number}`} title="Delete matter" onClick={() => void remove(record)}><Trash2 size={15} /></button></div></div>)}</div> : <div className="empty-state"><Gavel size={23} /><strong>{loadError ? "Matter directory unavailable" : "No matters recorded yet"}</strong><span>{loadError ? "Check that the API is running and try again." : "Add your first matter to begin the case directory."}</span><button className="secondary-button" onClick={() => beginEdit(null)}>Add a matter</button></div>}
    {open && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="alarm-modal form-modal wide-form-modal" role="dialog" aria-modal="true" aria-labelledby="case-form-title"><button className="modal-close" aria-label="Close matter form" onClick={() => setOpen(false)}><X size={17} /></button><h2 id="case-form-title">{selected ? "Edit matter" : "New matter"}</h2><p>Case details, court information, and next hearing.</p><form className="editor-form two-column-form" onSubmit={submit}>
      <label>Case number<input name="case_number" required maxLength={100} defaultValue={selected?.case_number ?? ""} /></label>
      <label>CNR number<input name="cnr_number" minLength={16} maxLength={16} pattern=".{16}" title="CNR must contain exactly 16 characters" defaultValue={selected?.cnr_number ?? ""} /></label>
      <label>Petitioner<input name="petitioner" required maxLength={255} defaultValue={selected?.petitioner ?? ""} /></label>
      <label>Respondent<input name="respondent" required maxLength={255} defaultValue={selected?.respondent ?? ""} /></label>
      <label>Court name<input name="court_name" required maxLength={255} defaultValue={selected?.court_name ?? ""} /></label>
      <label>Court room<input name="court_room" maxLength={50} defaultValue={selected?.court_room ?? ""} /></label>
      <label>Judge name<input name="judge_name" maxLength={255} defaultValue={selected?.judge_name ?? ""} /></label>
      <label>Client<select name="client_id" defaultValue={selected?.client_id ?? ""}><option value="">No client linked</option>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label>
      <label>Case type<select name="case_type" defaultValue={selected?.case_type ?? "Civil"}><option>Civil</option><option>Criminal</option><option>Corporate</option><option>Family</option><option>Commercial</option><option>Other</option></select></label>
      <label>Current stage<input name="stage" required maxLength={100} defaultValue={selected?.stage ?? "Pending"} /></label>
      <label>Next hearing date<input name="next_hearing_date" type="date" defaultValue={selected?.next_hearing_date ?? ""} /></label>
      <label>Agreed fee (INR)<input name="agreed_fee" type="number" min="0" step="0.01" defaultValue={selected?.agreed_fee ?? "0.00"} /></label>
      <label className="form-span-two">Preparation notes<textarea name="preparation_notes" rows={3} defaultValue={selected?.preparation_notes ?? ""} /></label>
      {error && <p className="form-error form-span-two" role="alert">{error}{error.includes("Set up your chamber") && <> <a href="/setup">Open setup</a></>}</p>}
      <div className="modal-actions form-span-two"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save matter"}</button></div>
    </form></section></div>}
  </>;
}