import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import {
  addEmployee,
  addMenuItem,
  addRestaurant,
  deleteEmployee,
  deleteMenuItem,
  deleteOrder,
  deleteRestaurant,
  getAllCategories,
  getAllEmployees,
  getAllRestaurants,
  getDailySettings,
  getMenusByRestaurant,
  getMenusByRestaurants,
  getOrdersByDate,
  resetDay,
  setDailyRestaurants,
  upsertOrder,
} from "./db";

const ADMIN_PASSWORD = "2101";

function getTodayKST(): string {
  const now = new Date();
  // KST = UTC+9
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function checkPassword(password: string) {
  if (password !== ADMIN_PASSWORD) {
    throw new TRPCError({ code: "FORBIDDEN", message: "비밀번호가 올바르지 않습니다." });
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── 식당 카테고리 ────────────────────────────────────────────────────────
  category: router({
    list: publicProcedure.query(async () => {
      return getAllCategories();
    }),
  }),

  // ─── 식당 ─────────────────────────────────────────────────────────────────
  restaurant: router({
    list: publicProcedure.query(async () => {
      const [cats, rests] = await Promise.all([getAllCategories(), getAllRestaurants()]);
      return { categories: cats, restaurants: rests };
    }),

    menus: publicProcedure
      .input(z.object({ restaurantId: z.number() }))
      .query(async ({ input }) => {
        return getMenusByRestaurant(input.restaurantId);
      }),

    addRestaurant: publicProcedure
      .input(z.object({ categoryId: z.number(), name: z.string().min(1), password: z.string() }))
      .mutation(async ({ input }) => {
        checkPassword(input.password);
        await addRestaurant(input.categoryId, input.name);
        return { success: true };
      }),

    deleteRestaurant: publicProcedure
      .input(z.object({ id: z.number(), password: z.string() }))
      .mutation(async ({ input }) => {
        checkPassword(input.password);
        await deleteRestaurant(input.id);
        return { success: true };
      }),

    addMenu: publicProcedure
      .input(
        z.object({
          restaurantId: z.number(),
          name: z.string().min(1),
          itemType: z.enum(["main", "side", "drink", "option"]),
          password: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        checkPassword(input.password);
        await addMenuItem(input.restaurantId, input.name, input.itemType);
        return { success: true };
      }),

    deleteMenu: publicProcedure
      .input(z.object({ id: z.number(), password: z.string() }))
      .mutation(async ({ input }) => {
        checkPassword(input.password);
        await deleteMenuItem(input.id);
        return { success: true };
      }),
  }),

  // ─── 직원 ─────────────────────────────────────────────────────────────────
  employee: router({
    list: publicProcedure.query(async () => {
      return getAllEmployees();
    }),

    add: publicProcedure
      .input(z.object({ nickname: z.string().min(1), password: z.string() }))
      .mutation(async ({ input }) => {
        checkPassword(input.password);
        await addEmployee(input.nickname);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number(), password: z.string() }))
      .mutation(async ({ input }) => {
        checkPassword(input.password);
        await deleteEmployee(input.id);
        return { success: true };
      }),
  }),

  // ─── 일일 설정 ────────────────────────────────────────────────────────────
  daily: router({
    getToday: publicProcedure.query(async () => {
      const today = getTodayKST();
      const settings = await getDailySettings(today);
      const restaurantIds = settings.map((s) => s.restaurantId);
      const [cats, rests, menus] = await Promise.all([
        getAllCategories(),
        getAllRestaurants(),
        getMenusByRestaurants(restaurantIds),
      ]);
      return { today, settings, categories: cats, restaurants: rests, menus };
    }),

    setRestaurants: publicProcedure
      .input(z.object({ restaurantIds: z.array(z.number()), password: z.string() }))
      .mutation(async ({ input }) => {
        checkPassword(input.password);
        const today = getTodayKST();
        await setDailyRestaurants(today, input.restaurantIds);
        return { success: true };
      }),

    reset: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input }) => {
        checkPassword(input.password);
        const today = getTodayKST();
        await resetDay(today);
        return { success: true };
      }),
  }),

  // ─── 주문 ─────────────────────────────────────────────────────────────────
  order: router({
    todayList: publicProcedure.query(async () => {
      const today = getTodayKST();
      const [orderList, employees, settings] = await Promise.all([
        getOrdersByDate(today),
        getAllEmployees(),
        getDailySettings(today),
      ]);
      const employeeMap = new Map(employees.map((e) => [e.id, e.nickname]));
      const settingRestaurantIds = new Set(settings.map((s) => s.restaurantId));
      const rests = await getAllRestaurants();
      const restaurantMap = new Map(rests.map((r) => [r.id, r.name]));
      return orderList.map((o) => ({
        ...o,
        employeeName: employeeMap.get(o.employeeId) ?? "알 수 없음",
        restaurantName: restaurantMap.get(o.restaurantId) ?? "알 수 없음",
      }));
    }),

    myOrder: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const today = getTodayKST();
        const orderList = await getOrdersByDate(today);
        return orderList.find((o) => o.employeeId === input.employeeId) ?? null;
      }),

    submit: publicProcedure
      .input(
        z.object({
          employeeId: z.number(),
          restaurantId: z.number(),
          mainMenuId: z.number().optional(),
          mainMenuName: z.string().optional(),
          sideMenuId: z.number().optional(),
          sideMenuName: z.string().optional(),
          drinkOption: z.string().optional(),
          extraOption: z.string().optional(),
          note: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const today = getTodayKST();
        // 오늘 설정된 식당인지 확인
        const settings = await getDailySettings(today);
        const validIds = new Set(settings.map((s) => s.restaurantId));
        if (!validIds.has(input.restaurantId)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "오늘 선택된 식당이 아닙니다." });
        }
        await upsertOrder({ ...input, orderDate: today });
        return { success: true };
      }),

    cancel: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .mutation(async ({ input }) => {
        const today = getTodayKST();
        await deleteOrder(input.employeeId, today);
        return { success: true };
      }),

    summary: publicProcedure.query(async () => {
      const today = getTodayKST();
      const [orderList, employees, rests] = await Promise.all([
        getOrdersByDate(today),
        getAllEmployees(),
        getAllRestaurants(),
      ]);
      const employeeMap = new Map(employees.map((e) => [e.id, e.nickname]));
      const restaurantMap = new Map(rests.map((r) => [r.id, r.name]));

      // 식당별 그룹핑
      const grouped: Record<number, {
        restaurantName: string;
        orders: Array<{
          employeeName: string;
          mainMenuName: string | null;
          sideMenuName: string | null;
          drinkOption: string | null;
          extraOption: string | null;
          note: string | null;
        }>;
      }> = {};

      for (const o of orderList) {
        if (!grouped[o.restaurantId]) {
          grouped[o.restaurantId] = {
            restaurantName: restaurantMap.get(o.restaurantId) ?? "알 수 없음",
            orders: [],
          };
        }
        grouped[o.restaurantId].orders.push({
          employeeName: employeeMap.get(o.employeeId) ?? "알 수 없음",
          mainMenuName: o.mainMenuName ?? null,
          sideMenuName: o.sideMenuName ?? null,
          drinkOption: o.drinkOption ?? null,
          extraOption: o.extraOption ?? null,
          note: o.note ?? null,
        });
      }

      // 복사용 텍스트 생성
      let copyText = `📋 ${today} 주문 취합\n\n`;
      for (const group of Object.values(grouped)) {
        copyText += `【${group.restaurantName}】 ${group.orders.length}명\n`;
        for (const ord of group.orders) {
          const parts: string[] = [];
          if (ord.mainMenuName) parts.push(ord.mainMenuName);
          if (ord.sideMenuName) parts.push(`사이드: ${ord.sideMenuName}`);
          if (ord.drinkOption) parts.push(`음료: ${ord.drinkOption}`);
          if (ord.extraOption) parts.push(ord.extraOption);
          if (ord.note) parts.push(`(${ord.note})`);
          copyText += `  - ${ord.employeeName}: ${parts.join(", ") || "메뉴 미선택"}\n`;
        }
        copyText += "\n";
      }

      return {
        today,
        totalCount: orderList.length,
        grouped: Object.values(grouped),
        copyText,
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
