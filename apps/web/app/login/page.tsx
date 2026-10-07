import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { LoginForm } from "@/components/LoginForm";

export default function LoginPage() {
  return <AuthLayout eyebrow="SECURE CHAMBERS ACCESS" title="Welcome back" description="Sign in with your registered mobile number." footer={<>Need a chambers account? <Link href="/signup">Request approval</Link></>}>
    <LoginForm />
  </AuthLayout>;
}
