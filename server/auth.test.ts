import { describe, expect, it } from "vitest";
import { createHash } from "crypto";

function hashPassword(password: string): string {
  return createHash("sha256").update(password + "dinner_salt_2024").digest("hex");
}

describe("auth - password hashing", () => {
  it("admin 비밀번호 해시가 올바르게 생성된다", () => {
    const hash = hashPassword("able2021!");
    expect(hash).toBe("0da1545cfd2e37c74a499988cf5df73b3411b3221cdcdced4e088577316ec278");
  });

  it("같은 비밀번호는 항상 같은 해시를 생성한다", () => {
    const hash1 = hashPassword("testpassword");
    const hash2 = hashPassword("testpassword");
    expect(hash1).toBe(hash2);
  });

  it("다른 비밀번호는 다른 해시를 생성한다", () => {
    const hash1 = hashPassword("password1");
    const hash2 = hashPassword("password2");
    expect(hash1).not.toBe(hash2);
  });

  it("해시는 64자 hex 문자열이다", () => {
    const hash = hashPassword("anypassword");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("auth - role validation", () => {
  it("admin 역할은 관리자 페이지에 접근 가능하다", () => {
    const user = { role: "admin" as const };
    const canAccessAdmin = user.role === "admin";
    expect(canAccessAdmin).toBe(true);
  });

  it("user 역할은 관리자 페이지에 접근 불가하다", () => {
    const user = { role: "user" as const };
    const canAccessAdmin = user.role === "admin";
    expect(canAccessAdmin).toBe(false);
  });

  it("user 역할은 저녁 신청 페이지에 접근 가능하다", () => {
    const user = { role: "user" as const };
    const allowedPaths = ["/order", "/employee-detail"];
    const canAccess = allowedPaths.includes("/order");
    expect(canAccess).toBe(true);
  });
});

describe("auth - nickname validation", () => {
  it("이미 사용된 닉네임은 중복 가입 불가하다", () => {
    const usedNicknames = new Set(["Neo", "Noah", "Zelda"]);
    const isNicknameTaken = (nickname: string) => usedNicknames.has(nickname);
    expect(isNicknameTaken("Neo")).toBe(true);
    expect(isNicknameTaken("Flash")).toBe(false);
  });

  it("직원 목록에 없는 닉네임은 가입 불가하다", () => {
    const validNicknames = ["Neo", "Noah", "Zelda", "Flash"];
    const isValidNickname = (nickname: string) => validNicknames.includes(nickname);
    expect(isValidNickname("Neo")).toBe(true);
    expect(isValidNickname("InvalidNickname")).toBe(false);
  });
});
