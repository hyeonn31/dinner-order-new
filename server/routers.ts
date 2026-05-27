import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { sql, eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { employees, restaurants, menuItems, dailySettings, orders } from "../drizzle/schema";
import {
  getAllRestaurantsWithCategories,
  getRestaurantCategories,
  insertRestaurant,
  getMenusByRestaurant,
  getAllEmployees,
  getTodaySettings,
  setTodayRestaurants,
  getTodayOrders,
  getOrderByEmployee,
  getOrderByEmployeeWithRestaurant,
  upsertOrder,
  deleteOrder,
  resetTodayData,
  getOrderSummary,
  getOrderHistory,
  getDb,
  getAccountByUsername,
  getAccountByNickname,
  createAccount,
  getAllAccounts,
  getUsedNicknames,
} from "./db";
import { createHash } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { parse as parseCookies } from "cookie";

const ADMIN_PASSWORD = "2101";
const APP_COOKIE_NAME = "dinner_session";

function adminProcedure(password: string) {
  if (password !== ADMIN_PASSWORD) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin password" });
  }
}

function getToday() {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "dinner_salt_2024").digest("hex");
}

async function signToken(payload: { id: number; username: string; nickname: string; role: string }) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dinner_jwt_secret_2024");
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

async function verifyToken(token: string) {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dinner_jwt_secret_2024");
    const { payload } = await jwtVerify(token, secret);
    return payload as { id: number; username: string; nickname: string; role: string };
  } catch {
    return null;
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── 자체 인증 ────────────────────────────────────────────
  account: router({
    // 현재 로그인 세션 확인
    session: publicProcedure.query(async ({ ctx }) => {
      const _c = ctx.req.headers.cookie ? parseCookies(ctx.req.headers.cookie) : {};
      const token = _c[APP_COOKIE_NAME];
      if (!token) return null;
      const payload = await verifyToken(token);
      if (!payload) return null;
      return { id: payload.id, username: payload.username, nickname: payload.nickname, role: payload.role };
    }),

    // 가입 가능한 닉네임 목록 (아직 사용되지 않은 닉네임)
    availableNicknames: publicProcedure.query(async () => {
      const allEmployees = await getAllEmployees();
      const usedNicknames = await getUsedNicknames();
      const usedSet = new Set(usedNicknames);
      return allEmployees
        .filter(e => !usedSet.has(e.nickname))
        .map(e => ({ id: e.id, nickname: e.nickname }));
    }),

    // 회원가입
    register: publicProcedure
      .input(z.object({
        username: z.string().min(3).max(50),
        password: z.string().min(4),
        nickname: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        // 닉네임이 직원 목록에 있는지 확인
        const allEmployees = await getAllEmployees();
        const validNickname = allEmployees.find(e => e.nickname === input.nickname);
        if (!validNickname) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "유효하지 않은 닉네임입니다. 직원 목록에 있는 닉네임만 사용 가능합니다." });
        }

        // 닉네임 중복 확인
        const existingByNickname = await getAccountByNickname(input.nickname);
        if (existingByNickname) {
          throw new TRPCError({ code: "CONFLICT", message: "이미 사용 중인 닉네임입니다." });
        }

        // 아이디 중복 확인
        const existingByUsername = await getAccountByUsername(input.username);
        if (existingByUsername) {
          throw new TRPCError({ code: "CONFLICT", message: "이미 사용 중인 아이디입니다." });
        }

        const passwordHash = hashPassword(input.password);
        const account = await createAccount({
          username: input.username,
          passwordHash,
          nickname: input.nickname,
          role: "user",
          employeeId: validNickname.id,
        });

        // 자동 로그인
        const token = await signToken({ id: account.id, username: account.username, nickname: account.nickname, role: account.role });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(APP_COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 });

        return { success: true, username: account.username, nickname: account.nickname, role: account.role };
      }),

    // 로그인
    login: publicProcedure
      .input(z.object({
        username: z.string(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const account = await getAccountByUsername(input.username);
        if (!account) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "아이디 또는 비밀번호가 올바르지 않습니다." });
        }

        const passwordHash = hashPassword(input.password);
        if (account.passwordHash !== passwordHash) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "아이디 또는 비밀번호가 올바르지 않습니다." });
        }

        const token = await signToken({ id: account.id, username: account.username, nickname: account.nickname, role: account.role });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(APP_COOKIE_NAME, token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 });

        return { success: true, username: account.username, nickname: account.nickname, role: account.role };
      }),

    // 로그아웃
    logout: publicProcedure.mutation(async ({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(APP_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

    // 관리자 전용: 전체 계정 목록
    listAll: publicProcedure
      .input(z.object({ adminUsername: z.string(), adminPassword: z.string() }))
      .query(async ({ input, ctx }) => {
        // 세션에서 관리자 확인
        const _cookies = ctx.req.headers.cookie ? parseCookies(ctx.req.headers.cookie) : {};
        const token = _cookies[APP_COOKIE_NAME];
        if (!token) throw new TRPCError({ code: "UNAUTHORIZED", message: "로그인이 필요합니다." });
        const payload = await verifyToken(token);
        if (!payload || payload.role !== "admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "관리자 권한이 필요합니다." });
        }
        return await getAllAccounts();
      }),
  }),

  // ─── 식당 ─────────────────────────────────────────────────
  restaurant: router({
    listCategories: publicProcedure.query(async () => {
      return await getRestaurantCategories();
    }),
    list: publicProcedure.query(async () => {
      return await getAllRestaurantsWithCategories();
    }),
    menus: publicProcedure
      .input(z.object({ restaurantId: z.number() }))
      .query(async ({ input }) => {
        return await getMenusByRestaurant(input.restaurantId);
      }),
    addRestaurant: publicProcedure.input(z.object({ name: z.string().min(1), categoryId: z.number(), password: z.string() })).mutation(async ({ input }) => {
      adminProcedure(input.password);
      try {
        return await insertRestaurant({ name: input.name.trim(), categoryId: input.categoryId });
      } catch (error) {
        if (error instanceof Error && error.message === "INVALID_CATEGORY") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "유효하지 않은 카테고리입니다" });
        }
        if (error instanceof Error && error.message === "Database not available") {
          throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "데이터베이스에 연결할 수 없습니다" });
        }
        throw error;
      }
    }),
    deleteRestaurant: publicProcedure.input(z.object({ restaurantId: z.number(), password: z.string() })).mutation(async ({ input }) => {
      adminProcedure(input.password);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(restaurants).where(eq(restaurants.id, input.restaurantId));
      return { success: true };
    }),
    addMenu: publicProcedure.input(z.object({ restaurantId: z.number(), name: z.string().min(1), itemType: z.string(), password: z.string() })).mutation(async ({ input }) => {
      adminProcedure(input.password);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const existing = await db.select().from(menuItems).where(eq(menuItems.restaurantId, input.restaurantId)).limit(1);
      const isDuplicate = existing.some(m => m.name === input.name && m.itemType === input.itemType);
      if (isDuplicate) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "이미 존재하는 메뉴입니다" });
      }
      await db.insert(menuItems).values({ restaurantId: input.restaurantId, name: input.name, itemType: input.itemType as any });
      return { success: true };
    }),
    deleteMenu: publicProcedure.input(z.object({ menuId: z.number(), password: z.string() })).mutation(async ({ input }) => {
      adminProcedure(input.password);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.delete(menuItems).where(eq(menuItems.id, input.menuId));
      return { success: true };
    }),
  }),

  // ─── 직원 ─────────────────────────────────────────────────
  employee: router({
    list: publicProcedure.query(async () => {
      return await getAllEmployees();
    }),
    add: publicProcedure.input(z.object({ nickname: z.string().min(1), password: z.string() })).mutation(async ({ input }) => {
      adminProcedure(input.password);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const maxSort = await db.select({ max: sql<number>`MAX(${employees.sortOrder})` }).from(employees);
      const nextSort = (maxSort[0]?.max || 0) + 1;
      await db.insert(employees).values({ nickname: input.nickname, sortOrder: nextSort, isActive: true });
      return { success: true };
    }),
    delete: publicProcedure.input(z.object({ employeeId: z.number(), password: z.string() })).mutation(async ({ input }) => {
      adminProcedure(input.password);
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(employees).set({ isActive: false }).where(eq(employees.id, input.employeeId));
      return { success: true };
    }),
  }),

  // ─── 일일 설정 ─────────────────────────────────────────────
  daily: router({
    todayRestaurants: publicProcedure.query(async () => {
      const today = getToday();
      return await getTodaySettings(today);
    }),
    setRestaurants: publicProcedure
      .input(z.object({ restaurantIds: z.array(z.number()), password: z.string() }))
      .mutation(async ({ input }) => {
        adminProcedure(input.password);
        const today = getToday();
        await setTodayRestaurants(today, input.restaurantIds);
        return { success: true, today };
      }),
    reset: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input }) => {
        adminProcedure(input.password);
        const today = getToday();
        await resetTodayData(today);
        return { success: true };
      }),
    toggleClosed: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input }) => {
        adminProcedure(input.password);
        const today = getToday();
        const db = await getDb();
        if (!db) throw new Error("Database not available");
        const existing = await db.select().from(dailySettings).where(sql`DATE(settingDate) = ${today}`).limit(1);
        if (existing.length === 0) {
          throw new TRPCError({ code: "NOT_FOUND", message: "오늘의 설정이 없습니다" });
        }
        const current = existing[0];
        await db.update(dailySettings).set({ isClosed: !current.isClosed }).where(eq(dailySettings.id, current.id));
        return { success: true, isClosed: !current.isClosed };
      }),
  }),

  // ─── 주문 ─────────────────────────────────────────────────
  order: router({
    todayAll: publicProcedure.query(async () => {
      const today = getToday();
      return await getTodayOrders(today);
    }),
    myOrder: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const today = getToday();
        return await getOrderByEmployee(today, input.employeeId);
      }),
    check: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .query(async ({ input }) => {
        const today = getToday();
        const existing = await getOrderByEmployeeWithRestaurant(today, input.employeeId);
        return existing;
      }),
    submit: publicProcedure
      .input(z.object({
        employeeId: z.number(),
        restaurantId: z.number(),
        mainMenuName: z.string().optional(),
        sideMenuName: z.string().optional(),
        drinkOption: z.string().optional(),
        extraOption: z.string().optional(),
        note: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const today = getToday();
        const result = await upsertOrder({ today, ...input });
        return { success: true, ...result };
      }),
    cancel: publicProcedure
      .input(z.object({ employeeId: z.number() }))
      .mutation(async ({ input }) => {
        const today = getToday();
        await deleteOrder(today, input.employeeId);
        return { success: true };
      }),
    summary: publicProcedure.query(async () => {
      const today = getToday();
      return await getOrderSummary(today);
    }),
    getHistory: publicProcedure
      .input(z.object({
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        employeeId: z.number().optional(),
        restaurantId: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await getOrderHistory(input);
      }),
    clearAll: publicProcedure
      .input(z.object({ password: z.string() }))
      .mutation(async ({ input }) => {
        adminProcedure(input.password);
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database connection failed" });
        await db.delete(orders);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
