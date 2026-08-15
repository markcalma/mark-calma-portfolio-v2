'use client';
import Image from 'next/image';
import { useState } from 'react';

interface WorkflowDiagramProps {
  slug: string;
  title: string;
}

export function WorkflowDiagram({ slug, title }: WorkflowDiagramProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div>
      <p className="font-mono text-muted text-xs uppercase tracking-widest mb-6">
        Workflow
      </p>
      <div className="bg-surface border border-border rounded-xl p-4">
        {failed ? (
          <div className="aspect-video w-full flex items-center justify-center">
            <p className="text-muted font-mono text-sm">Workflow screenshot coming soon</p>
          </div>
        ) : (
          <Image
            src={`/workflows/${slug}.png`}
            alt={`${title} n8n workflow diagram`}
            width={1200}
            height={600}
            className="w-full rounded-lg"
            onError={() => setFailed(true)}
          />
        )}
      </div>
    </div>
  );
}
