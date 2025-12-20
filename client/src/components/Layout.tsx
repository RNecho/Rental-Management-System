import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Package, 
  Briefcase, 
  Truck, 
  Wrench,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import clsx from "clsx";

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/clients", label: "Clients & Projects", icon: Briefcase },
  { href: "/movements", label: "Movements", icon: Truck },
  { href: "/maintenance", label: "Maintenance", icon: Wrench },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-slate-900 text-white shadow-2xl">
        <div className="flex h-16 items-center px-6 border-b border-slate-800">
          <Truck className="h-6 w-6 text-amber-500 mr-2" />
          <span className="text-xl font-display font-bold tracking-wider">EQUIP<span className="text-amber-500">MGR</span></span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-6">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={clsx(
              "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200",
              location === item.href 
                ? "bg-slate-800 text-amber-400 shadow-md translate-x-1" 
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}>
              <item.icon className={clsx(
                "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                location === item.href ? "text-amber-400" : "text-slate-400 group-hover:text-white"
              )} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center font-mono">
          v1.0.0 • SYSTEM ACTIVE
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white z-40 flex items-center justify-between px-4 shadow-md">
        <div className="flex items-center">
          <Truck className="h-6 w-6 text-amber-500 mr-2" />
          <span className="text-xl font-display font-bold">EQUIPMGR</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-300">
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-900 pt-16 px-4 pb-4 animate-in slide-in-from-top-10 fade-in duration-200">
          <nav className="space-y-2 mt-4">
            {NAV_ITEMS.map((item) => (
              <Link 
                key={item.href} 
                href={item.href} 
                onClick={() => setMobileMenuOpen(false)}
                className={clsx(
                  "flex items-center px-4 py-4 text-base font-medium rounded-lg border",
                  location === item.href 
                    ? "bg-slate-800 border-amber-500/30 text-amber-400" 
                    : "border-transparent text-slate-300 hover:bg-slate-800"
                )}
              >
                <item.icon className="mr-3 h-6 w-6 text-slate-400" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className={clsx(
        "flex-1 md:pl-64 pt-16 md:pt-0 transition-all duration-300",
        mobileMenuOpen ? "overflow-hidden" : ""
      )}>
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
