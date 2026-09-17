import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
  title: string;
  description: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-slide-in">
      <div className="sap-card p-8 text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto mb-4">
          <Construction size={28} className="text-blue-600" />
        </div>
        <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--sapFontColor)' }}>
          {title}
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--sapContentLabelColor)' }}>
          {description}
        </p>
        <div className="sap-badge sap-badge-information">
          Module under development
        </div>
      </div>
    </div>
  );
}
