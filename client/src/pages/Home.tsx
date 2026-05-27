import { Link } from "wouter";
import { UtensilsCrossed, Settings, BarChart3, ArrowRight, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const { data: todayRestaurants } = trpc.daily.todayRestaurants.useQuery();
  const { data: orders } = trpc.order.todayAll.useQuery();

  const hasSetup = todayRestaurants && todayRestaurants.length > 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
          style={{
            background: "rgba(255,255,255,0.12)",
            color: "rgba(200,215,255,0.9)",
            border: "1px solid rgba(255,255,255,0.20)",
          }}
        >
          <Clock className="w-4 h-4" />
          매일 오후 5시 ~ 6시 운영
        </div>
        <h1 className="text-4xl font-bold mb-3" style={{ color: "white", textShadow: "0 2px 16px rgba(0,0,0,0.5)" }}>
          저녁식사 신청 시스템
        </h1>
      </div>

      {/* Status Card */}
      <div
        className="rounded-2xl p-6 mb-8 text-center"
        style={{
          background: hasSetup ? "rgba(60,180,120,0.18)" : "rgba(255,255,255,0.10)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: `1px solid ${hasSetup ? "rgba(80,200,140,0.35)" : "rgba(255,255,255,0.18)"}`,
        }}
      >
        {hasSetup ? (
          <>
            <div className="text-sm font-medium mb-2" style={{ color: "rgba(120,230,170,1)" }}>
              오늘의 식당이 설정되었습니다
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {todayRestaurants.map(r => (
                <span
                  key={r.restaurantId}
                  className="px-3 py-1 rounded-full text-sm font-medium"
                  style={{ background: "rgba(120,140,255,0.30)", color: "rgba(200,215,255,1)" }}
                >
                  {r.restaurantName}
                </span>
              ))}
            </div>
            {orders && orders.length > 0 && (
              <div className="mt-3 text-sm" style={{ color: "rgba(120,230,170,0.85)" }}>
                현재 <strong>{orders.length}명</strong>이 신청 완료
              </div>
            )}
          </>
        ) : (
          <div className="text-sm" style={{ color: "rgba(180,200,255,0.75)" }}>
            아직 오늘의 식당이 설정되지 않았습니다. 관리자 페이지에서 식당을 선택해 주세요.
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            href: "/order",
            icon: <UtensilsCrossed className="w-6 h-6" style={{ color: "rgba(150,200,255,1)" }} />,
            iconBg: "rgba(80,120,255,0.30)",
            title: "저녁 신청",
            desc: "메뉴를 선택하고 신청하세요",
            cta: "신청하기",
          },
          {
            href: "/admin",
            icon: <Settings className="w-6 h-6" style={{ color: "rgba(200,160,255,1)" }} />,
            iconBg: "rgba(150,80,255,0.30)",
            title: "관리자",
            desc: "오늘의 식당을 설정하세요",
            cta: "설정하기",
          },
          {
            href: "/summary",
            icon: <BarChart3 className="w-6 h-6" style={{ color: "rgba(120,230,170,1)" }} />,
            iconBg: "rgba(40,180,100,0.30)",
            title: "주문 취합",
            desc: "신청 현황을 확인하세요",
            cta: "확인하기",
          },
        ].map(({ href, icon, iconBg, title, desc, cta }) => (
          <Link key={href} href={href}>
            <div
              className="group rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1"
              style={{
                background: "rgba(255,255,255,0.10)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.16)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.25)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.10)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 20px rgba(0,0,0,0.15)";
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: iconBg }}
              >
                {icon}
              </div>
              <h3 className="font-semibold text-base mb-1" style={{ color: "white" }}>{title}</h3>
              <p className="text-sm mb-4" style={{ color: "rgba(180,200,255,0.70)" }}>{desc}</p>
              <div className="flex items-center gap-1 text-sm font-medium" style={{ color: "rgba(150,170,255,1)" }}>
                {cta} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
