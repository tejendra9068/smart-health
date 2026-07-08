"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Activity, Building2, Package, LayoutDashboard, ShieldPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Facilities', href: '/facilities', icon: Building2 },
  { name: 'Stock', href: '/stock', icon: Package },
  { name: 'Alerts', href: '/alerts', icon: Activity },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-card border-r border-border text-card-foreground min-h-screen flex flex-col shadow-sm">
      <div className="p-6 flex items-center gap-3">
        <ShieldPlus className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">Smart Health</h1>
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mt-1">Command Center</p>
        </div>
      </div>
      <nav className="flex-1 px-4 space-y-2 mt-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
                  : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="p-6 border-t border-border mt-auto">
        <div className="bg-accent/50 rounded-lg p-4 text-center">
          <p className="text-xs text-muted-foreground font-medium">System Status</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-sm font-semibold text-green-500">All Systems Operational</span>
          </div>
        </div>
      </div>
    </div>
  );
}
