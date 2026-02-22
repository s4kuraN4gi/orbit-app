import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserSettings } from '@/app/actions/settings';
import { SettingsView } from '@/components/settings/SettingsView';

export const metadata: Metadata = {
  title: '設定 | Orbit',
  description: 'Orbitの設定を管理します',
};

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect('/login');
  }

  const settings = await getUserSettings();

  return (
    <div className="min-h-screen bg-background">
      <SettingsView initialSettings={settings} userEmail={session.user.email || ''} />
    </div>
  );
}
