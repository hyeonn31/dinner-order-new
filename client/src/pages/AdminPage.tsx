import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Lock, Settings, RotateCcw, Users, Store, Check } from "lucide-react";
import { Link } from "wouter";

const ADMIN_PASSWORD = "2101";

function PasswordGate({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  function handleUnlock() {
    if (input === ADMIN_PASSWORD) {
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setInput("");
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="max-w-sm mx-auto mt-12">
      <Card>
        <CardHeader className="text-center pb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg font-bold">관리자 인증</CardTitle>
          <p className="text-sm text-muted-foreground">비밀번호를 입력하세요</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            placeholder="비밀번호"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            className={error ? "border-destructive" : ""}
          />
          {error && <p className="text-xs text-destructive">비밀번호가 올바르지 않습니다.</p>}
          <Button className="w-full font-bold" onClick={handleUnlock}>
            확인
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminContent() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.daily.getToday.useQuery();

  const todayRestaurantIds = useMemo(
    () => new Set(data?.settings.map((s) => s.restaurantId) ?? []),
    [data?.settings]
  );
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [initialized, setInitialized] = useState(false);

  // 서버 데이터 로드 후 초기화 (useEffect로 render-phase setState 방지)
  useEffect(() => {
    if (!initialized && data) {
      setSelected(new Set(data.settings.map((s) => s.restaurantId)));
      setInitialized(true);
    }
  }, [data, initialized]);

  const categoryMap = new Map((data?.categories ?? []).map((c) => [c.id, c.name]));
  const grouped = useMemo(() => {
    const map = new Map<string, Array<{ id: number; name: string; categoryId: number; isActive: boolean; sortOrder: number; createdAt: Date }>>();
    for (const r of (data?.restaurants ?? [])) {
      const cat = categoryMap.get(r.categoryId) ?? "기타";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(r);
    }
    return map;
  }, [data?.restaurants, data?.categories]);

  const setRestaurantsMutation = trpc.daily.setRestaurants.useMutation({
    onSuccess: () => {
      toast.success("오늘의 식당이 저장되었습니다!");
      utils.daily.getToday.invalidate();
      utils.order.summary.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetMutation = trpc.daily.reset.useMutation({
    onSuccess: () => {
      toast.success("하루 초기화 완료!");
      utils.daily.getToday.invalidate();
      utils.order.todayList.invalidate();
      utils.order.summary.invalidate();
      setSelected(new Set());
      setInitialized(false);
    },
    onError: (err) => toast.error(err.message),
  });

  function toggleRestaurant(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSave() {
    setRestaurantsMutation.mutate({
      restaurantIds: Array.from(selected),
      password: ADMIN_PASSWORD,
    });
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black">관리자 페이지</h1>
        <Badge variant="secondary" className="text-xs">{data?.today}</Badge>
      </div>

      {/* 관리 링크 */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/employees">
          <Button variant="outline" className="w-full gap-2 font-semibold bg-background">
            <Users className="w-4 h-4" />
            직원 관리
          </Button>
        </Link>
        <Link href="/admin/restaurants">
          <Button variant="outline" className="w-full gap-2 font-semibold bg-background">
            <Store className="w-4 h-4" />
            식당/메뉴 관리
          </Button>
        </Link>
      </div>

      {/* 오늘의 식당 선택 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Settings className="w-4 h-4" />
            오늘의 식당 선택
          </CardTitle>
          <p className="text-xs text-muted-foreground">선택한 식당이 오늘 직원들에게 표시됩니다.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <>
              {Array.from(grouped.entries()).map(([catName, rests]) => (
                <div key={catName}>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{catName}</p>
                  <div className="flex flex-wrap gap-2">
                    {rests.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => toggleRestaurant(r.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all flex items-center gap-1.5 ${
                          selected.has(r.id)
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-foreground border-border hover:border-primary hover:text-primary"
                        }`}
                      >
                        {selected.has(r.id) && <Check className="w-3.5 h-3.5" />}
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="pt-2 flex gap-2">
                <Button
                  className="flex-1 font-bold"
                  onClick={handleSave}
                  disabled={setRestaurantsMutation.isPending}
                >
                  {setRestaurantsMutation.isPending ? "저장 중..." : `선택 저장 (${selected.size}곳)`}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 하루 초기화 */}
      <Card className="border-destructive/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-destructive">
            <RotateCcw className="w-4 h-4" />
            하루 초기화
          </CardTitle>
          <p className="text-xs text-muted-foreground">오늘의 식당 설정과 모든 주문을 초기화합니다.</p>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full font-bold gap-2">
                <RotateCcw className="w-4 h-4" />
                오늘 데이터 전체 초기화
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>하루 초기화</AlertDialogTitle>
                <AlertDialogDescription>
                  오늘({data?.today})의 식당 설정과 모든 주문이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white hover:bg-destructive/90"
                  onClick={() => resetMutation.mutate({ password: ADMIN_PASSWORD })}
                >
                  초기화
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPage() {
  return (
    <PasswordGate>
      <AdminContent />
    </PasswordGate>
  );
}
