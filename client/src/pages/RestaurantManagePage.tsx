import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const ADMIN_PASSWORD = "2101";

const glassCard = {
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "1rem",
} as React.CSSProperties;

const inputStyle = {
  background: "rgba(255,255,255,0.12)",
  border: "none",
  color: "white",
} as React.CSSProperties;

export default function RestaurantManagePage() {
  const utils = trpc.useUtils();
  const { data: categories, isLoading: categoriesLoading } = trpc.restaurant.listCategories.useQuery();
  const { data: restaurants, isLoading: restaurantsLoading, refetch: refetchRestaurants } = trpc.restaurant.list.useQuery();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [newRestaurantName, setNewRestaurantName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [newMenuName, setNewMenuName] = useState("");
  const [selectedMenuType, setSelectedMenuType] = useState<string>("main");
  const [deleteRestaurantId, setDeleteRestaurantId] = useState<number | null>(null);
  const [deleteMenuId, setDeleteMenuId] = useState<number | null>(null);

  const menuTypes = [
    { value: "main", label: "메인메뉴" },
    { value: "side", label: "사이드" },
    { value: "drink", label: "음료" },
    { value: "dressing", label: "드레싱" },
    { value: "option", label: "추가옵션" },
  ];

  const selectedRestaurant = restaurants?.find(r => r.id === selectedRestaurantId);
  const { data: menus, isLoading: menusLoading } = trpc.restaurant.menus.useQuery(
    { restaurantId: selectedRestaurantId || 0 },
    { enabled: !!selectedRestaurantId }
  );

  const addRestaurantMutation = trpc.restaurant.addRestaurant.useMutation({
    onSuccess: async (created) => {
      toast.success("식당이 추가되었습니다");
      setNewRestaurantName("");
      setSelectedCategory("");
      utils.restaurant.list.setData(undefined, old => {
        if (!old) return [created];
        if (old.some(r => r.id === created.id)) return old;
        return [...old, created].sort((a, b) => a.categorySortOrder - b.categorySortOrder || a.sortOrder - b.sortOrder);
      });
      await refetchRestaurants();
    },
    onError: (error) => toast.error(`식당 추가 실패: ${error.message}`),
  });

  const deleteRestaurantMutation = trpc.restaurant.deleteRestaurant.useMutation({
    onSuccess: async (_data, variables) => {
      toast.success("식당이 삭제되었습니다");
      utils.restaurant.list.setData(undefined, old => old?.filter(r => r.id !== variables.restaurantId));
      await refetchRestaurants();
      setDeleteRestaurantId(null);
    },
    onError: (error) => toast.error(`식당 삭제 실패: ${error.message}`),
  });

  const addMenuMutation = trpc.restaurant.addMenu.useMutation({
    onSuccess: () => {
      toast.success("메뉴가 추가되었습니다");
      setNewMenuName("");
      setSelectedMenuType("main");
      if (selectedRestaurantId) void utils.restaurant.menus.invalidate({ restaurantId: selectedRestaurantId });
    },
    onError: (error) => toast.error(`메뉴 추가 실패: ${error.message}`),
  });

  const deleteMenuMutation = trpc.restaurant.deleteMenu.useMutation({
    onSuccess: () => {
      toast.success("메뉴가 삭제되었습니다");
      if (selectedRestaurantId) void utils.restaurant.menus.invalidate({ restaurantId: selectedRestaurantId });
      setDeleteMenuId(null);
    },
    onError: (error) => toast.error(`메뉴 삭제 실패: ${error.message}`),
  });

  const handleAddRestaurant = () => {
    if (!newRestaurantName.trim()) { toast.error("식당 이름을 입력하세요"); return; }
    if (!selectedCategory) { toast.error("카테고리를 선택하세요"); return; }
    addRestaurantMutation.mutate({ name: newRestaurantName, categoryId: parseInt(selectedCategory), password: ADMIN_PASSWORD });
  };

  const handleAddMenu = () => {
    if (!newMenuName.trim()) { toast.error("메뉴 이름을 입력하세요"); return; }
    if (!selectedRestaurantId) { toast.error("식당을 선택하세요"); return; }
    addMenuMutation.mutate({ restaurantId: selectedRestaurantId, name: newMenuName, itemType: selectedMenuType, password: ADMIN_PASSWORD });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>식당 &amp; 메뉴 관리</h1>
          <p style={{ color: "rgba(180,200,255,0.75)" }}>식당과 메뉴를 추가, 수정, 삭제할 수 있습니다</p>
        </div>

        <Tabs defaultValue="restaurants" className="space-y-6">
          <TabsList style={{ background: "rgba(255,255,255,0.10)", border: "1px solid rgba(255,255,255,0.15)" }} className="grid w-full grid-cols-2">
            <TabsTrigger value="restaurants" className="data-[state=active]:text-white" style={{ color: "rgba(180,200,255,0.7)" }}>식당 관리</TabsTrigger>
            <TabsTrigger value="menus" className="data-[state=active]:text-white" style={{ color: "rgba(180,200,255,0.7)" }}>메뉴 관리</TabsTrigger>
          </TabsList>

          {/* 식당 관리 탭 */}
          <TabsContent value="restaurants" className="space-y-6">
            <div className="p-6" style={glassCard}>
              <h2 className="text-base font-semibold mb-1" style={{ color: "white" }}>식당 추가</h2>
              <p className="text-sm mb-4" style={{ color: "rgba(180,200,255,0.65)" }}>새로운 식당을 추가하세요</p>
              <div className="flex gap-2">
                <Input
                  placeholder="식당 이름"
                  value={newRestaurantName}
                  onChange={(e) => setNewRestaurantName(e.target.value)}
                  className="focus-visible:ring-white/30 placeholder:text-white/40"
                  style={inputStyle}
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-32 border-0 text-white focus:ring-white/30" style={{ background: "rgba(255,255,255,0.12)" }}>
                    <SelectValue placeholder={categoriesLoading ? "로딩..." : "카테고리"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddRestaurant}
                  disabled={addRestaurantMutation.isPending || categoriesLoading || !categories?.length}
                  className="border-0 active:scale-[0.97]"
                  style={{ background: "linear-gradient(135deg, rgba(80,120,255,0.85), rgba(60,100,230,0.85))", color: "white" }}
                >
                  {addRestaurantMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />추가</>}
                </Button>
              </div>
            </div>

            <div className="p-6" style={glassCard}>
              <h2 className="text-base font-semibold mb-1" style={{ color: "white" }}>식당 목록</h2>
              <p className="text-sm mb-4" style={{ color: "rgba(180,200,255,0.65)" }}>총 {restaurants?.length || 0}개의 식당</p>
              {restaurantsLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(150,170,255,0.8)" }} /></div>
              ) : restaurants && restaurants.length > 0 ? (
                <div className="space-y-2">
                  {restaurants.map(restaurant => (
                    <div
                      key={restaurant.id}
                      className="flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all"
                      style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
                      onClick={() => setSelectedRestaurantId(restaurant.id)}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
                    >
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: "white" }}>{restaurant.name}</p>
                        <p className="text-sm" style={{ color: "rgba(180,200,255,0.65)" }}>
                          {restaurant.categoryName}
                          {restaurant.categoryName === "미분류" && <span style={{ color: "rgba(255,180,100,0.9)" }}> (카테고리 다시 설정 필요)</span>}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ color: "rgba(255,120,120,0.8)" }}
                        onClick={(e) => { e.stopPropagation(); setDeleteRestaurantId(restaurant.id); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8" style={{ color: "rgba(180,200,255,0.5)" }}>식당이 없습니다</div>
              )}
            </div>
          </TabsContent>

          {/* 메뉴 관리 탭 */}
          <TabsContent value="menus" className="space-y-6">
            <div className="p-6" style={glassCard}>
              <h2 className="text-base font-semibold mb-1" style={{ color: "white" }}>식당 선택</h2>
              <p className="text-sm mb-4" style={{ color: "rgba(180,200,255,0.65)" }}>메뉴를 관리할 식당을 선택하세요</p>
              <Select value={selectedRestaurantId?.toString() || ""} onValueChange={(v) => setSelectedRestaurantId(parseInt(v))}>
                <SelectTrigger className="border-0 text-white focus:ring-white/30" style={{ background: "rgba(255,255,255,0.12)" }}>
                  <SelectValue placeholder="식당을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {restaurants?.map(r => (
                    <SelectItem key={r.id} value={r.id.toString()}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRestaurant && (
              <>
                <div className="p-6" style={glassCard}>
                  <h2 className="text-base font-semibold mb-1" style={{ color: "white" }}>메뉴 추가</h2>
                  <p className="text-sm mb-4" style={{ color: "rgba(180,200,255,0.65)" }}>{selectedRestaurant.name}에 새로운 메뉴를 추가하세요</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="메뉴 이름"
                      value={newMenuName}
                      onChange={(e) => setNewMenuName(e.target.value)}
                      className="focus-visible:ring-white/30 placeholder:text-white/40"
                      style={inputStyle}
                    />
                    <Select value={selectedMenuType} onValueChange={setSelectedMenuType}>
                      <SelectTrigger className="w-32 border-0 text-white focus:ring-white/30" style={{ background: "rgba(255,255,255,0.12)" }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {menuTypes.map(type => (
                          <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAddMenu}
                      disabled={addMenuMutation.isPending}
                      className="border-0 active:scale-[0.97]"
                      style={{ background: "linear-gradient(135deg, rgba(80,120,255,0.85), rgba(60,100,230,0.85))", color: "white" }}
                    >
                      {addMenuMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4 mr-1" />추가</>}
                    </Button>
                  </div>
                </div>

                <div className="p-6" style={glassCard}>
                  <h2 className="text-base font-semibold mb-1" style={{ color: "white" }}>메뉴 목록</h2>
                  <p className="text-sm mb-4" style={{ color: "rgba(180,200,255,0.65)" }}>{selectedRestaurant.name} - 총 {menus?.length || 0}개 메뉴</p>
                  {menusLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(150,170,255,0.8)" }} /></div>
                  ) : menus && menus.length > 0 ? (
                    <div className="space-y-2">
                      {menus.map(menu => (
                        <div
                          key={menu.id}
                          className="flex items-center justify-between p-3 rounded-xl transition-all"
                          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
                        >
                          <div className="flex-1">
                            <p className="font-medium" style={{ color: "white" }}>{menu.name}</p>
                            <p className="text-sm" style={{ color: "rgba(180,200,255,0.65)" }}>
                              {menuTypes.find(t => t.value === menu.itemType)?.label}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            style={{ color: "rgba(255,120,120,0.8)" }}
                            onClick={() => setDeleteMenuId(menu.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8" style={{ color: "rgba(180,200,255,0.5)" }}>메뉴가 없습니다</div>
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 식당 삭제 확인 */}
      <AlertDialog open={deleteRestaurantId !== null} onOpenChange={(open) => !open && setDeleteRestaurantId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>식당 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 식당을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteRestaurantId && deleteRestaurantMutation.mutate({ restaurantId: deleteRestaurantId, password: ADMIN_PASSWORD })} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* 메뉴 삭제 확인 */}
      <AlertDialog open={deleteMenuId !== null} onOpenChange={(open) => !open && setDeleteMenuId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>메뉴 삭제</AlertDialogTitle>
            <AlertDialogDescription>이 메뉴를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMenuId && deleteMenuMutation.mutate({ menuId: deleteMenuId, password: ADMIN_PASSWORD })} className="bg-destructive hover:bg-destructive/90">삭제</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
