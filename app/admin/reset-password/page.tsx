import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return <main><h1>Choose a new admin password</h1>
    <ResetPasswordForm />
    <p><Link href="/admin">Return to admin sign-in</Link></p>
  </main>;
}
