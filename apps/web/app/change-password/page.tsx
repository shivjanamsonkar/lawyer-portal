import { AuthLayout } from "@/components/AuthLayout";
import { PasswordChangeForm } from "@/components/PasswordChangeForm";

export default function ChangePasswordPage() {
  return <AuthLayout eyebrow="ACCOUNT SECURITY" title="Choose a new password" description="Your temporary password must be replaced before opening the chambers portal." footer={<>Use at least 12 characters and keep it private.</>}>
    <PasswordChangeForm />
  </AuthLayout>;
}
