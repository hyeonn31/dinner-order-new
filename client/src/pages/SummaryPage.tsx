import { useState } from "react";
import {
  formatMenuDisplayWithCount,
  groupIdenticalMenuOrders,
} from "@shared/formatOrderMenu";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Copy, RefreshCw, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const glassCard = {
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "1rem",
} as React.CSSProperties;

export default function SummaryPage() {
  const utils = trpc.useUtils();
  const { data: orders, isLoading: ordersLoading } = trpc.order.todayAll.useQuery(undefined, { refetchInterval: 30000 });
  const { data: todayRestaurants } = trpc.daily.todayRestaurants.useQuery(undefined, { refetchInterval: 60000 });
  const [expandedRestaurants, setExpandedRestaurants] = useState<Set<string>>(new Set());

  const handleRefresh = () => {
    utils.order.todayAll.invalidate();
    toast.success("새로고침 완료!");
  };

  const toggleExpand = (name: string) => {
    setExpandedRestaurants(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const generateCopyText = () => {
    if (!orders || orders.length === 0) return "신청 내역이 없습니다.";
    const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
    const lines: string[] = [`📋 저녁식사 주문 취합 (${today})`, ""];

    const groupedByRestaurant = new Map<string, { orders: NonNullable<typeof orders>; zeroCokCount: number }>();
    for (const order of orders) {
      if (!groupedByRestaurant.has(order.restaurantName)) {
        groupedByRestaurant.set(order.restaurantName, { orders: [], zeroCokCount: 0 });
      }
      const group = groupedByRestaurant.get(order.restaurantName)!;
      group.orders.push(order);
      if (order.drinkOption === "제로콜라") group.zeroCokCount++;
    }

    groupedByRestaurant.forEach((group, restaurant) => {
      lines.push(`▶ ${restaurant} (제로콜라 ${group.zeroCokCount}개)`);
      for (const { menu, count } of groupIdenticalMenuOrders(group.orders)) {
        lines.push(`  • ${formatMenuDisplayWithCount(menu, count)}`);
      }
      lines.push("");
    });

    lines.push(`총 신청 인원: ${orders.length}명`);
    const updatedOrders = orders.filter(o => (o as any).isUpdated);
    if (updatedOrders.length > 0) {
      lines.push("", "[수정 사항]");
      for (const order of updatedOrders) {
        const oldMenu = (order as any).oldMenu || "알 수 없음";
        const newMenu = (order as any).newMenu || "알 수 없음";
        lines.push(`  • ${order.employeeNickname}: ${oldMenu} → ${newMenu}`);
      }
    }
    return lines.join("\n");
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(generateCopyText())
      .then(() => toast.success("클립보드에 복사되었습니다!"))
      .catch(() => toast.error("복사에 실패했습니다."));
  };

  const handleCopyRestaurant = (restaurantName: string, items: string[], zeroCokCount: number) => {
    const lines = [`▶ ${restaurantName} (제로콜라 ${zeroCokCount}개)`, ...items.map(i => `  • ${i}`)];
    navigator.clipboard.writeText(lines.join("\n"))
      .then(() => toast.success(`${restaurantName} 주문이 복사되었습니다!`))
      .catch(() => toast.error("복사에 실패했습니다."));
  };

  const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });
  const groupedByRestaurant = new Map<string, typeof orders>();
  if (orders) {
    for (const order of orders) {
      if (!groupedByRestaurant.has(order.restaurantName)) groupedByRestaurant.set(order.restaurantName, []);
      groupedByRestaurant.get(order.restaurantName)!.push(order);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            주문 취합
          </h1>
          <div className="text-sm" style={{ color: "rgba(180,200,255,0.75)" }}>
            {today} &mdash; 실시간 신청 현황
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="gap-2 border-0"
            style={{ background: "rgba(255,255,255,0.12)", color: "rgba(200,215,255,0.9)" }}
          >
            <RefreshCw className="w-4 h-4" />새로고침
          </Button>
          <Button
            size="sm"
            onClick={handleCopyAll}
            disabled={!orders || orders.length === 0}
            className="gap-2 border-0"
            style={{ background: "rgba(120,140,255,0.35)", color: "rgba(220,230,255,1)" }}
          >
            <Copy className="w-4 h-4" />전체 복사
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <StatCard label="총 신청 인원" value={orders?.length ?? 0} unit="명" accent="rgba(150,170,255,1)" />
        <StatCard label="오늘의 식당" value={todayRestaurants?.length ?? 0} unit="곳" accent="rgba(120,200,255,1)" />
        <StatCard label="식당별 주문" value={groupedByRestaurant.size} unit="건" accent="rgba(160,220,200,1)" />
        <StatCard label="메뉴 종류" value={orders?.length ?? 0} unit="가지" accent="rgba(180,230,160,1)" />
        <StatCard label="제로콜라" value={orders?.filter(o => o.drinkOption === "제로콜라").length ?? 0} unit="개" accent="rgba(200,160,255,1)" />
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="mb-6" style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <TabsTrigger value="summary" className="data-[state=active]:text-white" style={{ color: "rgba(180,200,255,0.7)" }}>주문 취합</TabsTrigger>
          <TabsTrigger value="text" className="data-[state=active]:text-white" style={{ color: "rgba(180,200,255,0.7)" }}>복사용 텍스트</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          {ordersLoading ? (
            <LoadingState />
          ) : !orders || orders.length === 0 ? (
            <EmptyState message="아직 신청 내역이 없습니다." />
          ) : (
            <div className="space-y-4">
              {Array.from(groupedByRestaurant.entries()).map(([restaurant, restaurantOrders]) => {
                const isExpanded = expandedRestaurants.has(restaurant);
                const totalCount = restaurantOrders?.length ?? 0;
                const zeroCokCount = (restaurantOrders ?? []).filter(o => o.drinkOption === "제로콜라").length;
                const items = groupIdenticalMenuOrders(restaurantOrders ?? []).map(({ menu, count }) =>
                  formatMenuDisplayWithCount(menu, count)
                );

                return (
                  <div key={restaurant} style={{ ...glassCard, overflow: "hidden" }}>
                    <div
                      className="flex items-center justify-between p-5 cursor-pointer"
                      style={{ borderBottom: isExpanded ? "1px solid rgba(255,255,255,0.10)" : "none" }}
                      onClick={() => toggleExpand(restaurant)}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(120,140,255,0.30)" }}
                        >
                          <span className="text-sm font-bold" style={{ color: "rgba(200,215,255,1)" }}>{totalCount}</span>
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: "white" }}>{restaurant}</div>
                          <div className="text-xs" style={{ color: "rgba(180,200,255,0.65)" }}>
                            {totalCount}명 · 제로콜라 {zeroCokCount}개
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs h-8 border-0"
                          style={{ background: "rgba(255,255,255,0.12)", color: "rgba(200,215,255,0.9)" }}
                          onClick={e => { e.stopPropagation(); handleCopyRestaurant(restaurant, items, zeroCokCount); }}
                        >
                          <Copy className="w-3 h-3" />복사
                        </Button>
                        {isExpanded
                          ? <ChevronUp className="w-4 h-4" style={{ color: "rgba(180,200,255,0.6)" }} />
                          : <ChevronDown className="w-4 h-4" style={{ color: "rgba(180,200,255,0.6)" }} />
                        }
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-5 space-y-2">
                        {items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center py-2 px-3 rounded-lg"
                            style={{ background: "rgba(255,255,255,0.08)" }}
                          >
                            <span className="text-sm" style={{ color: "rgba(220,230,255,0.9)" }}>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="text">
          {ordersLoading ? (
            <LoadingState />
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl p-5" style={{ background: "rgba(120,140,255,0.25)", border: "1px solid rgba(150,170,255,0.30)" }}>
                <div className="text-lg font-semibold" style={{ color: "rgba(220,230,255,1)" }}>
                  제로콜라 총 개수: {orders?.filter(o => o.drinkOption === "제로콜라").length ?? 0}개
                </div>
              </div>
              <div className="rounded-xl p-6" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}>
                <pre className="text-xs whitespace-pre-wrap break-words font-mono" style={{ color: "rgba(200,215,255,0.9)" }}>
                  {generateCopyText()}
                </pre>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ label, value, unit, accent }: { label: string; value: number; unit: string; accent: string }) {
  return (
    <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
      <div className="text-xs font-medium mb-2" style={{ color: "rgba(180,200,255,0.65)" }}>{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold" style={{ color: accent }}>{value}</span>
        <span className="text-xs" style={{ color: "rgba(180,200,255,0.55)" }}>{unit}</span>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-transparent mx-auto mb-4"
          style={{ borderTopColor: "rgba(150,170,255,0.8)", animation: "spin 1s linear infinite" }} />
        <div style={{ color: "rgba(180,200,255,0.65)" }}>로딩 중...</div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(150,170,255,0.6)" }} />
        <div style={{ color: "rgba(180,200,255,0.65)" }}>{message}</div>
      </div>
    </div>
  );
}
