import { CALENDLY_URL } from '@/data/config';

interface CTAButtonProps {
  label?: string;
  className?: string;
}

export function CTAButton({ label = 'Book a free 15-min call →', className = '' }: CTAButtonProps) {
  return (
    <a
      href={CALENDLY_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-block bg-accent hover:bg-accent-hover text-white font-semibold px-6 py-3 rounded-lg transition-colors ${className}`}
    >
      {label}
    </a>
  );
}
