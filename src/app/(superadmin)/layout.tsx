import { redirect } from 'next/navigation'

// Super-admin is not used in standalone mode. Redirect to dashboard.
export default function SuperAdminLayout() {
  redirect('/dashboard')
}
