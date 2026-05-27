import { useMemo, useState } from "react";
import { formatOrderMenuDisplay } from "@shared/formatOrderMenu";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { RefreshCw, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function EmployeeDetailPage() {
  const utils = trpc.useUtils();
  const { data: orders, isLoading } = trpc.order.todayAll.useQuery(undefined, { refetchInterval: 30000 });
  const [searchQuery, setSearchQuery] = useState("");

  const handleRefresh = () => {
    utils.order.todayAll.invalidate();
    toast.success("새로고침 완료!");
  };

  const today = new Date().toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    const sorted = [...orders].sort((a, b) =>
      a.employeeNickname.localeCompare(b.employeeNickname, "ko")
    );
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(o => o.employeeNickname.toLowerCase().includes(q));
  }, [orders, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
            직원별 상세
          </h1>
          <p className="text-sm" style={{ color: "rgba(180,200,255,0.75)" }}>
            {today} &mdash; 오늘 신청한 메뉴를 이름별로 확인하세요
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2 border-0"
          style={{ background: "rgba(255,255,255,0.12)", color: "rgba(200,215,255,0.9)" }}
        >
          <RefreshCw className="w-4 h-4" />새로고침
        </Button>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-3 w-4 h-4" style={{ color: "rgba(180,200,255,0.5)" }} />
        <Input
          placeholder="이름으로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 focus-visible:ring-white/30 placeholder:text-white/40"
          style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "white" }}
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !orders || orders.length === 0 ? (
        <EmptyState message="아직 신청 내역이 없습니다." />
      ) : filteredOrders.length === 0 ? (
        <EmptyState message="검색 결과가 없습니다." />
      ) : (
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(18px)",
            WebkitBackdropFilter: "blur(18px)",
            border: "1px solid rgba(255,255,255,0.18)",
          }}
        >
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "rgba(180,200,255,0.75)" }}>이름</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "rgba(180,200,255,0.75)" }}>식당</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: "rgba(180,200,255,0.75)" }}>주문 메뉴</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, idx) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: idx < filteredOrders.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none" }}
                >
                  <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "rgba(150,170,255,1)" }}>
                    {order.employeeNickname}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap" style={{ color: "rgba(200,215,255,0.75)" }}>
                    {order.restaurantName}
                  </td>
                  <td className="px-4 py-3" style={{ color: "rgba(200,215,255,0.9)" }}>
                    {formatOrderMenuDisplay(order)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div
          className="w-8 h-8 rounded-full border-2 border-transparent mx-auto mb-4"
          style={{ borderTopColor: "rgba(150,170,255,0.8)", animation: "spin 1s linear infinite" }}
        />
        <p style={{ color: "rgba(180,200,255,0.65)" }}>로딩 중...</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Users className="w-12 h-12 mx-auto mb-3" style={{ color: "rgba(150,170,255,0.6)" }} />
        <p style={{ color: "rgba(180,200,255,0.65)" }}>{message}</p>
      </div>
    </div>
  );
}
