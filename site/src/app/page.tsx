import { Nav } from '@/components/Nav';
import { DemoCard } from '@/components/DemoCard';
import { CTAButton } from '@/components/CTAButton';
import { demos } from '@/data/demos';
import { AUTHOR_NAME, SITE_TAGLINE, SITE_DESCRIPTION } from '@/data/config';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-4xl mx-auto px-6 py-16">
        <div className="mb-16">
          <p className="font-mono text-accent text-sm mb-4">{AUTHOR_NAME}</p>
          <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 leading-tight">
            {SITE_TAGLINE}
          </h1>
          <p className="text-secondary text-lg mb-8 max-w-xl">
            {SITE_DESCRIPTION}
          </p>
          <CTAButton label="Book a free 15-min automation audit →" />
        </div>

        <div>
          <p className="font-mono text-muted text-xs uppercase tracking-widest mb-6">
            Live Demos
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {demos.map(demo => (
              <DemoCard key={demo.slug} demo={demo} />
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border mt-24 py-12 px-6 text-center">
        <p className="text-muted text-sm mb-6">Ready to automate your agency?</p>
        <CTAButton />
      </footer>
    </div>
  );
}
