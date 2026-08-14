import { Link, useLocation } from "wouter";
import { ArrowLeft, Home, ChevronRight } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  breadcrumb?: { label: string; href?: string }[];
  right?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, backTo = "/dashboard", breadcrumb, right }: PageHeaderProps) {
  const [, navigate] = useLocation();

  return (
    <div className="mb-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 overflow-x-auto">
        <Link href={backTo} className="flex items-center gap-1 hover:text-gray-300 transition-colors shrink-0">
          <Home size={13} />
        </Link>
        {breadcrumb?.map((item, i) => (
          <span key={i} className="flex items-center gap-1.5 shrink-0">
            <ChevronRight size={12} />
            {item.href ? (
              <Link href={item.href} className="hover:text-gray-300 transition-colors">{item.label}</Link>
            ) : (
              <span className="text-gray-300">{item.label}</span>
            )}
          </span>
        ))}
      </div>

      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-white truncate">{title}</h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {right}
          <button
            onClick={() => navigate(backTo)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            <ArrowLeft size={13} />
            <span className="hidden sm:inline">Retour</span>
          </button>
        </div>
      </div>
    </div>
  );
}
