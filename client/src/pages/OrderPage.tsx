import { useState, useEffect, useMemo, useRef } from "react";
import { formatOrderMenuDisplay } from "@shared/formatOrderMenu";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Send, X, CheckCircle2, AlertCircle, Search, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DRINK_OPTIONS = ["선택 안함", "제로콜라"];

// 글래스 카드 공통 스타일
const glassCard = {
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.20)",
  borderRadius: "1rem",
} as React.CSSProperties;

const glassSection = {
  borderBottom: "1px solid rgba(255,255,255,0.10)",
} as React.CSSProperties;

const labelStyle = { color: "rgba(200,215,255,0.9)" } as React.CSSProperties;
const subLabelStyle = { color: "rgba(180,200,255,0.65)" } as React.CSSProperties;

export default function OrderPage() {
  const utils = trpc.useUtils();
  const { user } = useAppAuth();
  const { data: employees } = trpc.employee.list.useQuery();
  const { data: todayRestaurants } = trpc.daily.todayRestaurants.useQuery();

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<number | null>(null);
  const [mainMenu, setMainMenu] = useState("");
  const [sideMenu, setSideMenu] = useState("");
  const [drinkOption, setDrinkOption] = useState("");
  const [extraOption, setExtraOption] = useState("");
  const [dressingOption, setDressingOption] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const [existingOrder, setExistingOrder] = useState<any>(null);
  const [pendingSubmit, setPendingSubmit] = useState<any>(null);
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const employeeDropdownRef = useRef<HTMLDivElement>(null);

  const { data: menus } = trpc.restaurant.menus.useQuery(
    { restaurantId: selectedRestaurantId! },
    { enabled: !!selectedRestaurantId }
  );

  useEffect(() => {
    if (user && employees && employees.length > 0 && selectedEmployeeId === null) {
      const matched = employees.find(e => e.nickname === user.nickname);
      if (matched) setSelectedEmployeeId(matched.id);
    }
  }, [user, employees]);

  useEffect(() => {
    if (todayRestaurants && todayRestaurants.length > 0) {
      setIsClosed(todayRestaurants[0].isClosed || false);
    }
  }, [todayRestaurants]);

  useEffect(() => {
    const interval = setInterval(() => { utils.daily.todayRestaurants.invalidate(); }, 5000);
    return () => clearInterval(interval);
  }, [utils]);

  useEffect(() => {
    if (selectedRestaurantId && todayRestaurants) {
      const restaurant = todayRestaurants.find(r => r.restaurantId === selectedRestaurantId);
      if (restaurant && restaurant.categoryName !== "햄버거") {
        setDrinkOption("제로콜라");
      } else {
        setDrinkOption("");
      }
    }
  }, [selectedRestaurantId, todayRestaurants]);

  useEffect(() => {
    setMainMenu("");
    setSideMenu("");
    setExtraOption("");
    setDressingOption("");
  }, [selectedRestaurantId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setIsEmployeeDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const submitMutation = trpc.order.submit.useMutation({
    onSuccess: (data: any) => {
      if (data.isUpdate && data.oldMenu && data.newMenu) {
        toast.success(`주문이 수정되었습니다: ${data.oldMenu} → ${data.newMenu}`);
      } else {
        toast.success("신청이 완료되었습니다");
      }
      setSubmitted(true);
      setTimeout(() => {
        setSelectedEmployeeId(null);
        setSelectedRestaurantId(null);
        setMainMenu("");
        setSideMenu("");
        setDrinkOption("");
        setExtraOption("");
        setSubmitted(false);
        setEmployeeSearchQuery("");
        utils.order.todayAll.invalidate();
      }, 2000);
    },
    onError: (error: any) => {
      toast.error(error.message || "신청에 실패했습니다");
    },
  });

  const handleSubmit = async () => {
    if (isClosed) { toast.error("신청이 마감되었습니다"); return; }
    if (!selectedEmployeeId) return toast.error("이름을 선택해 주세요.");
    if (!selectedRestaurantId) return toast.error("식당을 선택해 주세요.");
    if (!mainMenu) return toast.error("메인 메뉴를 선택해 주세요.");

    try {
      const existing = await utils.order.check.fetch({ employeeId: selectedEmployeeId });
      if (existing) {
        setExistingOrder(existing);
        const normalizeOption = (v: string) => (!v || v === "none" || v === "선택 안함") ? undefined : v;
        setPendingSubmit({
          employeeId: selectedEmployeeId,
          restaurantId: selectedRestaurantId,
          mainMenuName: mainMenu,
          sideMenuName: normalizeOption(sideMenu),
          drinkOption: normalizeOption(drinkOption),
          extraOption: normalizeOption(extraOption),
        });
        setShowDuplicateDialog(true);
        return;
      }
      const normalizeOption = (v: string) => (!v || v === "none" || v === "선택 안함") ? undefined : v;
      submitMutation.mutate({
        employeeId: selectedEmployeeId,
        restaurantId: selectedRestaurantId,
        mainMenuName: mainMenu,
        sideMenuName: normalizeOption(sideMenu),
        drinkOption: normalizeOption(drinkOption),
        extraOption: normalizeOption(extraOption),
      });
    } catch (error: any) {
      toast.error(error.message || "기존 주문 확인 중 오류가 발생했습니다");
    }
  };

  const mainMenus = menus?.filter((m: any) => m.itemType === "main") ?? [];
  const sideMenus = menus?.filter((m: any) => m.itemType === "side") ?? [];
  const dressingMenus = menus?.filter((m: any) => m.itemType === "dressing") ?? [];
  const optionMenus = menus?.filter((m: any) => m.itemType === "option" || m.itemType === "extra") ?? [];
  const selectableMainMenus = mainMenus.length > 0 ? mainMenus : (menus ?? []);

  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (!employeeSearchQuery.trim()) return employees;
    return employees.filter(emp =>
      emp.nickname.toLowerCase().includes(employeeSearchQuery.toLowerCase())
    );
  }, [employees, employeeSearchQuery]);

  const hasNoSetup = !todayRestaurants || todayRestaurants.length === 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
          저녁식사 신청
        </h1>
        <p className="text-sm" style={{ color: "rgba(180,200,255,0.75)" }}>
          이름을 선택하고 원하는 메뉴를 신청하세요
        </p>
      </div>

      {/* 마감 안내 */}
      {isClosed && (
        <div className="mb-4 p-4 rounded-xl flex gap-3" style={{ background: "rgba(200,80,30,0.25)", border: "1px solid rgba(255,120,80,0.35)" }}>
          <Lock className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(255,160,120,1)" }} />
          <div>
            <p className="font-medium mb-1" style={{ color: "rgba(255,200,180,1)" }}>신청이 마감되었습니다</p>
            <p className="text-sm" style={{ color: "rgba(255,180,160,0.75)" }}>더 이상 신청을 받지 않습니다. 관리자 페이지에서 다시 열어주세요.</p>
          </div>
        </div>
      )}

      {/* 미설정 안내 */}
      {hasNoSetup && (
        <div className="mb-4 p-4 rounded-xl flex gap-3" style={{ background: "rgba(80,100,200,0.20)", border: "1px solid rgba(150,170,255,0.30)" }}>
          <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(180,200,255,1)" }} />
          <div>
            <p className="font-medium mb-1" style={{ color: "white" }}>오늘의 식당이 아직 설정되지 않았습니다</p>
            <p className="text-sm" style={{ color: "rgba(180,200,255,0.75)" }}>관리자 페이지에서 오늘의 식당을 먼저 설정해 주세요.</p>
          </div>
        </div>
      )}

      {/* 완료 메시지 */}
      {submitted && (
        <div className="mb-4 p-4 rounded-xl flex gap-3" style={{ background: "rgba(40,160,100,0.25)", border: "1px solid rgba(80,200,140,0.35)" }}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "rgba(120,230,170,1)" }} />
          <p className="font-medium" style={{ color: "rgba(180,255,220,1)" }}>신청이 완료되었습니다!</p>
        </div>
      )}

      {!hasNoSetup && (
        <>
          {/* Main Form Card */}
          <div style={{ ...glassCard, overflow: "visible" }}>

            {/* Step 1: 이름 선택 */}
            <div className="p-6" style={{ ...glassSection, overflow: "visible" }}>
              <Label className="text-sm font-semibold mb-3 block" style={labelStyle}>
                1. 이름 선택
              </Label>
              <div className="relative" ref={employeeDropdownRef}>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-3 w-4 h-4" style={{ color: "rgba(180,200,255,0.6)" }} />
                  <Input
                    placeholder="이름 검색..."
                    value={employeeSearchQuery}
                    onChange={(e) => { setEmployeeSearchQuery(e.target.value); setIsEmployeeDropdownOpen(true); }}
                    onFocus={() => setIsEmployeeDropdownOpen(true)}
                    className="pl-10 border-0 text-white placeholder:text-white/40 focus-visible:ring-white/30"
                    style={{ background: "rgba(255,255,255,0.12)" }}
                  />
                </div>

                {isEmployeeDropdownOpen && (
                  <div
                    className="absolute top-full left-0 right-0 mt-1 rounded-xl shadow-2xl z-50 max-h-64 overflow-y-auto"
                    style={{
                      background: "rgba(20,25,65,0.92)",
                      backdropFilter: "blur(20px)",
                      WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(150,170,255,0.25)",
                    }}
                  >
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp) => (
                        <div
                          key={emp.id}
                          onClick={() => { setSelectedEmployeeId(emp.id); setEmployeeSearchQuery(""); setIsEmployeeDropdownOpen(false); }}
                          className="px-4 py-2.5 cursor-pointer text-sm transition-colors"
                          style={{ color: "rgba(200,215,255,0.9)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(120,140,255,0.20)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {emp.nickname}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-center" style={{ color: "rgba(180,200,255,0.5)" }}>
                        검색 결과가 없습니다
                      </div>
                    )}
                  </div>
                )}

                {selectedEmployeeId && (
                  <div
                    className="p-3 rounded-lg text-sm font-medium flex items-center justify-between"
                    style={{ background: "rgba(120,140,255,0.20)", border: "1px solid rgba(150,170,255,0.30)", color: "white" }}
                  >
                    <span>선택됨: {employees?.find(e => e.id === selectedEmployeeId)?.nickname}</span>
                    <button
                      onClick={() => { setSelectedEmployeeId(null); setEmployeeSearchQuery(""); }}
                      className="ml-2 text-xs"
                      style={{ color: "rgba(180,200,255,0.65)" }}
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: 식당 선택 */}
            {selectedEmployeeId && (
              <div className="p-6" style={glassSection}>
                <Label className="text-sm font-semibold mb-3 block" style={labelStyle}>
                  2. 식당 선택
                </Label>
                <Select value={selectedRestaurantId?.toString() || ""} onValueChange={(v) => setSelectedRestaurantId(parseInt(v))}>
                  <SelectTrigger className="border-0 text-white focus:ring-white/30" style={{ background: "rgba(255,255,255,0.12)" }}>
                    <SelectValue placeholder="식당을 선택하세요..." />
                  </SelectTrigger>
                  <SelectContent>
                    {todayRestaurants?.map((r) => (
                      <SelectItem key={r.restaurantId} value={r.restaurantId.toString()}>
                        {r.restaurantName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Step 3: 메뉴 선택 */}
            {selectedEmployeeId && selectedRestaurantId && (
              <div className="p-6" style={glassSection}>
                <Label className="text-sm font-semibold mb-4 block" style={labelStyle}>
                  3. 메뉴 선택
                </Label>
                <div className="space-y-4">
                  {/* 메인메뉴 */}
                  <div>
                    <div className="text-xs font-medium mb-1.5" style={subLabelStyle}>메인메뉴 *</div>
                    <Select value={mainMenu} onValueChange={setMainMenu}>
                      <SelectTrigger className="w-full h-11 border-0 text-white focus:ring-white/30" style={{ background: "rgba(255,255,255,0.12)" }}>
                        <SelectValue placeholder="메인메뉴를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent className="max-h-64">
                        {selectableMainMenus.length === 0 ? (
                          <SelectItem value="__empty__" disabled>등록된 메뉴가 없습니다 (관리자에게 문의)</SelectItem>
                        ) : (
                          selectableMainMenus.map((m: any) => (
                            <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 사이드 */}
                  {sideMenus.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1.5" style={subLabelStyle}>사이드</div>
                      <Select value={sideMenu} onValueChange={setSideMenu}>
                        <SelectTrigger className="w-full h-11 border-0 text-white focus:ring-white/30" style={{ background: "rgba(255,255,255,0.12)" }}>
                          <SelectValue placeholder="사이드를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          <SelectItem value="none">선택 안함</SelectItem>
                          {sideMenus.map((m: any) => (
                            <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 음료 */}
                  <div>
                    <div className="text-xs font-medium mb-1.5" style={subLabelStyle}>음료</div>
                    <Select value={drinkOption} onValueChange={setDrinkOption}>
                      <SelectTrigger className="w-full h-11 border-0 text-white focus:ring-white/30" style={{ background: "rgba(255,255,255,0.12)" }}>
                        <SelectValue placeholder="음료를 선택하세요" />
                      </SelectTrigger>
                      <SelectContent>
                        {DRINK_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>{option}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 드레싱 */}
                  {dressingMenus.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1.5" style={subLabelStyle}>드레싱</div>
                      <Select value={dressingOption} onValueChange={setDressingOption}>
                        <SelectTrigger className="w-full h-11 border-0 text-white focus:ring-white/30" style={{ background: "rgba(255,255,255,0.12)" }}>
                          <SelectValue placeholder="드레싱을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          <SelectItem value="none">선택 안함</SelectItem>
                          {dressingMenus.map((m: any) => (
                            <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 추가 옵션 */}
                  {optionMenus.length > 0 && (
                    <div>
                      <div className="text-xs font-medium mb-1.5" style={subLabelStyle}>추가 옵션</div>
                      <Select value={extraOption} onValueChange={setExtraOption}>
                        <SelectTrigger className="w-full h-11 border-0 text-white focus:ring-white/30" style={{ background: "rgba(255,255,255,0.12)" }}>
                          <SelectValue placeholder="추가 옵션을 선택하세요" />
                        </SelectTrigger>
                        <SelectContent className="max-h-64">
                          <SelectItem value="none">선택 안함</SelectItem>
                          {optionMenus.map((m: any) => (
                            <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: 신청 버튼 */}
            {selectedEmployeeId && selectedRestaurantId && mainMenu && (
              <div className="p-6 flex gap-3">
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending}
                  className="flex-1 h-11 text-base font-semibold border-0 shadow-lg transition-all duration-200 active:scale-[0.97]"
                  style={{
                    background: "linear-gradient(135deg, rgba(60,180,120,0.85), rgba(40,150,100,0.85))",
                    color: "white",
                    boxShadow: "0 4px 20px rgba(40,160,100,0.4)",
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submitMutation.isPending ? "신청 중..." : "신청하기"}
                </Button>
                <Button
                  onClick={() => {
                    setSelectedEmployeeId(null);
                    setSelectedRestaurantId(null);
                    setMainMenu("");
                    setSideMenu("");
                    setDrinkOption("");
                    setExtraOption("");
                  }}
                  variant="outline"
                  className="px-4 border-0"
                  style={{ background: "rgba(255,255,255,0.12)", color: "rgba(200,215,255,0.8)" }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          {/* 중복 신청 확인 대화 */}
          <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  이미 신청하셨습니다
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <div className="mt-2 space-y-2">
                    <p>기존 신청: <span className="font-semibold">{existingOrder ? formatOrderMenuDisplay(existingOrder) : "-"}</span></p>
                    <p>새로운 신청: <span className="font-semibold">{pendingSubmit ? formatOrderMenuDisplay(pendingSubmit) : "-"}</span></p>
                    <p className="text-sm mt-4">신청을 수정하시겠습니까?</p>
                  </div>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    if (pendingSubmit) {
                      submitMutation.mutate(pendingSubmit);
                      setShowDuplicateDialog(false);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  수정하기
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
