import { useState, useMemo, useEffect } from "react";
import { getHistoryDefaultDateRange } from "@shared/dates";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export function HistoryPage() {
  const [location] = useLocation();
  const defaultRange = () => getHistoryDefaultDateRange();

  const [startDate, setStartDate] = useState(() => defaultRange().startDate);
  const [endDate, setEndDate] = useState(() => defaultRange().endDate);

  useEffect(() => {
    if (location !== "/history") return;
    const { startDate: start, endDate: end } = defaultRange();
    setStartDate(start);
    setEndDate(end);
  }, [location]);

  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>("");

  const { data: employees = [], isLoading: employeesLoading } = trpc.employee.list.useQuery();
  const { data: restaurants = [], isLoading: restaurantsLoading } = trpc.restaurant.list.useQuery();
  const { data: history = [], isLoading: historyLoading } = trpc.order.getHistory.useQuery(
    {
      startDate,
      endDate,
      employeeId: selectedEmployee ? parseInt(selectedEmployee) : undefined,
      restaurantId: selectedRestaurant ? parseInt(selectedRestaurant) : undefined,
    },
    { enabled: !!startDate && !!endDate }
  );

  const stats = useMemo(() => {
    const totalOrders = history.length;
    const uniqueDates = new Set(history.map((h) => new Date(h.orderDate).toLocaleDateString())).size;
    const uniqueEmployees = new Set(history.map((h) => h.employeeId)).size;
    const uniqueRestaurants = new Set(history.map((h) => h.restaurantId)).size;

    const menuCount = new Map<string, number>();
    history.forEach((h) => {
      const menu = h.mainMenuName || "메뉴 미선택";
      menuCount.set(menu, (menuCount.get(menu) || 0) + 1);
    });
    const topMenus = Array.from(menuCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const restaurantCount = new Map<string, number>();
    history.forEach((h) => {
      restaurantCount.set(h.restaurantName, (restaurantCount.get(h.restaurantName) || 0) + 1);
    });
    const topRestaurants = Array.from(restaurantCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { totalOrders, uniqueDates, uniqueEmployees, uniqueRestaurants, topMenus, topRestaurants };
  }, [history]);

  const handleReset = () => {
    const { startDate: start, endDate: end } = defaultRange();
    setStartDate(start);
    setEndDate(end);
    setSelectedEmployee("");
    setSelectedRestaurant("");
  };

  const maxEndDate = defaultRange().endDate;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6" style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>
        주문 이력 조회
      </h1>

      {/* 필터 섹션 */}
      <div className="mb-6 p-6" style={glassCard}>
        <h2 className="text-base font-semibold mb-4" style={{ color: "rgba(200,215,255,0.9)" }}>필터 설정</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "rgba(180,200,255,0.75)" }}>시작 날짜</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
              className="focus-visible:ring-white/30 placeholder:text-white/40"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "rgba(180,200,255,0.75)" }}>종료 날짜</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={maxEndDate}
              className="focus-visible:ring-white/30"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "rgba(180,200,255,0.75)" }}>직원</label>
            <Select value={selectedEmployee} onValueChange={(val) => setSelectedEmployee(val === 'all' ? '' : val)} disabled={employeesLoading}>
              <SelectTrigger className="border-0 text-white focus:ring-white/30" style={{ background: "rgba(255,255,255,0.12)" }}>
                <SelectValue placeholder={employeesLoading ? "로딩 중..." : "전체 직원"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 직원</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>{emp.nickname}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block" style={{ color: "rgba(180,200,255,0.75)" }}>식당</label>
            <Select value={selectedRestaurant} onValueChange={(val) => setSelectedRestaurant(val === 'all' ? '' : val)} disabled={restaurantsLoading}>
              <SelectTrigger className="border-0 text-white focus:ring-white/30" style={{ background: "rgba(255,255,255,0.12)" }}>
                <SelectValue placeholder={restaurantsLoading ? "로딩 중..." : "전체 식당"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 식당</SelectItem>
                {restaurants.map((rest) => (
                  <SelectItem key={rest.id} value={rest.id.toString()}>{rest.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button
          onClick={handleReset}
          variant="outline"
          className="border-0"
          style={{ background: "rgba(255,255,255,0.12)", color: "rgba(200,215,255,0.9)" }}
        >
          필터 초기화
        </Button>
      </div>

      {/* 통계 섹션 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "총 주문 건수", value: stats.totalOrders, accent: "rgba(150,170,255,1)" },
          { label: "주문 날짜", value: stats.uniqueDates, accent: "rgba(120,220,180,1)" },
          { label: "참여 직원", value: stats.uniqueEmployees, accent: "rgba(200,160,255,1)" },
          { label: "이용 식당", value: stats.uniqueRestaurants, accent: "rgba(255,180,120,1)" },
        ].map(({ label, value, accent }) => (
          <div key={label} className="p-5 text-center" style={glassCard}>
            <div className="text-3xl font-bold mb-1" style={{ color: accent }}>{value}</div>
            <div className="text-sm" style={{ color: "rgba(180,200,255,0.65)" }}>{label}</div>
          </div>
        ))}
      </div>

      {/* 인기 메뉴 및 식당 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="p-6" style={glassCard}>
          <h2 className="text-base font-semibold mb-4" style={{ color: "rgba(200,215,255,0.9)" }}>인기 메뉴 TOP 5</h2>
          <div className="space-y-2">
            {stats.topMenus.length > 0 ? (
              stats.topMenus.map(([menu, count], idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <span className="text-sm" style={{ color: "rgba(200,215,255,0.85)" }}>{idx + 1}. {menu}</span>
                  <span className="font-bold text-sm" style={{ color: "rgba(150,170,255,1)" }}>{count}건</span>
                </div>
              ))
            ) : (
              <p className="text-sm" style={{ color: "rgba(180,200,255,0.5)" }}>데이터가 없습니다</p>
            )}
          </div>
        </div>

        <div className="p-6" style={glassCard}>
          <h2 className="text-base font-semibold mb-4" style={{ color: "rgba(200,215,255,0.9)" }}>인기 식당 TOP 5</h2>
          <div className="space-y-2">
            {stats.topRestaurants.length > 0 ? (
              stats.topRestaurants.map(([restaurant, count], idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 px-3 rounded-lg" style={{ background: "rgba(255,255,255,0.07)" }}>
                  <span className="text-sm" style={{ color: "rgba(200,215,255,0.85)" }}>{idx + 1}. {restaurant}</span>
                  <span className="font-bold text-sm" style={{ color: "rgba(120,220,180,1)" }}>{count}건</span>
                </div>
              ))
            ) : (
              <p className="text-sm" style={{ color: "rgba(180,200,255,0.5)" }}>데이터가 없습니다</p>
            )}
          </div>
        </div>
      </div>

      {/* 주문 이력 테이블 */}
      <div className="p-6" style={glassCard}>
        <h2 className="text-base font-semibold mb-4" style={{ color: "rgba(200,215,255,0.9)" }}>주문 상세 내역</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
                {["날짜", "직원", "식당", "메인메뉴", "사이드", "음료", "추가옵션", "특수요청"].map(h => (
                  <TableHead key={h} style={{ color: "rgba(180,200,255,0.7)" }}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {historyLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8" style={{ color: "rgba(180,200,255,0.55)" }}>
                    로딩 중...
                  </TableCell>
                </TableRow>
              ) : history.length > 0 ? (
                history.map((order) => (
                  <TableRow key={order.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <TableCell className="text-sm" style={{ color: "rgba(200,215,255,0.85)" }}>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-sm" style={{ color: "rgba(200,215,255,0.85)" }}>{order.employeeNickname}</TableCell>
                    <TableCell className="text-sm" style={{ color: "rgba(200,215,255,0.85)" }}>{order.restaurantName}</TableCell>
                    <TableCell className="text-sm" style={{ color: "rgba(200,215,255,0.85)" }}>{order.mainMenuName || "-"}</TableCell>
                    <TableCell className="text-sm" style={{ color: "rgba(200,215,255,0.85)" }}>{order.sideMenuName || "-"}</TableCell>
                    <TableCell className="text-sm" style={{ color: "rgba(200,215,255,0.85)" }}>{order.drinkOption || "-"}</TableCell>
                    <TableCell className="text-sm" style={{ color: "rgba(200,215,255,0.85)" }}>{order.extraOption || "-"}</TableCell>
                    <TableCell className="text-sm" style={{ color: "rgba(200,215,255,0.85)" }}>{order.note || "-"}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8" style={{ color: "rgba(180,200,255,0.55)" }}>
                    조회 결과가 없습니다
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
