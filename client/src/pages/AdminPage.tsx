import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Check, RefreshCw, Store, AlertTriangle, Lock as LockIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const CATEGORY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  "한식":   { bg: "rgba(255,140,80,0.20)",  border: "rgba(255,160,100,0.50)", text: "rgba(255,200,160,1)" },
  "양식":   { bg: "rgba(80,160,255,0.20)",  border: "rgba(100,180,255,0.50)", text: "rgba(160,210,255,1)" },
  "샐러드": { bg: "rgba(80,200,140,0.20)",  border: "rgba(100,220,160,0.50)", text: "rgba(160,240,200,1)" },
  "햄버거": { bg: "rgba(255,200,60,0.20)",  border: "rgba(255,220,80,0.50)",  text: "rgba(255,240,160,1)" },
  "일식":   { bg: "rgba(160,80,255,0.20)",  border: "rgba(180,100,255,0.50)", text: "rgba(210,160,255,1)" },
};

const glassCard = {
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "1rem",
} as React.CSSProperties;

const ADMIN_PASSWORD = "2101";

export default function AdminPage() {
  const utils = trpc.useUtils();
  const { data: allRestaurants, isLoading } = trpc.restaurant.list.useQuery();
  const { data: todaySettings } = trpc.daily.todayRestaurants.useQuery();
  const { data: todayOrders } = trpc.order.todayAll.useQuery();

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (todaySettings) {
      setSelected(new Set(todaySettings.map(s => s.restaurantId)));
      setIsClosed(todaySettings[0]?.isClosed || false);
    }
  }, [todaySettings]);

  const setRestaurantsMutation = trpc.daily.setRestaurants.useMutation({
    onSuccess: () => { utils.daily.todayRestaurants.invalidate(); toast.success("오늘의 식당이 설정되었습니다!"); },
    onError: () => toast.error("설정 중 오류가 발생했습니다."),
  });

  const resetMutation = trpc.daily.reset.useMutation({
    onSuccess: () => {
      utils.daily.todayRestaurants.invalidate();
      utils.order.todayAll.invalidate();
      utils.order.summary.invalidate();
      setSelected(new Set());
      toast.success("오늘 데이터가 초기화되었습니다.");
    },
    onError: () => toast.error("초기화 중 오류가 발생했습니다."),
  });

  const toggleClosedMutation = trpc.daily.toggleClosed.useMutation({
    onSuccess: (data) => {
      setIsClosed(data.isClosed);
      toast.success(data.isClosed ? "신청이 마감되었습니다." : "신청이 다시 열렸습니다.");
    },
    onError: () => toast.error("상태 변경 중 오류가 발생했습니다."),
  });

  const clearOrdersMutation = trpc.order.clearAll.useMutation({
    onSuccess: () => {
      utils.order.todayAll.invalidate();
      utils.order.summary.invalidate();
      utils.order.getHistory.invalidate();
      toast.success("모든 주문 데이터가 삭제되었습니다.");
    },
    onError: () => toast.error("삭제 중 오류가 발생했습니다.")
  });

  const handleToggle = (restaurantId: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(restaurantId)) newSelected.delete(restaurantId);
    else newSelected.add(restaurantId);
    setSelected(newSelected);
  };

  const groupedByCategory = allRestaurants?.reduce((acc, r) => {
    if (!acc[r.categoryName]) acc[r.categoryName] = [];
    acc[r.categoryName].push(r);
    return acc;
  }, {} as Record<string, typeof allRestaurants>);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>메뉴선정</h1>
          <p style={{ color: "rgba(180,200,255,0.75)" }}>오늘의 식당을 선택하세요</p>
        </div>

        {/* 마감 알림 */}
        {isClosed && (
          <div className="mb-6 p-5 rounded-xl flex items-center gap-3" style={{ background: "rgba(200,80,30,0.25)", border: "1px solid rgba(255,120,80,0.35)" }}>
            <LockIcon className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(255,160,120,1)" }} />
            <div>
              <p className="font-semibold" style={{ color: "rgba(255,200,180,1)" }}>신청이 마감되었습니다</p>
              <p className="text-sm" style={{ color: "rgba(255,180,160,0.75)" }}>직원들이 더 이상 신청할 수 없습니다. &quot;오픈&quot; 버튼으로 다시 열 수 있습니다.</p>
            </div>
          </div>
        )}

        {/* 식당 선택 카드 */}
        <div className="mb-6 p-6" style={glassCard}>
          <div className="flex items-center gap-2 mb-1">
            <Store className="w-5 h-5" style={{ color: "rgba(150,170,255,1)" }} />
            <h2 className="text-lg font-semibold" style={{ color: "white" }}>
              오늘의 식당 ({selected.size}개 선택)
            </h2>
          </div>
          {todayOrders && todayOrders.length > 0 && (
            <p className="text-sm mb-4" style={{ color: "rgba(180,200,255,0.65)" }}>
              현재 {todayOrders.length}명이 신청했습니다
            </p>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(150,170,255,0.8)" }} />
            </div>
          ) : (
            <div className="mt-4 space-y-5">
              {groupedByCategory && Object.entries(groupedByCategory).map(([category, restaurants]) => {
                const colors = CATEGORY_COLORS[category] || { bg: "rgba(255,255,255,0.15)", border: "rgba(255,255,255,0.30)", text: "rgba(200,215,255,1)" };
                return (
                  <div key={category}>
                    <h3 className="font-semibold mb-3 text-sm" style={{ color: colors.text }}>{category}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {restaurants?.map(r => (
                        <button
                          key={r.id}
                          onClick={() => handleToggle(r.id)}
                          className="p-3 rounded-xl text-left transition-all duration-150 active:scale-[0.97]"
                          style={{
                            background: selected.has(r.id) ? colors.bg : "rgba(255,255,255,0.07)",
                            border: `2px solid ${selected.has(r.id) ? colors.border : "rgba(255,255,255,0.12)"}`,
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium" style={{ color: selected.has(r.id) ? colors.text : "rgba(200,215,255,0.75)" }}>
                              {r.name}
                            </span>
                            {selected.has(r.id) && <Check className="w-5 h-5" style={{ color: colors.text }} />}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-3 flex-wrap">
          <Button
            onClick={() => setRestaurantsMutation.mutate({ restaurantIds: Array.from(selected), password: ADMIN_PASSWORD })}
            disabled={setRestaurantsMutation.isPending}
            className="flex-1 min-w-[120px] border-0 shadow-lg active:scale-[0.97] transition-all"
            style={{ background: "linear-gradient(135deg, rgba(80,120,255,0.85), rgba(60,100,230,0.85))", color: "white" }}
          >
            {setRestaurantsMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />저장 중...</> : "저장"}
          </Button>

          <Button
            onClick={() => toggleClosedMutation.mutate({ password: ADMIN_PASSWORD })}
            disabled={toggleClosedMutation.isPending}
            className="flex-1 min-w-[120px] border-0 shadow-lg active:scale-[0.97] transition-all"
            style={{
              background: isClosed
                ? "linear-gradient(135deg, rgba(60,180,100,0.85), rgba(40,160,80,0.85))"
                : "linear-gradient(135deg, rgba(220,100,40,0.85), rgba(200,80,30,0.85))",
              color: "white",
            }}
          >
            {toggleClosedMutation.isPending
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{isClosed ? "오픈 중..." : "마감 중..."}</>
              : isClosed ? "오픈" : "마감"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 min-w-[120px] border-0"
                style={{ background: "rgba(255,255,255,0.12)", color: "rgba(200,215,255,0.9)" }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />오늘 초기화
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />오늘 데이터 초기화
                </AlertDialogTitle>
                <AlertDialogDescription>이 작업은 되돌릴 수 없습니다. 오늘의 모든 신청 데이터가 삭제됩니다.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={() => resetMutation.mutate({ password: ADMIN_PASSWORD })} className="bg-destructive hover:bg-destructive/90">초기화</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 min-w-[120px] border-0"
                style={{ background: "rgba(200,60,60,0.20)", color: "rgba(255,160,160,0.9)", border: "1px solid rgba(255,100,100,0.30)" }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />전체 삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />모든 주문 데이터 삭제
                </AlertDialogTitle>
                <AlertDialogDescription>⚠️ 주의: 이 작업은 되돌릴 수 없습니다. 모든 주문 이력 데이터가 영구 삭제됩니다.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={() => clearOrdersMutation.mutate({ password: ADMIN_PASSWORD })} disabled={clearOrdersMutation.isPending} className="bg-red-600 hover:bg-red-700">
                  {clearOrdersMutation.isPending ? "삭제 중..." : "삭제"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
