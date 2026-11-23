'use client';

import { usePathname } from 'next/navigation';

/** Renders its children everywhere except the admin dashboard, which has its own chrome. */
export default function HideOnAdmin({ children }) {
  return usePathname()?.startsWith('/admin') ? null : children;
}
