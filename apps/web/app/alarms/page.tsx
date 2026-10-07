"use client";

import { useEffect, useState } from "react";
import { Bell, CalendarDays, Clock3 } from "lucide-react";
import { AlarmTestModal } from "@/components/AlarmTestModal";
import { ModuleNav } from "@/components/ModuleNav";
import { listCases, type CaseRecord } from "@/lib/api";

function daysUntil(value: string): number {
  const hearing = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((hearing.getTime() - today.getTime()) / 86_400_000);
}

export default function AlarmsPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    listCases().then((records) => { if (active) setCases(records); }).catch(() => { if (active) setError("The case service could not be reached. Start the API and database to load hearing dates."); });
    return () => { active = false; };
  }, []);

  const upcoming = cases.flatMap((record) => {
    if (!record.next_hearing_date) return [];
    const days = daysUntil(record.next_hearing_date);
    if (days < 0 || days > 7) return [];
    return [{ record, days }];
  }).sort((first, second) => first.days - second.days);

  return <main className="module-page"><ModuleNav /><header className="module-header"><div><p className="eyebrow">SUNWAI MISS NA HO</p><h1>Hearing alarms</h1><p>Upcoming matters and local browser alarm check.</p></div><AlarmTestModal /></header>
    <section className="alarm-tiers" aria-label="Reminder schedule"><article><span className="tier-day">T-7</span><div><strong>Preparation alert</strong><p>Briefing and evidence collection reminder.</p></div></article><article><span className="tier-day">T-1</span><div><strong>Client reminder · 7:00 PM</strong><p>WhatsApp or SMS with court and document details.</p></div></article><article><span className="tier-day">T-0</span><div><strong>Chamber alarm · 7:00 AM</strong><p>High-priority hearing day notification.</p></div></article></section>
    {error && <div className="service-notice" role="status">{error}</div>}
    <section className="panel alarm-list-panel"><div className="panel-heading"><div><h2>Hearings in the next 7 days</h2><p>Reminder tier is shown relative to each next hearing date.</p></div><CalendarDays size={18} /></div>{upcoming.length ? <div className="alarm-case-list">{upcoming.map(({ record, days }) => <article className="alarm-case" key={record.id}><div className="alarm-date"><strong>{days === 0 ? "Today" : days === 1 ? "Tomorrow" : `In ${days} days`}</strong><span>{record.next_hearing_date}</span></div><div className="alarm-case-info"><strong>{record.petitioner} v. {record.respondent}</strong><span>{record.case_number} · {record.court_name}</span></div><span className="alarm-tier-label"><Clock3 size={13} />{days === 0 ? "T-0 chamber alarm" : days === 1 ? "T-1 client reminder" : "T-7 preparation"}</span></article>)}</div> : <div className="empty-state compact"><Bell size={22} /><strong>{error ? "Hearings unavailable" : "No upcoming hearings"}</strong><span>{error ? "Check API availability and reload." : "Cases with a hearing date in the next 7 days will appear here."}</span></div>}</section>
    <p className="alarm-disclaimer">Scheduled SMS/WhatsApp delivery and background alarm dispatch require provider credentials and a configured scheduler.</p>
  </main>;
}