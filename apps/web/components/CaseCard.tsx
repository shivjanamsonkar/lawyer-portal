import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";
import type { CaseRecord } from "@/lib/api";

function formatHearingDate(value: string | null): string {
  if (!value) return "Date not set";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function CaseCard({ record, clientName, pendingBalance }: { record: CaseRecord; clientName?: string | null; pendingBalance?: string | null }) {
  const oppositeParty = clientName === record.petitioner ? record.respondent : record.petitioner;
  return (
    <article className="case-record">
      <div className="case-record-main"><span className="case-type">{record.case_type}</span><h2>{record.petitioner} <span>v.</span> {record.respondent}</h2><p>{record.case_number}{record.cnr_number ? ` · CNR ${record.cnr_number}` : ""}</p><p className="case-party-context">Client: {clientName ?? "Not linked"} · Other party: {oppositeParty}</p>{record.preparation_notes && <p className="case-preparation-notes">{record.preparation_notes}</p>}</div>
      <div className="case-record-meta"><span><MapPin size={14} />{record.court_name}{record.court_room ? ` · ${record.court_room}` : ""}</span><span><CalendarDays size={14} />{formatHearingDate(record.next_hearing_date)}</span></div>
      <div className="case-record-end"><span className="case-stage">{record.stage}</span>{pendingBalance !== undefined && <span className="case-balance">{pendingBalance === null ? "No fee" : `${money.format(Number(pendingBalance))} due`}</span>}<Link href="/cases" aria-label={`View ${record.case_number} in the matter directory`}>Matter directory</Link></div>
    </article>
  );
}