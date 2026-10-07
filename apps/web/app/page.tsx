import Link from "next/link";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  Gavel,
  IndianRupee,
  Plus,
  Search,
  UsersRound,
} from "lucide-react";

const hearings = [
  { time: "10:30 AM", title: "Sharma v. Mehta", detail: "Civil Appeal · Courtroom 4", type: "Hearing" },
  { time: "12:15 PM", title: "State v. Kapoor", detail: "Criminal Revision · Courtroom 2", type: "Evidence" },
  { time: "02:00 PM", title: "Apex Holdings v. Iyer", detail: "Commercial Suit · Courtroom 7", type: "Mentioning" },
];

const matters = [
  { name: "Sharma v. Mehta", number: "CS/184/2024", client: "Arjun Sharma", court: "Delhi High Court", date: "Today, 10:30 AM", stage: "Arguments", tone: "green" },
  { name: "State v. Kapoor", number: "CRL/092/2023", client: "Nisha Kapoor", court: "Saket District Court", date: "Today, 12:15 PM", stage: "Evidence", tone: "amber" },
  { name: "Apex Holdings v. Iyer", number: "COM/317/2025", client: "Apex Holdings Pvt Ltd", court: "NCLT New Delhi", date: "Today, 2:00 PM", stage: "Mentioning", tone: "blue" },
  { name: "Verma Estate Petition", number: "CS/056/2025", client: "Rohit Verma", court: "Tis Hazari Courts", date: "Tomorrow, 11:00 AM", stage: "Pending", tone: "slate" },
];

const navGroups = [
  { title: "WORKSPACE", links: [{ label: "Overview", href: "/", icon: BriefcaseBusiness }, { label: "Cases", href: "/cases", icon: Gavel }, { label: "Clients", href: "/clients", icon: UsersRound }] },
  { title: "CHAMBERS", links: [{ label: "Hearing alarms", href: "/alarms", icon: Bell }, { label: "Fee ledger", href: "/ledger", icon: IndianRupee }, { label: "Documents", href: "/documents", icon: FileText }] },
];

export default function DashboardPage() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <Link href="/" className="brand-lockup">
          <span className="brand-mark"><Gavel size={19} strokeWidth={1.8} /></span>
          <span><strong>AdvocatePro</strong><small>CHAMBERS</small></span>
        </Link>
        <button className="workspace-switch"><span className="workspace-avatar">A</span><span className="workspace-name">A. Mehra Chambers<small>New Delhi</small></span><ChevronDown size={15} /></button>
        <nav className="side-nav" aria-label="Main navigation">
          {navGroups.map((group) => <div className="nav-group" key={group.title}>
            <p className="nav-heading">{group.title}</p>
            {group.links.map(({ label, href, icon: Icon }) => <Link key={label} href={href} className={`nav-link ${label === "Overview" ? "active" : ""}`}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{label === "Hearing alarms" && <span className="nav-count">3</span>}</Link>)}
          </div>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-link"><CircleHelp size={17} /><span>Help & support</span></div>
          <div className="profile-row"><div className="profile-avatar">AM</div><div><strong>Adv. Arjun Mehra</strong><small>Managing advocate</small></div><ChevronDown size={15} /></div>
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar">
          <div className="breadcrumbs"><span>Chambers</span><span className="crumb-divider">/</span><strong>Overview</strong></div>
          <div className="topbar-actions"><label className="search-box"><Search size={16} /><input aria-label="Search cases and clients" placeholder="Search cases, clients..." /><kbd>⌘ K</kbd></label><button className="icon-button" aria-label="Notifications"><Bell size={18} /><i /></button><div className="today-chip"><CalendarDays size={15} /><span>Mon, 05 Oct 2026</span></div></div>
        </header>

        <div className="content-area">
          <div className="page-heading"><div><p className="eyebrow">MONDAY, 5 OCTOBER 2026</p><h1>Good morning, Arjun</h1><p className="heading-subtitle">Here’s what’s happening across your chambers today.</p></div><Link className="primary-button" href="/cases"><Plus size={17} /> New matter</Link></div>

          <section className="stat-grid" aria-label="Chambers overview">
            <article className="stat-card"><div className="stat-top"><span>Active matters</span><span className="stat-icon ink"><BriefcaseBusiness size={17} /></span></div><div className="stat-value">48</div><div className="stat-foot"><span className="trend positive"><ArrowUpRight size={14} /> 6.2%</span><span>vs last month</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Hearings today</span><span className="stat-icon coral"><CalendarDays size={17} /></span></div><div className="stat-value">03</div><div className="stat-foot"><span className="dot-indicator" /> <span>Next at 10:30 AM</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Outstanding fees</span><span className="stat-icon olive"><IndianRupee size={17} /></span></div><div className="stat-value money">₹8,42,500</div><div className="stat-foot"><span className="trend negative"><ArrowDownRight size={14} /> 2.4%</span><span>collected this month</span></div></article>
            <article className="stat-card"><div className="stat-top"><span>Registered clients</span><span className="stat-icon blue"><UsersRound size={17} /></span></div><div className="stat-value">126</div><div className="stat-foot"><span className="trend positive"><ArrowUpRight size={14} /> 12</span><span>added this month</span></div></article>
          </section>

          <section className="dashboard-grid">
            <div className="panel matters-panel">
              <div className="panel-heading"><div><h2>Today’s cause list</h2><p>Hearings and appearances scheduled for today</p></div><Link href="/cases" className="text-link">View all matters <ArrowUpRight size={14} /></Link></div>
              <div className="matter-table-wrap"><table className="matter-table"><thead><tr><th>MATTER</th><th>CLIENT</th><th>COURT</th><th>NEXT HEARING</th><th>STAGE</th></tr></thead><tbody>{matters.map((matter) => <tr key={matter.number}><td><strong>{matter.name}</strong><small>{matter.number}</small></td><td>{matter.client}</td><td>{matter.court}</td><td><span className="date-cell"><Clock3 size={14} />{matter.date}</span></td><td><span className={`stage-pill ${matter.tone}`}>{matter.stage}</span></td></tr>)}</tbody></table></div>
              <div className="panel-footer"><span>Showing <strong>4</strong> of <strong>48</strong> active matters</span><Link href="/cases">Open case directory <ArrowUpRight size={13} /></Link></div>
            </div>

            <aside className="panel schedule-panel">
              <div className="panel-heading"><div><h2>Today at court</h2><p>Monday, 5 October</p></div><button className="more-button" aria-label="More schedule options">···</button></div>
              <div className="schedule-list">{hearings.map((hearing, index) => <div className="schedule-item" key={hearing.title}><div className="schedule-time">{hearing.time}</div><div className={`schedule-marker marker-${index}`} /><div className="schedule-detail"><strong>{hearing.title}</strong><span>{hearing.detail}</span><small>{hearing.type}</small></div></div>)}</div>
              <Link href="/alarms" className="schedule-link"><Bell size={15} /> Review hearing alarms <ArrowUpRight size={14} /></Link>
            </aside>
          </section>

          <section className="bottom-strip"><div className="bottom-icon"><Bell size={17} /></div><div className="bottom-copy"><strong>3 hearing reminders need your attention</strong><span>Preparation alerts are ready for hearings this week.</span></div><Link href="/alarms" className="bottom-action">Open alarm centre <ArrowUpRight size={14} /></Link></section>
          <footer className="page-footer"><span>AdvocatePro Chambers</span><span>Confidential · For chambers use only</span></footer>
        </div>
      </section>
    </main>
  );
}