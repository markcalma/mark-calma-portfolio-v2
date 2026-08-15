import { notFound } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { VideoEmbed } from '@/components/VideoEmbed';
import { HowItWorks } from '@/components/HowItWorks';
import { WorkflowDiagram } from '@/components/WorkflowDiagram';
import { StackTag } from '@/components/StackTag';
import { CTAButton } from '@/components/CTAButton';
import { demos, getDemoBySlug } from '@/data/demos';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return demos.map(d => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const demo = getDemoBySlug(slug);
  if (!demo) return {};
  return {
    title: `${demo.title} | Mark Calma`,
    description: demo.pain,
  };
}

export default async function DemoPage({ params }: PageProps) {
  const { slug } = await params;
  const demo = getDemoBySlug(slug);
  if (!demo) notFound();

  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-3xl mx-auto px-6 py-16 space-y-16">
        <div>
          <p className="font-mono text-accent text-xs mb-3">Demo {demo.number}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            {demo.title}
          </h1>
          <p className="text-xl text-secondary mb-6">{demo.tagline}</p>
          <div className="flex flex-wrap gap-2">
            {demo.stack.map(tool => (
              <StackTag key={tool} name={tool} />
            ))}
          </div>
        </div>

        <VideoEmbed videoId={demo.videoId} title={demo.title} />

        <div className="bg-surface border border-border rounded-xl p-6">
          <p className="text-secondary leading-relaxed">{demo.pain}</p>
        </div>

        <HowItWorks steps={demo.steps} />

        <WorkflowDiagram slug={demo.slug} title={demo.title} />

        <div className="border-t border-border pt-12 text-center">
          <p className="text-secondary mb-6">Want this built for your agency?</p>
          <CTAButton label="Book a free 15-min automation audit →" />
        </div>
      </main>
    </div>
  );
}
