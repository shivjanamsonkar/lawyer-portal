import { render, screen } from "@testing-library/react";
import { CaseCard } from "@/components/CaseCard";

jest.mock("next/link", () => ({ __esModule: true, default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a> }));

test("shows hearing date, client/opposing party, preparation notes, stage, and balance", () => {
  render(<CaseCard record={{
    id: "case-1", advocate_id: "advocate-1", client_id: "client-1", cnr_number: "ABCDEF0123456789",
    case_number: "CS/22/2026", court_name: "Delhi High Court", court_room: "4", judge_name: "Justice Rao",
    petitioner: "Nisha Kapoor", respondent: "Ravi Mehta", case_type: "Civil", stage: "Arguments",
    next_hearing_date: "2026-11-10", agreed_fee: "50000.00", preparation_notes: "Review witness statements", created_at: "2026-10-06T00:00:00Z",
  }} clientName="Nisha Kapoor" pendingBalance="37500.00" />);
  expect(screen.getByText("10 Nov 2026")).toBeInTheDocument();
  expect(screen.getByText("Client: Nisha Kapoor · Other party: Ravi Mehta")).toBeInTheDocument();
  expect(screen.getByText("Review witness statements")).toBeInTheDocument();
  expect(screen.getByText("Arguments")).toBeInTheDocument();
  expect(screen.getByText(/₹37,500 due/)).toBeInTheDocument();
});
