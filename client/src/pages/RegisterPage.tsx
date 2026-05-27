import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "oklch(0.96 0.015 250)" }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <img
              src="/manus-storage/Logo_White_9e0a8e5c.png"
              alt="ABLE"
              className="h-10 object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "oklch(0.20 0.05 250)" }}>
            회원가입
          </h1>
          <p className="text-sm" style={{ color: "oklch(0.50 0.03 250)" }}>
            직원 닉네임을 선택하여 계정을 만드세요
          </p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg" style={{ color: "oklch(0.20 0.05 250)" }}>계정 정보 입력</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 아이디 */}
              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: "oklch(0.35 0.04 250)" }}>
                  아이디 <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="3자 이상 입력"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </div>

              {/* 비밀번호 */}
              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: "oklch(0.35 0.04 250)" }}>
                  비밀번호 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="4자 이상 입력"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={registerMutation.isPending}
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

              {/* 비밀번호 확인 */}
              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: "oklch(0.35 0.04 250)" }}>
                  비밀번호 확인 <span className="text-red-500">*</span>
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호 재입력"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={registerMutation.isPending}
                />
              </div>

              {/* 닉네임 선택 */}
              <div className="space-y-1">
                <label className="text-sm font-medium" style={{ color: "oklch(0.35 0.04 250)" }}>
                  닉네임 선택 <span className="text-red-500">*</span>
                </label>
                {selectedNickname && (
                  <div
                    className="px-3 py-2 rounded-md text-sm font-semibold flex items-center justify-between"
                    style={{ background: "oklch(0.90 0.05 250)", color: "oklch(0.30 0.12 250)" }}
                  >
                    <span>선택됨: {selectedNickname}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedNickname("")}
                      className="text-xs underline opacity-70 hover:opacity-100"
                    >
                      변경
                    </button>
                  </div>
                )}
                {!selectedNickname && (
                  <div className="border rounded-md overflow-hidden" style={{ borderColor: "oklch(0.85 0.03 250)" }}>
                    <div className="relative p-2 border-b" style={{ borderColor: "oklch(0.90 0.02 250)" }}>
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="닉네임 검색..."
                        value={nicknameSearch}
                        onChange={(e) => setNicknameSearch(e.target.value)}
                        className="pl-7 h-8 text-sm border-0 shadow-none focus-visible:ring-0"
                      />
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {loadingNicknames ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        </div>
                      ) : filteredNicknames.length === 0 ? (
                        <div className="py-4 text-center text-sm text-gray-400">
                          {availableNicknames.length === 0 ? "가입 가능한 닉네임이 없습니다" : "검색 결과 없음"}
                        </div>
                      ) : (
                        filteredNicknames.map((n: { id: number; nickname: string }) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => setSelectedNickname(n.nickname)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors"
                            style={{ color: "oklch(0.25 0.05 250)" }}
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
                className="w-full h-11 text-base font-semibold"
                disabled={registerMutation.isPending}
                style={{ background: "oklch(0.45 0.18 250)", color: "white" }}
              >
                {registerMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />가입 중...</>
                ) : (
                  "회원가입"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm" style={{ color: "oklch(0.50 0.03 250)" }}>
          이미 계정이 있으신가요?{" "}
          <Link href="/" className="font-semibold hover:underline" style={{ color: "oklch(0.45 0.18 250)" }}>
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
