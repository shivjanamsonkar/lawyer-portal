"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2, UsersRound, X } from "lucide-react";
import type { Client, ClientPayload } from "@/lib/api";
import { createClient, deleteClient, listClients, updateClient } from "@/lib/api";

export function ClientDirectory({ initialClients, loadError }: { initialClients: Client[]; loadError: string | null }) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [selected, setSelected] = useState<Client | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listClients().then((records) => { if (active) setClients(records); }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  function beginEdit(client: Client | null): void { setSelected(client); setError(null); setOpen(true); }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    const payload: ClientPayload = { name: String(data.get("name")).trim(), phone: String(data.get("phone")).trim(), email: String(data.get("email")).trim() || null, address: String(data.get("address")).trim() || null };
    try {
      const result = selected ? await updateClient(selected.id, payload) : await createClient(payload);
      setClients((current) => selected ? current.map((client) => client.id === result.id ? result : client) : [...current, result].sort((a, b) => a.name.localeCompare(b.name)));
      setOpen(false);
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not save client."); }
    finally { setSaving(false); }
  }

  async function remove(client: Client): Promise<void> {
    if (!window.confirm(`Delete ${client.name}? Cases will remain, but their client link will be removed.`)) return;
    try { await deleteClient(client.id); setClients((current) => current.filter((item) => item.id !== client.id)); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Could not delete client."); }
  }

  return <>
    <div className="directory-toolbar"><span>{clients.length} registered clients</span><button className="primary-button" onClick={() => beginEdit(null)}><Plus size={16} /> New client</button></div>
    {loadError && <div className="service-notice" role="status">{loadError}</div>}
    {error && !open && <div className="service-notice" role="alert">{error}</div>}
    {clients.length ? <div className="client-list">{clients.map((client) => <article className="client-record" key={client.id}><div className="client-monogram">{client.name.trim().slice(0, 1).toUpperCase()}</div><div className="client-details"><strong>{client.name}</strong><span>{client.email || "No email on record"}{client.address ? ` · ${client.address}` : ""}</span></div><a href={`tel:${client.phone}`}>{client.phone}</a><div className="row-actions"><button aria-label={`Edit ${client.name}`} title="Edit client" onClick={() => beginEdit(client)}><Pencil size={15} /></button><button aria-label={`Delete ${client.name}`} title="Delete client" onClick={() => void remove(client)}><Trash2 size={15} /></button></div></article>)}</div> : <div className="empty-state"><UsersRound size={23} /><strong>{loadError ? "Client directory unavailable" : "No clients recorded yet"}</strong><span>{loadError ? "Check that the API is running and try again." : "Add your first client to begin the directory."}</span><button className="secondary-button" onClick={() => beginEdit(null)}>Add a client</button></div>}
    {open && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="alarm-modal form-modal" role="dialog" aria-modal="true" aria-labelledby="client-form-title"><button className="modal-close" aria-label="Close client form" onClick={() => setOpen(false)}><X size={17} /></button><h2 id="client-form-title">{selected ? "Edit client" : "New client"}</h2><p>Client contact details for chambers records.</p><form className="editor-form" onSubmit={submit}><label>Full name<input name="name" required maxLength={255} defaultValue={selected?.name ?? ""} autoComplete="name" /></label><label>Phone<input name="phone" type="tel" required maxLength={20} defaultValue={selected?.phone ?? ""} autoComplete="tel" /></label><label>Email<input name="email" type="email" maxLength={255} defaultValue={selected?.email ?? ""} autoComplete="email" /></label><label>Address<textarea name="address" rows={2} defaultValue={selected?.address ?? ""} autoComplete="street-address" /></label>{error && <p className="form-error" role="alert">{error}{error.includes("Set up your chamber") && <> <a href="/setup">Open setup</a></>}</p>}<div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setOpen(false)}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving..." : "Save client"}</button></div></form></section></div>}
  </>;
}