'use client';

import { redirect } from 'next/navigation';

export default function DashboardRedirectPage() {
  redirect('/spaces/private');
}
