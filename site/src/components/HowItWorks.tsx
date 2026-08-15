import { DemoStep } from '@/data/demos';

interface HowItWorksProps {
  steps: DemoStep[];
}

export function HowItWorks({ steps }: HowItWorksProps) {
  return (
    <div>
      <p className="font-mono text-muted text-xs uppercase tracking-widest mb-6">
        How it works
      </p>
      <ol className="space-y-4">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-4">
            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center mt-0.5">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold text-primary text-sm">{step.label}</p>
              <p className="text-secondary text-sm mt-0.5">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
