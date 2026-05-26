import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed, ChevronRight, Users, ClipboardList } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { data, isLoading } = trpc.daily.getToday.useQuery();

  const todayRestaurantIds = new Set(data?.settings.map((s) => s.restaurantId) ?? []);
  const todayRestaurants = (data?.restaurants ?? []).filter((r) => todayRestaurantIds.has(r.id));

  const categoryMap = new Map((data?.categories ?? []).map((c) => [c.id, c.name]));

  // 카테고리별 그룹핑
  const grouped = new Map<string, typeof todayRestaurants>();
  for (const r of todayRestaurants) {
    const catName = categoryMap.get(r.categoryId) ?? "기타";
    if (!grouped.has(catName)) grouped.set(catName, []);
    grouped.get(catName)!.push(r);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* 히어로 */}
      <div className="rounded-2xl bg-primary text-primary-foreground p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <UtensilsCrossed className="w-7 h-7" />
          <h1 className="text-2xl font-black tracking-tight">오늘의 저녁식사</h1>
        </div>
        <p className="text-primary-foreground/80 text-sm font-medium">
          {data?.today ?? "로딩 중..."} · 오늘 선택된 식당을 확인하고 메뉴를 신청하세요
        </p>
      </div>

      {/* 오늘의 식당 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            오늘의 식당
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
            </div>
          ) : todayRestaurants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UtensilsCrossed className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">아직 오늘의 식당이 선택되지 않았습니다.</p>
              <p className="text-xs mt-1">관리자 페이지에서 식당을 선택해 주세요.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(grouped.entries()).map(([catName, rests]) => (
                <div key={catName}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">{catName}</p>
                  <div className="flex flex-wrap gap-2">
                    {rests.map((r) => (
                      <Badge key={r.id} variant="secondary" className="text-sm px-3 py-1 font-medium">
                        {r.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 빠른 이동 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/order">
          <Button variant="default" className="w-full h-14 text-base font-bold justify-between px-5 shadow-sm">
            <span className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5" />
              식사 신청하기
            </span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
        <Link href="/summary">
          <Button variant="outline" className="w-full h-14 text-base font-bold justify-between px-5 bg-background shadow-sm border-border">
            <span className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              주문 현황 보기
            </span>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* 관리 링크 */}
      <div className="flex gap-3 justify-center text-sm">
        <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          관리자 페이지
        </Link>
      </div>
    </div>
  );
}
