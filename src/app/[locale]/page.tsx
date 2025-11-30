import { redirect } from 'next/navigation';

/**
 * Root page redirects to landing page
 * The main app dashboard is at /dashboard
 */
export default function RootPage({ params }: { params: { locale: string } }) {
  redirect(`/${params.locale}/landing`);
}
