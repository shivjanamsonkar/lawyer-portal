"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logOut } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  async function logout(): Promise<void> {
    await logOut();
    router.replace("/login");
    router.refresh();
  }
  return <button className="module-logout" aria-label="Sign out" title="Sign out" onClick={() => void logout()}><LogOut size={15} /></button>;
}
