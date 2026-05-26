import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("clears session cookie and returns success", async () => {
    const cleared: string[] = [];
    const ctx: TrpcContext = {
      user: { id: 1, openId: "test", name: "Test", email: null, loginMethod: null, role: "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: (name: string) => cleared.push(name) } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(cleared.length).toBe(1);
  });
});

describe("password protection", () => {
  it("rejects wrong password for setRestaurants", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.daily.setRestaurants({ restaurantIds: [1], password: "wrong" })
    ).rejects.toThrow("비밀번호가 올바르지 않습니다.");
  });

  it("rejects wrong password for employee.add", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.employee.add({ nickname: "테스트", password: "0000" })
    ).rejects.toThrow("비밀번호가 올바르지 않습니다.");
  });

  it("rejects wrong password for employee.delete", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.employee.delete({ id: 1, password: "9999" })
    ).rejects.toThrow("비밀번호가 올바르지 않습니다.");
  });

  it("rejects wrong password for restaurant.addRestaurant", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.restaurant.addRestaurant({ categoryId: 1, name: "테스트식당", password: "bad" })
    ).rejects.toThrow("비밀번호가 올바르지 않습니다.");
  });

  it("rejects wrong password for restaurant.deleteRestaurant", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.restaurant.deleteRestaurant({ id: 1, password: "bad" })
    ).rejects.toThrow("비밀번호가 올바르지 않습니다.");
  });

  it("rejects wrong password for restaurant.addMenu", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.restaurant.addMenu({ restaurantId: 1, name: "테스트메뉴", itemType: "main", password: "bad" })
    ).rejects.toThrow("비밀번호가 올바르지 않습니다.");
  });

  it("rejects wrong password for restaurant.deleteMenu", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.restaurant.deleteMenu({ id: 1, password: "bad" })
    ).rejects.toThrow("비밀번호가 올바르지 않습니다.");
  });

  it("rejects wrong password for daily.reset", async () => {
    const caller = appRouter.createCaller(createCtx());
    await expect(
      caller.daily.reset({ password: "bad" })
    ).rejects.toThrow("비밀번호가 올바르지 않습니다.");
  });
});

describe("order.submit validation", () => {
  it("rejects order for restaurant not in today settings", async () => {
    const caller = appRouter.createCaller(createCtx());
    // restaurantId 99999 is not in today's settings
    await expect(
      caller.order.submit({ employeeId: 1, restaurantId: 99999 })
    ).rejects.toThrow();
  });
});
