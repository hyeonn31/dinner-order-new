import { Link, useLocation } from "wouter";
import { UtensilsCrossed, Settings, BarChart3, Users, History, LogOut, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useAppAuth } from "@/contexts/AuthContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

// 일반 회원 메뉴
const userNavItems = [
  { path: "/order", label: "저녁 신청", icon: UtensilsCrossed },
  { path: "/employee-detail", label: "직원별 상세", icon: Users },
];

// 관리자 전용 추가 메뉴
const adminNavItems = [
  { path: "/admin", label: "메뉴선정", icon: Settings },
  { path: "/summary", label: "주문 취합", icon: BarChart3 },
  { path: "/history", label: "주문 이력", icon: History },
];

const adminManageItems = [
  { path: "/employee-manage", label: "직원 관리" },
  { path: "/restaurant-manage", label: "식당/메뉴 관리" },
  { path: "/account-manage", label: "계정 관리" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const [showManageMenu, setShowManageMenu] = useState(false);
  const { user, isAdmin, refetch } = useAppAuth();

  const logoutMutation = trpc.account.logout.useMutation({
    onSuccess: async () => {
      await refetch();
      toast.success("로그아웃 되었습니다.");
      setLocation("/");
    },
  });

  const navItems = isAdmin
    ? [...userNavItems, ...adminNavItems]
    : userNavItems;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "oklch(0.97 0.01 250)" }}>
      {/* Header */}
      <header style={{ background: "oklch(0.35 0.08 250)" }} className="sticky top-0 z-50 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/home" className="flex items-center gap-5 group">
              <img src="/manus-storage/Logo_White_22c5f440.png" alt="ABLE Logo" className="h-10 shrink-0" />
              <div>
                <div className="font-semibold text-white text-sm tracking-wide" style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
                  Dinner Order
                </div>
                <div className="text-xs" style={{ color: "oklch(0.70 0.05 250)" }}>저녁식사 신청 시스템</div>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map(({ path, label, icon: Icon }) => {
                const isActive = location === path;
                return (
                  <Link key={path} href={path}>
                    <button
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "text-white"
                          : "text-white/60 hover:text-white/90 hover:bg-white/5"
                      )}
                      style={isActive ? {
                        background: "oklch(0.55 0.18 250 / 0.2)",
                        border: "1px solid oklch(0.55 0.18 250 / 0.35)",
                        color: "oklch(0.85 0.15 250)"
                      } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  </Link>
                );
              })}

              {/* 관리자 전용: 관리 드롭다운 */}
              {isAdmin && (
                <div className="relative" onMouseEnter={() => setShowManageMenu(true)} onMouseLeave={() => setShowManageMenu(false)}>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white/60 hover:text-white/90 hover:bg-white/5 transition-all duration-200">
                    <UserCog className="w-4 h-4" />
                    <span className="hidden sm:inline">관리</span>
                  </button>
                  {showManageMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50">
                      {adminManageItems.map(({ path, label }) => (
                        <Link key={path} href={path}>
                          <div className="px-4 py-3 hover:bg-blue-50 text-gray-800 text-sm cursor-pointer first:rounded-t-lg last:rounded-b-lg border-b last:border-b-0 border-gray-100">
                            {label}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 사용자 정보 + 로그아웃 */}
              {user && (
                <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/20">
                  <span className="text-xs text-white/70 hidden sm:inline">
                    {user.nickname}
                    {isAdmin && <span className="ml-1 text-yellow-300 text-xs">(관리자)</span>}
                  </span>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md text-white/60 hover:text-white hover:bg-white/10 transition-all text-xs"
                    title="로그아웃"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">로그아웃</span>
                  </button>
                </div>
              )}
            </nav>
          </div>
        </div>

        {/* Blue accent line */}
        <div style={{ background: "linear-gradient(90deg, transparent, oklch(0.55 0.18 250 / 0.6), transparent)", height: "1px" }} />
      </header>

      {/* Main */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs" style={{ color: "oklch(0.50 0.03 250)", borderTop: "1px solid oklch(0.90 0.01 250)" }}>
        저녁식사 신청 시스템 &mdash; 매일 오후 4시~6시 운영
      </footer>
    </div>
  );
}
