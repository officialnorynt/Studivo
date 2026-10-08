'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { useAuth } from './AuthContext';

const ICONS = {
  home: <path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z" />,
  study: <><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></>,
  rank: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />,
  test: <><path d="M9 3h6l1 2h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3z" /><path d="M9 13l2 2 4-4" /></>,
  profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
};

function Icon({ name, size = 24 }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

const TABS = [
  { href: '/home', label: 'Home', icon: 'home' },
  { href: '/study', label: 'Study', icon: 'study' },
  { href: '/rank', label: 'Rank', icon: 'rank' },
  { href: '/profile', label: 'Profile', icon: 'profile' },
];

export default function Nav() {
  const { user } = useAuth();
  const pathname = usePathname();
  if (!user) return null;
  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <>
      <div className="mobilebar">Studivo</div>

      <div className="topnav">
        <Link href="/home" className="brand">Studivo</Link>
        <div className="links">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className={isActive(t.href) ? 'active' : ''}>
              <Icon name={t.icon} size={18} /> {t.label}
            </Link>
          ))}
          <Link href="/exam/build" className={isActive('/exam') ? 'active' : ''}><Icon name="test" size={18} /> New Test</Link>
          <Link href="/history" className={isActive('/history') ? 'active' : ''}>History</Link>
          <button className="btn-outline" onClick={() => signOut(auth)}>Sign Out</button>
        </div>
      </div>

      <div className="bottomnav">
        {TABS.map((t) => (
          <Link key={t.href} href={t.href} className={isActive(t.href) ? 'active' : ''}>
            <Icon name={t.icon} />
            <span>{t.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
