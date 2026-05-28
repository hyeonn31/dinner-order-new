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
    <div className="min-h-screen flex flex-col" style={{ background: "transparent" }}>
      {/* 전체 어두운 오버레이 */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "linear-gradient(160deg, rgba(8,12,35,0.60) 0%, rgba(15,8,40,0.52) 100%)", zIndex: 0 }}
      />

      {/* Header */}
      <header
        className="sticky top-0 z-50 shadow-lg"
        style={{
          background: "rgba(15,20,55,0.55)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          borderBottom: "1px solid rgba(120,140,255,0.20)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/home" className="flex items-center gap-3 group">
              <img src="/manus-storage/Logo_White_22c5f440.png" alt="ABLE Logo" className="h-9 shrink-0 drop-shadow" />
              <div className="hidden sm:block">
                <div className="font-semibold text-white text-sm tracking-wide" style={{ fontFamily: "'Noto Sans KR', sans-serif", fontWeight: 600 }}>
                  Dinner Order
                </div>
                <div className="text-xs" style={{ color: "rgba(180,200,255,0.65)" }}>저녁식사 신청 시스템</div>
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
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "text-white"
                          : "text-white/55 hover:text-white/90 hover:bg-white/8"
                      )}
                      style={isActive ? {
                        background: "rgba(120,140,255,0.22)",
                        border: "1px solid rgba(150,170,255,0.35)",
                        color: "rgba(200,215,255,1)",
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
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white/55 hover:text-white/90 hover:bg-white/8 transition-all duration-200"
                  >
                    <UserCog className="w-4 h-4" />
                    <span className="hidden sm:inline">관리</span>
                  </button>
                  {showManageMenu && (
                    <div
                      className="absolute right-0 mt-1 w-48 rounded-xl shadow-2xl z-50 overflow-hidden"
                      style={{
                        background: "rgba(20,25,65,0.85)",
                        backdropFilter: "blur(20px)",
                        WebkitBackdropFilter: "blur(20px)",
                        border: "1px solid rgba(150,170,255,0.25)",
                      }}
                    >
                      {adminManageItems.map(({ path, label }) => (
                        <Link key={path} href={path}>
                          <div
                            className="px-4 py-3 text-sm cursor-pointer transition-colors"
                            style={{ color: "rgba(200,215,255,0.9)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(120,140,255,0.18)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
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
                <div className="flex items-center gap-2 ml-2 pl-2" style={{ borderLeft: "1px solid rgba(255,255,255,0.15)" }}>
                  <span className="text-xs hidden sm:inline" style={{ color: "rgba(180,200,255,0.75)" }}>
                    {user.nickname}
                    {isAdmin && <span className="ml-1 text-yellow-300 text-xs">(관리자)</span>}
                  </span>
                  <button
                    onClick={() => logoutMutation.mutate()}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-md transition-all text-xs"
                    style={{ color: "rgba(180,200,255,0.65)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "white";
                      e.currentTarget.style.background = "rgba(255,255,255,0.10)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(180,200,255,0.65)";
                      e.currentTarget.style.background = "transparent";
                    }}
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
        {/* 하단 글로우 라인 */}
        <div style={{ background: "linear-gradient(90deg, transparent, rgba(150,170,255,0.4), transparent)", height: "1px" }} />
      </header>

      {/* Main */}
      <main className="flex-1 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer
        className="relative z-10 py-4 text-center text-xs"
        style={{ color: "rgba(180,200,255,0.45)", borderTop: "1px solid rgba(255,255,255,0.08)" }}
      >
        저녁식사 신청 시스템 &mdash; 매일 오후 5시~6시 운영
      </footer>
    </div>
  );
}
