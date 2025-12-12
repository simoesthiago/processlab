'use client';

import { redirect } from 'next/navigation';

export default function SettingsRedirectPage() {
  redirect('/spaces/private');
}

