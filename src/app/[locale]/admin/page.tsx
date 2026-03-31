import { redirect } from 'next/navigation';

export default function AdminDashboard({
  params,
}: {
  params: { locale: string };
}) {
  redirect(`/${params.locale}/admin/inquiries`);
}
