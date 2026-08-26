import { ModuleCard } from '@/components/dashboard/ModuleCard';

const MODULES = [
  {
    name: 'Recruitment Pipeline',
    description: 'AI resume screening, candidate scoring, and automated interview scheduling for staffing agencies.',
    icon: '👥',
    href: '/recruitment',
    status: 'active' as const,
  },
  {
    name: 'Freight & Logistics',
    description: 'Container tracking, per diem alerts, carrier invoice validation, and dispatch automation.',
    icon: '🚢',
    href: '/freight',
    status: 'coming-soon' as const,
  },
  {
    name: 'Ecommerce Operations',
    description: 'Order management, inventory alerts, shipping delay detection, and supplier invoice validation.',
    icon: '🛍️',
    href: '/ecommerce',
    status: 'coming-soon' as const,
  },
  {
    name: 'Property Management',
    description: 'Lease expiry tracking, maintenance automation, rent payment monitoring, and tenant communication.',
    icon: '🏠',
    href: '/property',
    status: 'coming-soon' as const,
  },
  {
    name: 'Clinic Operations',
    description: 'Appointment no-show prediction, insurance verification, automated reminders, and review requests.',
    icon: '🏥',
    href: '/clinic',
    status: 'coming-soon' as const,
  },
  {
    name: 'Field Services',
    description: 'Job site tracking, crew assignments, material delivery monitoring, and client progress updates.',
    icon: '🔧',
    href: '/field',
    status: 'coming-soon' as const,
  },
  {
    name: 'Restaurant Supply Chain',
    description: 'Inventory level tracking, stockout prediction, automated purchase orders, and supplier performance.',
    icon: '🍽️',
    href: '/restaurant',
    status: 'coming-soon' as const,
  },
  {
    name: 'Campaign Operations',
    description: 'Budget pacing alerts, performance anomaly detection, automated client reports, and deadline tracking.',
    icon: '📊',
    href: '/campaigns',
    status: 'coming-soon' as const,
  },
  {
    name: 'Legal Matter Tracking',
    description: 'Deadline monitoring, automated client updates, document request tracking, and billing alerts.',
    icon: '⚖️',
    href: '/legal',
    status: 'coming-soon' as const,
  },
  {
    name: 'Purchase Order Monitor',
    description: 'Open PO tracking, supplier delay detection, automatic follow-ups, and invoice matching.',
    icon: '📦',
    href: '/purchase-orders',
    status: 'coming-soon' as const,
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen px-6 py-10 max-w-6xl mx-auto">
      <div className="mb-10">
        <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>
          OpsCore
        </p>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Operations Command Center
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Select an industry module to view your automated operations dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map(module => (
          <ModuleCard key={module.href} {...module} />
        ))}
      </div>

      <p className="text-xs mt-10 text-center" style={{ color: 'var(--color-text-muted)' }}>
        Built by Mark Calma - Automation Agency
      </p>
    </div>
  );
}
