import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Lock, Store, Plus, Trash2, ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "wouter";

const ADMIN_PASSWORD = "2101";

const ITEM_TYPE_LABELS: Record<string, string> = {
  main: "메인",
  side: "사이드",
  drink: "음료",
  option: "옵션",
};

function PasswordGate({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  function handleUnlock() {
    if (input === ADMIN_PASSWORD) {
      setUnlocked(true);
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
          <Button className="w-full font-bold" onClick={handleUnlock}>확인</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function RestaurantContent() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.restaurant.list.useQuery();

  const [newRestName, setNewRestName] = useState("");
  const [newRestCategoryId, setNewRestCategoryId] = useState<string>("");
  const [expandedRestaurant, setExpandedRestaurant] = useState<number | null>(null);
  const [newMenuName, setNewMenuName] = useState<Record<number, string>>({});
  const [newMenuType, setNewMenuType] = useState<Record<number, string>>({});

  const addRestMutation = trpc.restaurant.addRestaurant.useMutation({
    onSuccess: () => {
      toast.success("식당이 추가되었습니다.");
      setNewRestName("");
      setNewRestCategoryId("");
      utils.restaurant.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteRestMutation = trpc.restaurant.deleteRestaurant.useMutation({
    onSuccess: () => {
      toast.success("식당이 삭제되었습니다.");
      utils.restaurant.list.invalidate();
      utils.daily.getToday.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const addMenuMutation = trpc.restaurant.addMenu.useMutation({
    onSuccess: (_, vars) => {
      toast.success("메뉴가 추가되었습니다.");
      setNewMenuName((prev) => ({ ...prev, [vars.restaurantId]: "" }));
      utils.restaurant.list.invalidate();
      utils.restaurant.menus.invalidate();
      utils.daily.getToday.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMenuMutation = trpc.restaurant.deleteMenu.useMutation({
    onSuccess: () => {
      toast.success("메뉴가 삭제되었습니다.");
      utils.restaurant.list.invalidate();
      utils.restaurant.menus.invalidate();
      utils.daily.getToday.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  // 메뉴 조회 (확장된 식당)
  const { data: expandedMenus } = trpc.restaurant.menus.useQuery(
    { restaurantId: expandedRestaurant ?? 0 },
    { enabled: !!expandedRestaurant }
  );

  const categoryMap = new Map((data?.categories ?? []).map((c) => [c.id, c.name]));

  // 카테고리별 식당 그룹핑
  type RestaurantItem = { id: number; name: string; categoryId: number; isActive: boolean; sortOrder: number; createdAt: Date };
  const grouped = new Map<number, { catName: string; restaurants: RestaurantItem[] }>();
  for (const cat of (data?.categories ?? [])) {
    grouped.set(cat.id, { catName: cat.name, restaurants: [] as RestaurantItem[] });
  }
  for (const r of (data?.restaurants ?? [])) {
    if (grouped.has(r.categoryId)) {
      grouped.get(r.categoryId)!.restaurants.push(r);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ChevronLeft className="w-4 h-4" />
            관리자
          </Button>
        </Link>
        <h1 className="text-xl font-black flex items-center gap-2">
          <Store className="w-5 h-5 text-primary" />
          식당/메뉴 관리
        </h1>
      </div>

      {/* 식당 추가 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">식당 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Select value={newRestCategoryId} onValueChange={setNewRestCategoryId}>
              <SelectTrigger className="w-32 shrink-0">
                <SelectValue placeholder="카테고리" />
              </SelectTrigger>
              <SelectContent>
                {(data?.categories ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="식당 이름"
              value={newRestName}
              onChange={(e) => setNewRestName(e.target.value)}
            />
            <Button
              onClick={() => {
                if (!newRestCategoryId || !newRestName.trim()) return;
                addRestMutation.mutate({
                  categoryId: parseInt(newRestCategoryId),
                  name: newRestName.trim(),
                  password: ADMIN_PASSWORD,
                });
              }}
              disabled={!newRestCategoryId || !newRestName.trim() || addRestMutation.isPending}
              className="gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              추가
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 식당 목록 */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : (
        Array.from(grouped.entries()).map(([catId, { catName, restaurants }]) => (
          restaurants.length > 0 && (
            <Card key={catId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  {catName}
                  <Badge variant="secondary" className="text-xs ml-auto">{restaurants.length}곳</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {restaurants.map((r) => (
                  <div key={r.id} className="border border-border rounded-lg overflow-hidden">
                    {/* 식당 헤더 */}
                    <div className="flex items-center justify-between px-3 py-2.5 bg-muted/30">
                      <button
                        className="flex items-center gap-2 flex-1 text-left font-semibold text-sm hover:text-primary transition-colors"
                        onClick={() => setExpandedRestaurant(expandedRestaurant === r.id ? null : r.id)}
                      >
                        {expandedRestaurant === r.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                        {r.name}
                      </button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>식당 삭제</AlertDialogTitle>
                            <AlertDialogDescription>
                              <strong>{r.name}</strong>을(를) 삭제하시겠습니까? 해당 식당의 메뉴도 모두 삭제됩니다.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>취소</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-white hover:bg-destructive/90"
                              onClick={() => deleteRestMutation.mutate({ id: r.id, password: ADMIN_PASSWORD })}
                            >
                              삭제
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>

                    {/* 메뉴 목록 (확장 시) */}
                    {expandedRestaurant === r.id && (
                      <div className="px-3 py-2 space-y-2">
                        {/* 메뉴 추가 */}
                        <div className="flex gap-2 pt-1">
                          <Input
                            placeholder="메뉴 이름"
                            value={newMenuName[r.id] ?? ""}
                            onChange={(e) => setNewMenuName((prev) => ({ ...prev, [r.id]: e.target.value }))}
                            className="text-sm h-8"
                          />
                          <Select
                            value={newMenuType[r.id] ?? "main"}
                            onValueChange={(v) => setNewMenuType((prev) => ({ ...prev, [r.id]: v }))}
                          >
                            <SelectTrigger className="w-24 h-8 text-xs shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="main">메인</SelectItem>
                              <SelectItem value="side">사이드</SelectItem>
                              <SelectItem value="drink">음료</SelectItem>
                              <SelectItem value="option">옵션</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            className="h-8 px-2 shrink-0"
                            onClick={() => {
                              const name = newMenuName[r.id]?.trim();
                              if (!name) return;
                              addMenuMutation.mutate({
                                restaurantId: r.id,
                                name,
                                itemType: (newMenuType[r.id] ?? "main") as "main" | "side" | "drink" | "option",
                                password: ADMIN_PASSWORD,
                              });
                            }}
                            disabled={!newMenuName[r.id]?.trim() || addMenuMutation.isPending}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* 메뉴 항목 */}
                        {expandedMenus && expandedMenus.length > 0 ? (
                          <div className="divide-y divide-border border border-border rounded-md">
                            {expandedMenus.map((menu) => (
                              <div key={menu.id} className="flex items-center justify-between px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                                    {ITEM_TYPE_LABELS[menu.itemType]}
                                  </Badge>
                                  <span className="text-sm">{menu.name}</span>
                                </div>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive">
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>메뉴 삭제</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        <strong>{menu.name}</strong>을(를) 삭제하시겠습니까?
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>취소</AlertDialogCancel>
                                      <AlertDialogAction
                                        className="bg-destructive text-white hover:bg-destructive/90"
                                        onClick={() => deleteMenuMutation.mutate({ id: menu.id, password: ADMIN_PASSWORD })}
                                      >
                                        삭제
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-2">등록된 메뉴가 없습니다.</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )
        ))
      )}
    </div>
  );
}

export default function RestaurantManagePage() {
  return (
    <PasswordGate>
      <RestaurantContent />
    </PasswordGate>
  );
}
