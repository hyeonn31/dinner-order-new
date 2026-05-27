import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, Loader2, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAppAuth } from "@/contexts/AuthContext";

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { refetch } = useAppAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedNickname, setSelectedNickname] = useState("");
  const [nicknameSearch, setNicknameSearch] = useState("");

  const { data: availableNicknames = [], isLoading: loadingNicknames } =
    trpc.account.availableNicknames.useQuery();

  const filteredNicknames = useMemo(() => {
    if (!nicknameSearch.trim()) return availableNicknames;
    const q = nicknameSearch.toLowerCase();
    return availableNicknames.filter((n: { id: number; nickname: string }) =>
      n.nickname.toLowerCase().includes(q)
    );
  }, [availableNicknames, nicknameSearch]);

  const registerMutation = trpc.account.register.useMutation({
    onSuccess: async (data) => {
      toast.success(`${data.nickname}님, 가입을 환영합니다!`);
      const freshUser = await refetch();
      if (freshUser?.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/order");
      }
    },
    onError: (error) => {
      toast.error(error.message || "회원가입에 실패했습니다.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("아이디를 입력하세요.");
    if (username.trim().length < 3) return toast.error("아이디는 3자 이상이어야 합니다.");
    if (!password) return toast.error("비밀번호를 입력하세요.");
    if (password.length < 4) return toast.error("비밀번호는 4자 이상이어야 합니다.");
    if (password !== confirmPassword) return toast.error("비밀번호가 일치하지 않습니다.");
    if (!selectedNickname) return toast.error("닉네임을 선택하세요.");
    registerMutation.mutate({ username: username.trim(), password, nickname: selectedNickname });
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
            회원가입
          </h1>
          <p className="text-sm" style={{ color: "rgba(200,210,255,0.85)" }}>
            직원 닉네임을 선택하여 계정을 만드세요
          </p>
        </div>

        {/* 회원가입 카드 */}
        <div
          className="rounded-2xl p-6 shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.25)",
          }}
        >
          <h2 className="text-lg font-bold mb-5" style={{ color: "white" }}>계정 정보 입력</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 아이디 */}
            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: "rgba(200,210,255,0.9)" }}>
                아이디 <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                placeholder="3자 이상 입력"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={registerMutation.isPending}
                className="h-11 border-0 text-white placeholder:text-white/40 focus-visible:ring-white/40"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              />
            </div>

            {/* 비밀번호 */}
            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: "rgba(200,210,255,0.9)" }}>
                비밀번호 <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="4자 이상 입력"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={registerMutation.isPending}
                  className="h-11 pr-10 border-0 text-white placeholder:text-white/40 focus-visible:ring-white/40"
                  style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
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

            {/* 비밀번호 확인 */}
            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: "rgba(200,210,255,0.9)" }}>
                비밀번호 확인 <span className="text-red-400">*</span>
              </label>
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호 재입력"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={registerMutation.isPending}
                className="h-11 border-0 text-white placeholder:text-white/40 focus-visible:ring-white/40"
                style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}
              />
            </div>

            {/* 닉네임 선택 */}
            <div className="space-y-1">
              <label className="text-sm font-medium" style={{ color: "rgba(200,210,255,0.9)" }}>
                닉네임 선택 <span className="text-red-400">*</span>
              </label>
              {selectedNickname ? (
                <div
                  className="px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-between"
                  style={{ background: "rgba(120,140,255,0.3)", border: "1px solid rgba(180,200,255,0.4)", color: "white" }}
                >
                  <span>선택됨: {selectedNickname}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedNickname("")}
                    className="text-xs underline opacity-70 hover:opacity-100"
                    style={{ color: "rgba(200,210,255,0.9)" }}
                  >
                    변경
                  </button>
                </div>
              ) : (
                <div
                  className="rounded-lg overflow-hidden"
                  style={{ border: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.10)" }}
                >
                  <div className="relative p-2 border-b" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "rgba(200,210,255,0.6)" }} />
                    <Input
                      type="text"
                      placeholder="닉네임 검색..."
                      value={nicknameSearch}
                      onChange={(e) => setNicknameSearch(e.target.value)}
                      className="pl-7 h-8 text-sm border-0 shadow-none focus-visible:ring-0 bg-transparent text-white placeholder:text-white/40"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {loadingNicknames ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin" style={{ color: "rgba(200,210,255,0.7)" }} />
                      </div>
                    ) : filteredNicknames.length === 0 ? (
                      <div className="py-4 text-center text-sm" style={{ color: "rgba(200,210,255,0.5)" }}>
                        {availableNicknames.length === 0 ? "가입 가능한 닉네임이 없습니다" : "검색 결과 없음"}
                      </div>
                    ) : (
                      filteredNicknames.map((n: { id: number; nickname: string }) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => setSelectedNickname(n.nickname)}
                          className="w-full text-left px-3 py-2 text-sm transition-colors"
                          style={{ color: "rgba(220,230,255,0.9)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                        >
                          {n.nickname}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-11 text-base font-semibold mt-2 border-0 shadow-lg transition-all duration-200 active:scale-[0.97]"
              disabled={registerMutation.isPending}
              style={{
                background: "linear-gradient(135deg, oklch(0.50 0.22 270), oklch(0.45 0.20 250))",
                color: "white",
                boxShadow: "0 4px 20px rgba(100,80,200,0.5)",
              }}
            >
              {registerMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />가입 중...</>
              ) : (
                "회원가입"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm" style={{ color: "rgba(200,210,255,0.8)" }}>
          이미 계정이 있으신가요?{" "}
          <Link
            href="/"
            className="font-semibold hover:underline"
            style={{ color: "rgba(180,200,255,1)" }}
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
