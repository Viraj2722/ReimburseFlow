import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect the user from the root path to the main dashboard.
  redirect('/dashboard');
  return null;
}
