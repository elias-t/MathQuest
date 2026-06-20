import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="text-sm text-ink-muted mb-6">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1">/</span>}
          {item.to && i < items.length - 1 ? (
            <Link to={item.to}>{item.label}</Link>
          ) : (
            <span className="font-bold text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
