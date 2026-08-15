import Link from 'next/link';
import { CTAButton } from './CTAButton';
import { AUTHOR_NAME } from '@/data/config';

export function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
      <Link href="/" className="text-primary font-semibold text-sm">
        {AUTHOR_NAME} <span className="text-muted">· Automation</span>
      </Link>
      <CTAButton label="Book a call" className="text-sm px-4 py-2" />
    </nav>
  );
}
