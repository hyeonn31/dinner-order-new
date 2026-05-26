import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { UtensilsCrossed } from "lucide-react";

const navItems = [
  { href: "/", label: "홈" },
  { href: "/order", label: "식사 신청" },
  { href: "/summary", label: "주문 취합" },
  { href: "/admin", label: "관리자" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <header className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
        <div className="container">
          <div className="flex items-center h-14 gap-6">
            <Link href="/" className="flex items-center gap-2 font-black text-lg tracking-tight shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
              <span>저녁식사 신청</span>
            </Link>
            <nav className="flex items-center gap-1 overflow-x-auto">
              {navItems.map((item) => {
                const isActive =
                  item.href === "/"
                    ? location === "/"
                    : location.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        <div className="container py-6">{children}</div>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-border bg-muted/50 py-3 text-center text-xs text-muted-foreground">
        저녁식사 신청 시스템 &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
