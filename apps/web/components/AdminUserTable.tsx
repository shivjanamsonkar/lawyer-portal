"use client";

import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, ShieldOff, UserRoundX, UserRoundCheck } from "lucide-react";
import { listAdminUsers, resetUserPassword, updateUserStatus, type AccountStatus, type AdminUser } from "@/lib/api";

const statusLabels: Record<AccountStatus, string> = {
  PENDING_APPROVAL: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  DISABLED: "Disabled",
};

export function AdminUserTable({ initialUsers = [] }: { initialUsers?: AdminUser[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState<string | null>(null);
  const [temporaryCredential, setTemporaryCredential] = useState<{ name: string; password: string } | null>(null);

  useEffect(() => {
    let active = true;
    listAdminUsers().then((result) => { if (active) setUsers(result); }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Could not load registered users.");
    });
    return () => { active = false; };
  }, []);

  async function changeStatus(user: AdminUser, status: AccountStatus): Promise<void> {
    setError(null);
    try {
      const updated = await updateUserStatus(user.id, status);
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not update account status.");
    }
  }

  async function resetPassword(user: AdminUser): Promise<void> {
    setError(null);
    setTemporaryCredential(null);
    try {
      const result = await resetUserPassword(user.id);
      setTemporaryCredential({ name: user.full_name, password: result.temporary_password });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not reset password.");
    }
  }

  return <>
    {error && <p className="form-error" role="alert">{error}</p>}
    {temporaryCredential && <div className="temporary-credential" role="status"><div><strong>Temporary password for {temporaryCredential.name}</strong><span>This is shown once. The user must change it at next login.</span><code>{temporaryCredential.password}</code></div><button className="secondary-button" onClick={() => setTemporaryCredential(null)}>Dismiss</button></div>}
    <div className="admin-table-wrap"><table className="admin-user-table"><thead><tr><th>Name</th><th>Mobile</th><th>Status</th><th>Account actions</th></tr></thead><tbody>
      {users.map((user) => <tr key={user.id}>
        <td><strong>{user.full_name}</strong><small>{user.email}</small></td>
        <td>{user.phone}</td>
        <td><span className={`account-status status-${user.status.toLowerCase()}`}>{statusLabels[user.status]}</span></td>
        <td><div className="admin-actions">
          {user.status !== "APPROVED" && <button aria-label={`Approve ${user.full_name}`} title="Approve account" onClick={() => void changeStatus(user, "APPROVED")}><UserRoundCheck size={15} /></button>}
          {user.status === "PENDING_APPROVAL" && <button aria-label={`Reject ${user.full_name}`} title="Reject account" onClick={() => void changeStatus(user, "REJECTED")}><UserRoundX size={15} /></button>}
          {user.status === "APPROVED" && <button aria-label={`Disable ${user.full_name}`} title="Disable account" onClick={() => void changeStatus(user, "DISABLED")}><ShieldOff size={15} /></button>}
          <button aria-label={`Reset password for ${user.full_name}`} title="Force password reset" onClick={() => void resetPassword(user)}><KeyRound size={15} /></button>
        </div></td>
      </tr>)}
      {!users.length && <tr><td className="admin-empty" colSpan={4}><ShieldCheck size={18} />No registered accounts.</td></tr>}
    </tbody></table></div>
  </>;
}
