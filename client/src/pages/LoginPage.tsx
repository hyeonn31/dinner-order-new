import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: "url('/manus-storage/bg_anime_fb0cb638.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* 어두운 오버레이 */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, rgba(10,15,40,0.65) 0%, rgba(20,10,50,0.55) 100%)" }}
      />

      {/* 콘텐츠 */}
      <div className="relative z-10 w-full max-w-sm space-y-5">
        {/* 로고 & 타이틀 */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <img
              src="/manus-storage/Logo_White_22c5f440.png"
              alt="ABLE"
              className="h-10 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl font-bold drop-shadow-md" style={{ color: "white" }}>
            저녁식사 신청 시스템
          </h1>
          <p className="text-sm" style={{ color: "rgba(200,210,255,0.85)" }}>
            계정에 로그인하여 시작하세요
          </p>
        </div>

        {/* 로그인 카드 */}
        <div
          className="rounded-2xl p-6 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          <h2 className="text-lg font-bold mb-5" style={{ color: "white" }}>로그인</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: "rgba(200,210,255,0.9)" }}>
                아이디
              </label>
              <Input
                type="text"
                placeholder="아이디 입력"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loginMutation.isPending}
                className="h-11 border-0 text-white placeholder:text-white/40 focus-visible:ring-white/40"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: "rgba(200,210,255,0.9)" }}>
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
                  className="h-11 pr-10 border-0 text-white placeholder:text-white/40 focus-visible:ring-white/40"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "rgba(200,210,255,0.7)" }}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold mt-2 border-0 shadow-lg transition-all duration-200 active:scale-[0.97]"
              disabled={loginMutation.isPending}
              style={{
                background: "linear-gradient(135deg, oklch(0.50 0.22 270), oklch(0.45 0.20 250))",
                color: "white",
                boxShadow: "0 4px 20px rgba(100,80,200,0.5)",
              }}
            >
              {loginMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />로그인 중...</>
              ) : (
                "로그인"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm" style={{ color: "rgba(200,210,255,0.8)" }}>
          계정이 없으신가요?{" "}
          <Link
            href="/register"
            className="font-semibold hover:underline"
            style={{ color: "rgba(180,200,255,1)" }}
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
