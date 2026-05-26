import { and, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  dailySettings,
  employees,
  menuItems,
  orders,
  restaurantCategories,
  restaurants,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── 식당 카테고리 ───────────────────────────────────────────────────────────
export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(restaurantCategories).orderBy(restaurantCategories.sortOrder);
}

// ─── 식당 ────────────────────────────────────────────────────────────────────
export async function getAllRestaurants() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(restaurants).where(eq(restaurants.isActive, true)).orderBy(restaurants.sortOrder);
}

export async function getRestaurantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(restaurants).where(eq(restaurants.id, id)).limit(1);
  return result[0];
}

export async function addRestaurant(categoryId: number, name: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(restaurants).values({ categoryId, name, isActive: true, sortOrder: 0 });
}

export async function deleteRestaurant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(restaurants).set({ isActive: false }).where(eq(restaurants.id, id));
}

// ─── 메뉴 ────────────────────────────────────────────────────────────────────
export async function getMenusByRestaurant(restaurantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(menuItems).where(eq(menuItems.restaurantId, restaurantId)).orderBy(menuItems.sortOrder);
}

export async function getMenusByRestaurants(restaurantIds: number[]) {
  const db = await getDb();
  if (!db || restaurantIds.length === 0) return [];
  return db.select().from(menuItems).where(inArray(menuItems.restaurantId, restaurantIds)).orderBy(menuItems.sortOrder);
}

export async function addMenuItem(restaurantId: number, name: string, itemType: "main" | "side" | "drink" | "option") {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(menuItems).values({ restaurantId, name, itemType, sortOrder: 0 });
}

export async function deleteMenuItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(menuItems).where(eq(menuItems.id, id));
}

// ─── 직원 ────────────────────────────────────────────────────────────────────
export async function getAllEmployees() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(employees).where(eq(employees.isActive, true)).orderBy(employees.sortOrder, employees.nickname);
}

export async function addEmployee(nickname: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(employees).values({ nickname, sortOrder: 0, isActive: true });
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(employees).set({ isActive: false }).where(eq(employees.id, id));
}

// ─── 일일 설정 ───────────────────────────────────────────────────────────────
export async function getDailySettings(date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailySettings).where(
    and(sql`DATE(${dailySettings.settingDate}) = ${date}`, eq(dailySettings.isActive, true))
  );
}

export async function setDailyRestaurants(date: string, restaurantIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // 기존 설정 비활성화
  await db.update(dailySettings).set({ isActive: false }).where(sql`DATE(${dailySettings.settingDate}) = ${date}`);
  // 새 설정 삽입
  if (restaurantIds.length > 0) {
    await db.insert(dailySettings).values(
      restaurantIds.map((rid) => ({ settingDate: date as unknown as Date, restaurantId: rid, isActive: true, isClosed: false }))
    );
  }
}

export async function resetDay(date: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(dailySettings).set({ isActive: false }).where(sql`DATE(${dailySettings.settingDate}) = ${date}`);
  await db.delete(orders).where(sql`DATE(${orders.orderDate}) = ${date}`);
}

// ─── 주문 ────────────────────────────────────────────────────────────────────
export async function getOrdersByDate(date: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(sql`DATE(${orders.orderDate}) = ${date}`).orderBy(orders.createdAt);
}

export async function getOrderByEmployeeDate(employeeId: number, date: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(
    and(eq(orders.employeeId, employeeId), sql`DATE(${orders.orderDate}) = ${date}`)
  ).limit(1);
  return result[0];
}

export async function upsertOrder(data: {
  orderDate: string;
  employeeId: number;
  restaurantId: number;
  mainMenuId?: number;
  mainMenuName?: string;
  sideMenuId?: number;
  sideMenuName?: string;
  drinkOption?: string;
  extraOption?: string;
  note?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getOrderByEmployeeDate(data.employeeId, data.orderDate);
  if (existing) {
    await db.update(orders).set({
      restaurantId: data.restaurantId,
      mainMenuId: data.mainMenuId ?? null,
      mainMenuName: data.mainMenuName ?? null,
      sideMenuId: data.sideMenuId ?? null,
      sideMenuName: data.sideMenuName ?? null,
      drinkOption: data.drinkOption ?? null,
      extraOption: data.extraOption ?? null,
      note: data.note ?? null,
    }).where(eq(orders.id, existing.id));
    return existing.id;
  } else {
    const result = await db.insert(orders).values({
      orderDate: data.orderDate as unknown as Date,
      employeeId: data.employeeId,
      restaurantId: data.restaurantId,
      mainMenuId: data.mainMenuId ?? null,
      mainMenuName: data.mainMenuName ?? null,
      sideMenuId: data.sideMenuId ?? null,
      sideMenuName: data.sideMenuName ?? null,
      drinkOption: data.drinkOption ?? null,
      extraOption: data.extraOption ?? null,
      note: data.note ?? null,
    });
    return (result as any)[0]?.insertId;
  }
}

export async function deleteOrder(employeeId: number, date: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(orders).where(
    and(eq(orders.employeeId, employeeId), sql`DATE(${orders.orderDate}) = ${date}`)
  );
}
