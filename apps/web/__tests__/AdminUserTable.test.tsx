import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { AdminUserTable } from "@/components/AdminUserTable";
import { server } from "../test/server";

const pendingUser = { id: "user-1", full_name: "Nisha Kapoor", phone: "+919876543210", email: "nisha@example.test", role: "ADVOCATE", status: "PENDING_APPROVAL" as const, created_at: "2026-10-06T10:00:00Z" };

test("approves, rejects, and resets a user password", async () => {
  const user = userEvent.setup();
  let currentStatus = "PENDING_APPROVAL";
  server.use(
    http.get("http://localhost/api/backend/admin/users", () => HttpResponse.json([{ ...pendingUser, status: currentStatus } ])),
    http.put("http://localhost/api/backend/admin/users/:id/status", async ({ request }) => {
      const body = await request.json() as { status: string };
      currentStatus = body.status;
      return HttpResponse.json({ ...pendingUser, status: currentStatus });
    }),
    http.post("http://localhost/api/backend/admin/users/:id/reset-password", () => HttpResponse.json({ temporary_password: "once-only-temp" })),
  );
  render(<AdminUserTable />);
  expect(await screen.findByText("Pending approval")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Reject Nisha Kapoor" }));
  await waitFor(() => expect(screen.getByText("Rejected")).toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: "Approve Nisha Kapoor" }));
  await waitFor(() => expect(screen.getByText("Approved")).toBeInTheDocument());
  await user.click(screen.getByRole("button", { name: "Reset password for Nisha Kapoor" }));
  expect(await screen.findByText("once-only-temp")).toBeInTheDocument();
});
