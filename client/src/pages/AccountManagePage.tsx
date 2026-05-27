import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Shield, User } from "lucide-react";

export default function AccountManagePage() {
  const { user, isAdmin, isLoading } = useAppAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

  // 관리자 아닌 경우 리다이렉트
  if (!isLoading && (!user || !isAdmin)) {
    setLocation("/");
    return null;
  }

  const { data: accounts = [], isLoading: loadingAccounts } = trpc.account.listAll.useQuery(
    { adminUsername: user?.username ?? "", adminPassword: "" },
    { enabled: !!user && isAdmin }
  );

  const filtered = accounts.filter(
    (a: any) =>
      a.username.toLowerCase().includes(search.toLowerCase()) ||
      a.nickname.toLowerCase().includes(search.toLowerCase())
  );

  const togglePassword = (id: number) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.45 0.18 250)" }} />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "oklch(0.20 0.05 250)" }}>
          계정 관리
        </h1>
        <p className="text-sm" style={{ color: "oklch(0.50 0.03 250)" }}>
          가입된 모든 회원의 계정 정보를 확인합니다.
        </p>
      </div>

      {/* 검색 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="아이디 또는 닉네임 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="border-0 shadow-sm" style={{ background: "oklch(0.92 0.04 250)" }}>
          <CardContent className="py-3 px-4">
            <div className="text-2xl font-bold" style={{ color: "oklch(0.30 0.12 250)" }}>
              {accounts.length}
            </div>
            <div className="text-xs" style={{ color: "oklch(0.45 0.08 250)" }}>전체 계정</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm" style={{ background: "oklch(0.92 0.04 250)" }}>
          <CardContent className="py-3 px-4">
            <div className="text-2xl font-bold" style={{ color: "oklch(0.30 0.12 250)" }}>
              {accounts.filter((a: any) => a.role === "admin").length}
            </div>
            <div className="text-xs" style={{ color: "oklch(0.45 0.08 250)" }}>관리자 계정</div>
          </CardContent>
        </Card>
      </div>

      {/* 계정 목록 */}
      {loadingAccounts ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "oklch(0.45 0.18 250)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          {accounts.length === 0 ? "가입된 계정이 없습니다." : "검색 결과가 없습니다."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((account: any) => (
            <Card key={account.id} className="border shadow-sm">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{
                        background: account.role === "admin" ? "oklch(0.85 0.08 250)" : "oklch(0.92 0.03 250)",
                      }}
                    >
                      {account.role === "admin" ? (
                        <Shield className="w-4 h-4" style={{ color: "oklch(0.40 0.15 250)" }} />
                      ) : (
                        <User className="w-4 h-4" style={{ color: "oklch(0.55 0.05 250)" }} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm" style={{ color: "oklch(0.20 0.05 250)" }}>
                          {account.username}
                        </span>
                        <Badge
                          variant="secondary"
                          className="text-xs px-1.5 py-0"
                          style={{
                            background: account.role === "admin" ? "oklch(0.85 0.08 250)" : "oklch(0.92 0.03 250)",
                            color: account.role === "admin" ? "oklch(0.35 0.15 250)" : "oklch(0.45 0.05 250)",
                          }}
                        >
                          {account.role === "admin" ? "관리자" : "일반회원"}
                        </Badge>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: "oklch(0.50 0.03 250)" }}>
                        닉네임: <span className="font-medium">{account.nickname}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-xs font-medium" style={{ color: "oklch(0.40 0.05 250)" }}>
                        비밀번호 (해시)
                      </div>
                      <div
                        className="text-xs font-mono cursor-pointer select-all"
                        style={{ color: "oklch(0.55 0.05 250)", maxWidth: "180px", wordBreak: "break-all" }}
                        onClick={() => togglePassword(account.id)}
                        title="클릭하여 전체 보기"
                      >
                        {showPasswords[account.id]
                          ? account.passwordHash
                          : account.passwordHash.slice(0, 16) + "..."}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs" style={{ color: "oklch(0.60 0.03 250)" }}>
                  가입일: {new Date(account.createdAt).toLocaleString("ko-KR")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
