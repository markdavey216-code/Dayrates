"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, Calendar, Users, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Builder", href: "/builder", icon: FileText },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Tax", href: "/tax", icon: Receipt },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-background pb-safe px-2 pt-2 shadow-lg sm:hidden">
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} className={cn("mb-1", isActive && "stroke-[2.5px]")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
