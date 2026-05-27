import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAppAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { refetch } = useAppAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.account.login.useMutation({
    onSuccess: async (data) => {
      toast.success(`환영합니다, ${data.nickname}님!`);
      // refetch로 세션 갱신 후 반환된 user 데이터로 직접 라우팅
      const freshUser = await refetch();
      if (freshUser?.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/order");
      }
    },
    onError: (error) => {
      toast.error(error.message || "로그인에 실패했습니다.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("아이디를 입력하세요.");
    if (!password.trim()) return toast.error("비밀번호를 입력하세요.");
    loginMutation.mutate({ username: username.trim(), password });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "oklch(0.96 0.015 250)" }}
    >
      <div className="w-full max-w-sm space-y-6">
        {/* 로고 */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img
              src="/manus-storage/Logo_White_22c5f440.png"
              alt="ABLE"
              className="h-10 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "oklch(0.20 0.05 250)" }}>
            저녁식사 신청 시스템
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.50 0.03 250)" }}>
            계정에 로그인하여 시작하세요
          </p>
        </div>

        <Card className="shadow-lg border-0" style={{ background: "white" }}>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg" style={{ color: "oklch(0.20 0.05 250)" }}>로그인</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: "oklch(0.35 0.04 250)" }}>
                  아이디
                </label>
                <Input
                  type="text"
                  placeholder="아이디 입력"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  disabled={loginMutation.isPending}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: "oklch(0.35 0.04 250)" }}>
                  비밀번호
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="비밀번호 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={loginMutation.isPending}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={loginMutation.isPending}
                style={{ background: "oklch(0.45 0.18 250)", color: "white" }}
              >
                {loginMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />로그인 중...</>
                ) : (
                  "로그인"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm" style={{ color: "oklch(0.50 0.03 250)" }}>
          계정이 없으신가요?{" "}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: "oklch(0.45 0.18 250)" }}>
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
