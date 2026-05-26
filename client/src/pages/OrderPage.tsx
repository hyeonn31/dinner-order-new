import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, CheckCircle2, X, UtensilsCrossed } from "lucide-react";

export default function OrderPage() {
  const utils = trpc.useUtils();

  // 데이터 로드
  const { data: todayData, isLoading: todayLoading } = trpc.daily.getToday.useQuery();
  const { data: employees, isLoading: empLoading } = trpc.employee.list.useQuery();

  // 상태
  const [search, setSearch] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: number; nickname: string } | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [mainMenuId, setMainMenuId] = useState<number | null>(null);
  const [mainMenuName, setMainMenuName] = useState("");
  const [sideMenuId, setSideMenuId] = useState<number | null>(null);
  const [sideMenuName, setSideMenuName] = useState("");
  const [drinkOption, setDrinkOption] = useState("");
  const [extraOption, setExtraOption] = useState("");
  const [note, setNote] = useState("");

  // 오늘 선택된 식당
  const todayRestaurantIds = new Set(todayData?.settings.map((s) => s.restaurantId) ?? []);
  const todayRestaurants = (todayData?.restaurants ?? []).filter((r) => todayRestaurantIds.has(r.id));
  const categoryMap = new Map((todayData?.categories ?? []).map((c) => [c.id, c.name]));

  // 선택된 식당의 메뉴
  const selectedRestaurantMenus = useMemo(() => {
    if (!selectedRestaurantId || !todayData?.menus) return [];
    return todayData.menus.filter((m) => m.restaurantId === selectedRestaurantId);
  }, [selectedRestaurantId, todayData?.menus]);

  const mainMenus = selectedRestaurantMenus.filter((m) => m.itemType === "main");
  const sideMenus = selectedRestaurantMenus.filter((m) => m.itemType === "side");
  const drinkMenus = selectedRestaurantMenus.filter((m) => m.itemType === "drink");

  // 직원 검색 필터
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (!search.trim()) return employees;
    return employees.filter((e) => e.nickname.includes(search.trim()));
  }, [employees, search]);

  // 내 주문 조회
  const { data: myOrder, refetch: refetchMyOrder } = trpc.order.myOrder.useQuery(
    { employeeId: selectedEmployee?.id ?? 0 },
    { enabled: !!selectedEmployee }
  );

  // 제출 뮤테이션
  const submitMutation = trpc.order.submit.useMutation({
    onSuccess: () => {
      toast.success("신청이 완료되었습니다!");
      utils.order.myOrder.invalidate();
      utils.order.todayList.invalidate();
      utils.order.summary.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // 취소 뮤테이션
  const cancelMutation = trpc.order.cancel.useMutation({
    onSuccess: () => {
      toast.success("신청이 취소되었습니다.");
      utils.order.myOrder.invalidate();
      utils.order.todayList.invalidate();
      utils.order.summary.invalidate();
      resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  function resetForm() {
    setSelectedRestaurantId(null);
    setMainMenuId(null);
    setMainMenuName("");
    setSideMenuId(null);
    setSideMenuName("");
    setDrinkOption("");
    setExtraOption("");
    setNote("");
  }

  function handleSelectEmployee(emp: { id: number; nickname: string }) {
    setSelectedEmployee(emp);
    setSearch("");
    resetForm();
  }

  function handleSelectRestaurant(id: number) {
    setSelectedRestaurantId(id);
    setMainMenuId(null);
    setMainMenuName("");
    setSideMenuId(null);
    setSideMenuName("");
    setDrinkOption("");
  }

  function handleSubmit() {
    if (!selectedEmployee || !selectedRestaurantId) return;
    submitMutation.mutate({
      employeeId: selectedEmployee.id,
      restaurantId: selectedRestaurantId,
      mainMenuId: mainMenuId ?? undefined,
      mainMenuName: mainMenuName || undefined,
      sideMenuId: sideMenuId ?? undefined,
      sideMenuName: sideMenuName || undefined,
      drinkOption: drinkOption || undefined,
      extraOption: extraOption || undefined,
      note: note || undefined,
    });
  }

  if (todayLoading || empLoading) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (todayRestaurants.length === 0) {
    return (
      <div className="max-w-xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">오늘의 식당이 아직 선택되지 않았습니다.</p>
            <p className="text-sm mt-1">관리자 페이지에서 식당을 선택해 주세요.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="text-xl font-black text-foreground">식사 신청</h1>

      {/* STEP 1: 직원 선택 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
            STEP 1 · 이름 선택
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedEmployee ? (
            <div className="flex items-center justify-between bg-primary/10 rounded-lg px-4 py-2.5">
              <span className="font-bold text-primary">{selectedEmployee.nickname}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                onClick={() => { setSelectedEmployee(null); resetForm(); }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="이름 검색..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {filteredEmployees.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-4">검색 결과 없음</p>
                ) : (
                  filteredEmployees.map((emp) => (
                    <button
                      key={emp.id}
                      className="w-full text-left px-4 py-2.5 text-sm hover:bg-accent transition-colors font-medium"
                      onClick={() => handleSelectEmployee(emp)}
                    >
                      {emp.nickname}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 기존 주문 표시 */}
      {selectedEmployee && myOrder && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">현재 신청 내역</p>
                <p className="text-sm font-bold text-primary">
                  {myOrder.mainMenuName ?? "메뉴 미선택"}
                  {myOrder.sideMenuName && ` + ${myOrder.sideMenuName}`}
                  {myOrder.drinkOption && ` + ${myOrder.drinkOption}`}
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={() => cancelMutation.mutate({ employeeId: selectedEmployee.id })}
                disabled={cancelMutation.isPending}
              >
                취소
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: 식당 선택 */}
      {selectedEmployee && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              STEP 2 · 식당 선택
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(
                todayRestaurants.reduce((acc, r) => {
                  const cat = categoryMap.get(r.categoryId) ?? "기타";
                  if (!acc.has(cat)) acc.set(cat, []);
                  acc.get(cat)!.push(r);
                  return acc;
                }, new Map<string, typeof todayRestaurants>()).entries()
              ).map(([catName, rests]) => (
                <div key={catName}>
                  <p className="text-xs text-muted-foreground font-semibold mb-1.5">{catName}</p>
                  <div className="flex flex-wrap gap-2">
                    {rests.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleSelectRestaurant(r.id)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                          selectedRestaurantId === r.id
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-background text-foreground border-border hover:border-primary hover:text-primary"
                        }`}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 3: 메뉴 선택 */}
      {selectedEmployee && selectedRestaurantId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              STEP 3 · 메뉴 선택
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 메인 메뉴 */}
            {mainMenus.length > 0 && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block">메인 메뉴</Label>
                <Select
                  value={mainMenuId?.toString() ?? ""}
                  onValueChange={(v) => {
                    const id = parseInt(v);
                    setMainMenuId(id);
                    setMainMenuName(mainMenus.find((m) => m.id === id)?.name ?? "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="메인 메뉴 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainMenus.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 사이드 메뉴 */}
            {sideMenus.length > 0 && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block">사이드 메뉴 (선택)</Label>
                <Select
                  value={sideMenuId?.toString() ?? "none"}
                  onValueChange={(v) => {
                    if (v === "none") { setSideMenuId(null); setSideMenuName(""); return; }
                    const id = parseInt(v);
                    setSideMenuId(id);
                    setSideMenuName(sideMenus.find((m) => m.id === id)?.name ?? "");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="사이드 선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안 함</SelectItem>
                    {sideMenus.map((m) => (
                      <SelectItem key={m.id} value={m.id.toString()}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 음료 */}
            {drinkMenus.length > 0 && (
              <div>
                <Label className="text-xs font-semibold text-muted-foreground mb-2 block">음료 (선택)</Label>
                <Select
                  value={drinkOption || "none"}
                  onValueChange={(v) => setDrinkOption(v === "none" ? "" : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="음료 선택 (선택사항)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">선택 안 함</SelectItem>
                    {drinkMenus.map((m) => (
                      <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 추가 옵션 */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">추가 옵션 (선택)</Label>
              <Input
                placeholder="예: 제로콜라, 양념 추가 등"
                value={extraOption}
                onChange={(e) => setExtraOption(e.target.value)}
              />
            </div>

            {/* 요청사항 */}
            <div>
              <Label className="text-xs font-semibold text-muted-foreground mb-2 block">요청사항 (선택)</Label>
              <Input
                placeholder="특이사항이 있으면 입력하세요"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <Button
              className="w-full font-bold"
              onClick={handleSubmit}
              disabled={submitMutation.isPending || !selectedRestaurantId}
            >
              {submitMutation.isPending ? "신청 중..." : myOrder ? "신청 수정" : "신청 완료"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
