import Link from "next/link";
import { AuthLayout } from "@/components/AuthLayout";
import { SignupForm } from "@/components/SignupForm";

export default function SignupPage() {
  return <AuthLayout eyebrow="CHAMBERS REGISTRATION" title="Request an account" description="Create your advocate profile. Portal access begins after administrator approval." footer={<>Already registered? <Link href="/login">Sign in</Link></>}>
    <SignupForm />
  </AuthLayout>;
}
