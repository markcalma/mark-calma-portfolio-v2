import Link from 'next/link';
import { Demo } from '@/data/demos';
import { StackTag } from './StackTag';

interface DemoCardProps {
  demo: Demo;
}

export function DemoCard({ demo }: DemoCardProps) {
  return (
    <Link
      href={`/demo/${demo.slug}`}
      className="block bg-surface border border-border rounded-xl p-6 hover:border-accent hover:shadow-lg transition-all group"
    >
      <div className="mb-3">
        <span className="font-mono text-xs text-muted">Demo {demo.number}</span>
      </div>
      <h2 className="text-lg font-semibold text-primary mb-2 group-hover:text-accent transition-colors">
        {demo.title}
      </h2>
      <p className="text-secondary text-sm mb-4 leading-relaxed">
        {demo.tagline}
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        {demo.stack.map(tool => (
          <StackTag key={tool} name={tool} />
        ))}
      </div>
      <div className="text-accent text-sm font-medium">
        View demo →
      </div>
    </Link>
  );
}
