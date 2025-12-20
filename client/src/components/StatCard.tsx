import clsx from "clsx";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  color?: "default" | "warning" | "success" | "danger";
}

export function StatCard({ title, value, icon: Icon, trend, color = "default" }: StatCardProps) {
  const colorStyles = {
    default: "bg-white text-slate-900 border-slate-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
    success: "bg-emerald-50 text-emerald-900 border-emerald-200",
    danger: "bg-rose-50 text-rose-900 border-rose-200",
  };

  const iconStyles = {
    default: "bg-slate-100 text-slate-600",
    warning: "bg-amber-100 text-amber-600",
    success: "bg-emerald-100 text-emerald-600",
    danger: "bg-rose-100 text-rose-600",
  };

  return (
    <div className={clsx(
      "rounded-2xl p-6 border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1",
      colorStyles[color]
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-70 mb-1">{title}</p>
          <h3 className="text-3xl font-display font-bold tracking-tight">{value}</h3>
          {trend && (
            <p className="text-xs mt-2 font-medium opacity-80">{trend}</p>
          )}
        </div>
        <div className={clsx("p-3 rounded-xl", iconStyles[color])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
