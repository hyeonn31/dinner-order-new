import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Copy, RefreshCw, ClipboardList, Users } from "lucide-react";

export default function SummaryPage() {
  const { data, isLoading, refetch, isFetching } = trpc.order.summary.useQuery(undefined, {
    refetchInterval: 15000, // 15초마다 자동 갱신
  });

  const { data: todayList } = trpc.order.todayList.useQuery(undefined, {
    refetchInterval: 15000,
  });

  function handleCopy() {
    if (!data?.copyText) return;
    navigator.clipboard.writeText(data.copyText).then(() => {
      toast.success("클립보드에 복사되었습니다!");
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-foreground">주문 취합</h1>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
          새로고침
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="py-4 px-5">
            <p className="text-xs font-semibold opacity-80 mb-1">총 신청 인원</p>
            <p className="text-3xl font-black">{isLoading ? "..." : data?.totalCount ?? 0}<span className="text-base font-medium ml-1">명</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 px-5">
            <p className="text-xs font-semibold text-muted-foreground mb-1">신청 식당 수</p>
            <p className="text-3xl font-black text-foreground">
              {isLoading ? "..." : data?.grouped.length ?? 0}<span className="text-base font-medium text-muted-foreground ml-1">곳</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 식당별 주문 현황 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="w-4 h-4" />
            식당별 주문 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : !data || data.grouped.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">아직 신청된 주문이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {data.grouped.map((group, i) => (
                <div key={i} className="rounded-lg border border-border overflow-hidden">
                  <div className="bg-secondary px-4 py-2.5 flex items-center justify-between">
                    <span className="font-bold text-secondary-foreground">{group.restaurantName}</span>
                    <Badge variant="default" className="text-xs">{group.orders.length}명</Badge>
                  </div>
                  <div className="divide-y divide-border">
                    {group.orders.map((ord, j) => {
                      const parts: string[] = [];
                      if (ord.mainMenuName) parts.push(ord.mainMenuName);
                      if (ord.sideMenuName) parts.push(`사이드: ${ord.sideMenuName}`);
                      if (ord.drinkOption) parts.push(`음료: ${ord.drinkOption}`);
                      if (ord.extraOption) parts.push(ord.extraOption);
                      return (
                        <div key={j} className="px-4 py-2.5 flex items-start gap-3">
                          <span className="font-semibold text-sm text-primary min-w-[4rem] shrink-0">{ord.employeeName}</span>
                          <span className="text-sm text-foreground">
                            {parts.join(" · ") || "메뉴 미선택"}
                            {ord.note && <span className="text-muted-foreground ml-1">({ord.note})</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 복사 텍스트 */}
      {data && data.totalCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Copy className="w-4 h-4" />
                복사용 텍스트
              </CardTitle>
              <Button size="sm" onClick={handleCopy} className="gap-1.5">
                <Copy className="w-3.5 h-3.5" />
                복사하기
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted rounded-lg p-4 whitespace-pre-wrap font-mono text-foreground leading-relaxed overflow-x-auto">
              {data.copyText}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* 전체 신청 목록 */}
      {todayList && todayList.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">전체 신청 목록</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground text-xs">이름</th>
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground text-xs">식당</th>
                    <th className="text-left py-2 px-3 font-semibold text-muted-foreground text-xs">메뉴</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {todayList.map((order) => {
                    const parts: string[] = [];
                    if (order.mainMenuName) parts.push(order.mainMenuName);
                    if (order.sideMenuName) parts.push(order.sideMenuName);
                    if (order.drinkOption) parts.push(order.drinkOption);
                    if (order.extraOption) parts.push(order.extraOption);
                    return (
                      <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-primary">{order.employeeName}</td>
                        <td className="py-2.5 px-3 text-foreground">{order.restaurantName}</td>
                        <td className="py-2.5 px-3 text-foreground">{parts.join(" · ") || "-"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
