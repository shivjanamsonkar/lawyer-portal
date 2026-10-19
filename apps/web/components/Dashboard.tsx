"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays, Clock3, FileText, Gavel, IndianRupee, Menu, Plus, Search, UsersRound, X } from "lucide-react";
import { listCases, listClients, listLedger, type CaseRecord, type Client, type LedgerRecord } from "@/lib/api";

const nav = [
  { label: "Overview", href: "/", icon: BriefcaseBusiness },
  { label: "Cases", href: "/cases", icon: Gavel },
  { label: "Clients", href: "/clients", icon: UsersRound },
  { label: "Hearing alarms", href: "/alarms", icon: Bell },
  { label: "Fee ledger", href: "/ledger", icon: IndianRupee },
];
const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const dateText = (value: string | null) => value ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`)) : "Date not set";
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

export function Dashboard() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [ledger, setLedger] = useState<LedgerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([listCases(), listClients(), listLedger()]).then(([matters, people, fees]) => {
      if (!active) return;
      setCases(matters); setClients(people); setLedger(fees);
    }).catch(() => { if (active) setError("Your chamber data could not be loaded. Check the API connection and retry."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const upcoming = useMemo(() => cases.filter((item) => item.next_hearing_date && item.next_hearing_date >= todayISO())
    .sort((a, b) => (a.next_hearing_date ?? "").localeCompare(b.next_hearing_date ?? "")).slice(0, 5), [cases]);
  const dueToday = cases.filter((item) => item.next_hearing_date === todayISO()).length;
  const pending = ledger.reduce((sum, item) => sum + Number(item.pending_balance || 0), 0);
  const matches = query.trim() ? cases.filter((item) => `${item.case_number} ${item.cnr_number ?? ""} ${item.petitioner} ${item.respondent} ${item.court_name}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5) : [];
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 17 ? "Good afternoon" : "Good evening";
  const formattedToday = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(now);

  return <main className="app-shell">
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <Link href="/" className="brand-lockup"><span className="brand-mark"><Gavel size={19} /></span><span><strong>AdvocatePro</strong><small>CHAMBERS</small></span></Link>
      <div className="workspace-switch"><span className="workspace-avatar">A</span><span className="workspace-name">My chambers<small>Legal workspace</small></span></div>
      <nav className="side-nav" aria-label="Main navigation"><div className="nav-group"><p className="nav-heading">WORKSPACE</p>{nav.map(({ label, href, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={`nav-link ${href === "/" ? "active" : ""}`} aria-current={href === "/" ? "page" : undefined}><Icon size={17} /><span>{label}</span>{label === "Hearing alarms" && dueToday > 0 && <span className="nav-count">{dueToday}</span>}</Link>)}</div></nav>
      <div className="sidebar-bottom"><div className="help-link"><FileText size={17} /><span>Chamber workspace</span></div><div className="profile-row"><div className="profile-avatar">AP</div><div><strong>Advocate</strong><small>Practice workspace</small></div></div></div>
    </aside>
    {menuOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
    <section className="main-column">
      <header className="topbar"><div className="breadcrumbs"><button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setMenuOpen(true)}><Menu size={19} /></button><span>Chambers</span><span className="crumb-divider">/</span><strong>Overview</strong></div><div className="topbar-actions"><div className="search-wrap"><label className="search-box"><Search size={16} /><input aria-label="Search matters" placeholder="Search matters, CNR, court..." value={query} onChange={(e) => setQuery(e.target.value)} /><kbd>⌘ K</kbd></label>{query && <div className="search-results" role="listbox">{matches.length ? matches.map((record) => <Link key={record.id} href="/cases" onClick={() => setQuery("")}><strong>{record.petitioner} v. {record.respondent}</strong><span>{record.case_number} · {record.court_name}</span></Link>) : <p>{loading ? "Loading matters…" : "No matching matters"}</p>}</div>}</div><Link className="icon-button" href="/alarms" aria-label="Open hearing alarms"><Bell size={18} />{dueToday > 0 && <i />}</Link><div className="today-chip"><CalendarDays size={15} /><span>{formattedToday}</span></div></div></header>
      <div className="content-area">
        <div className="page-heading"><div><p className="eyebrow">YOUR CHAMBER AT A GLANCE</p><h1>{greeting}</h1><p className="heading-subtitle">Keep your matters, hearings, and client work moving.</p></div><Link className="primary-button" href="/cases"><Plus size={17} /> New matter</Link></div>
        {error && <div className="service-notice" role="alert">{error} <button className="retry-button" onClick={() => window.location.reload()}>Retry</button></div>}
        <section className="stat-grid" aria-label="Chambers overview">
          <Link className="stat-card stat-card-link" href="/cases"><div className="stat-top"><span>Registered matters</span><span className="stat-icon ink"><BriefcaseBusiness size={17} /></span></div><div className="stat-value">{loading ? "—" : cases.length}</div><div className="stat-foot">Open case directory <ArrowUpRight size={13} /></div></Link>
          <Link className="stat-card stat-card-link" href="/alarms"><div className="stat-top"><span>Hearings today</span><span className="stat-icon coral"><CalendarDays size={17} /></span></div><div className="stat-value">{loading ? "—" : String(dueToday).padStart(2, "0")}</div><div className="stat-foot"><span className="dot-indicator" /> Next hearing dates</div></Link>
          <Link className="stat-card stat-card-link" href="/ledger"><div className="stat-top"><span>Fees outstanding</span><span className="stat-icon olive"><IndianRupee size={17} /></span></div><div className="stat-value money">{loading ? "—" : money.format(pending)}</div><div className="stat-foot">Review fee ledger <ArrowUpRight size={13} /></div></Link>
          <Link className="stat-card stat-card-link" href="/clients"><div className="stat-top"><span>Clients</span><span className="stat-icon blue"><UsersRound size={17} /></span></div><div className="stat-value">{loading ? "—" : clients.length}</div><div className="stat-foot">View client directory <ArrowUpRight size={13} /></div></Link>
        </section>
        <section className="dashboard-grid">
          <div className="panel matters-panel"><div className="panel-heading"><div><h2>Upcoming hearings</h2><p>Your next scheduled court dates</p></div><Link href="/alarms" className="text-link">Hearing calendar <ArrowUpRight size={14} /></Link></div>
            {upcoming.length ? <div className="matter-table-wrap"><table className="matter-table"><thead><tr><th>MATTER</th><th>COURT</th><th>NEXT HEARING</th><th>STAGE</th></tr></thead><tbody>{upcoming.map((matter) => <tr key={matter.id}><td><strong>{matter.petitioner} v. {matter.respondent}</strong><small>{matter.case_number}</small></td><td>{matter.court_name}</td><td><span className="date-cell"><Clock3 size={14} />{dateText(matter.next_hearing_date)}</span></td><td><span className="stage-pill green">{matter.stage}</span></td></tr>)}</tbody></table></div> : <div className="dashboard-empty"><CalendarDays size={22} /><strong>{loading ? "Loading hearings…" : "No upcoming hearings recorded"}</strong><span>Add a next hearing date to a matter to see it here.</span><Link href="/cases">Open matter directory <ArrowUpRight size={13} /></Link></div>}
            <div className="panel-footer"><span><strong>{upcoming.length}</strong> upcoming matters shown</span><Link href="/cases">Open case directory <ArrowUpRight size={13} /></Link></div>
          </div>
          <aside className="panel schedule-panel"><div className="panel-heading"><div><h2>Quick actions</h2><p>Common chamber tasks</p></div><Gavel size={18} /></div><div className="quick-actions"><Link href="/cases"><span className="quick-action-icon"><Plus size={17} /></span><span><strong>Create a matter</strong><small>Record a new case and hearing</small></span><ArrowUpRight size={14} /></Link><Link href="/clients"><span className="quick-action-icon"><UsersRound size={17} /></span><span><strong>Add a client</strong><small>Save client contact details</small></span><ArrowUpRight size={14} /></Link><Link href="/ledger"><span className="quick-action-icon"><IndianRupee size={17} /></span><span><strong>Record a payment</strong><small>Update a matter's fee ledger</small></span><ArrowUpRight size={14} /></Link><Link href="/alarms"><span className="quick-action-icon"><Bell size={17} /></span><span><strong>Review hearing alerts</strong><small>{dueToday ? `${dueToday} hearing${dueToday === 1 ? "" : "s"} today` : "See upcoming court dates"}</small></span><ArrowUpRight size={14} /></Link></div></aside>
        </section>
        <section className="bottom-strip"><div className="bottom-icon"><Bell size={17} /></div><div className="bottom-copy"><strong>Stay prepared for your next court date</strong><span>Review hearing dates and preparation reminders in one place.</span></div><Link href="/alarms" className="bottom-action">Open alarm centre <ArrowUpRight size={14} /></Link></section>
        <footer className="page-footer"><span>AdvocatePro Chambers</span><span>Confidential · For chambers use only</span></footer>
      </div>
    </section>
  </main>;
}
