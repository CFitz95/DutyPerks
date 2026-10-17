'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  ['/explore', 'Find offers'], ['/plan', 'My trip'], ['/cruises', 'Cruises'],
  ['/install', 'Install app'], ['/feedback', 'Give feedback'],
] as const;
export default function MainNav() {
  const pathname = usePathname();
  return <nav aria-label="Main navigation">{links.map(([href, label]) =>
    <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>
  )}</nav>;
}
