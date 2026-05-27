import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAppAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Search, Shield, User, Trash2 } from "lucide-react";
import { toast } from "sonner";

const darkGlass = {
  background: "rgba(8,12,35,0.65)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "1rem",
} as React.CSSProperties;

export default function AccountManagePage() {
  const { user, isAdmin, isLoading } = useAppAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; username: string } | null>(null);

  if (!isLoading && (!user || !isAdmin)) {
    setLocation("/");
    return null;
  }

  const utils = trpc.useUtils();

  const { data: accounts = [], isLoading: loadingAccounts } = trpc.account.listAll.useQuery(
    { adminUsername: user?.username ?? "", adminPassword: "" },
    { enabled: !!user && isAdmin }
  );

  const deleteMutation = trpc.account.delete.useMutation({
    onSuccess: () => {
      toast.success("계정이 삭제되었습니다.");
      utils.account.listAll.invalidate();
      setDeleteTarget(null);
    },
    onError: (error) => {
      toast.error(error.message || "계정 삭제에 실패했습니다.");
      setDeleteTarget(null);
    },
  });

  const filtered = accounts.filter(
    (a: any) =>
      a.username.toLowerCase().includes(search.toLowerCase()) ||
      a.nickname.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(150,170,255,0.8)" }} />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1" style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.6)" }}>
          계정 관리
        </h1>
        <p className="text-sm" style={{ color: "rgba(200,215,255,0.9)" }}>
          가입된 모든 회원의 계정 정보를 확인하고 관리합니다.
        </p>
      </div>

      {/* 검색 */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "rgba(200,215,255,0.7)" }} />
        <Input
          placeholder="아이디 또는 닉네임 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 focus-visible:ring-white/30 placeholder:text-white/50"
          style={{ background: "rgba(8,12,35,0.65)", border: "1px solid rgba(255,255,255,0.18)", color: "white" }}
        />
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="py-3 px-4" style={darkGlass}>
          <div className="text-2xl font-bold" style={{ color: "rgba(180,200,255,1)", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{accounts.length}</div>
          <div className="text-xs" style={{ color: "rgba(200,215,255,0.85)" }}>전체 계정</div>
        </div>
        <div className="py-3 px-4" style={darkGlass}>
          <div className="text-2xl font-bold" style={{ color: "rgba(210,180,255,1)", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
            {accounts.filter((a: any) => a.role === "admin").length}
          </div>
          <div className="text-xs" style={{ color: "rgba(200,215,255,0.85)" }}>관리자 계정</div>
        </div>
      </div>

      {/* 계정 목록 */}
      {loadingAccounts ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(150,170,255,0.8)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: "rgba(200,215,255,0.7)" }}>
          {accounts.length === 0 ? "가입된 계정이 없습니다." : "검색 결과가 없습니다."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((account: any) => (
            <div
              key={account.id}
              className="py-3 px-4 rounded-xl transition-all"
              style={{ background: "rgba(8,12,35,0.65)", border: "1px solid rgba(255,255,255,0.18)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: account.role === "admin" ? "rgba(130,100,255,0.45)" : "rgba(255,255,255,0.15)",
                    }}
                  >
                    {account.role === "admin" ? (
                      <Shield className="w-4 h-4" style={{ color: "rgba(210,180,255,1)" }} />
                    ) : (
                      <User className="w-4 h-4" style={{ color: "rgba(200,215,255,1)" }} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm" style={{ color: "white", textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>
                        {account.username}
                      </span>
                      <Badge
                        variant="secondary"
                        className="text-xs px-1.5 py-0 border-0"
                        style={{
                          background: account.role === "admin" ? "rgba(130,100,255,0.45)" : "rgba(255,255,255,0.18)",
                          color: account.role === "admin" ? "rgba(220,195,255,1)" : "rgba(200,215,255,1)",
                        }}
                      >
                        {account.role === "admin" ? "관리자" : "일반회원"}
                      </Badge>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(200,215,255,0.95)" }}>
                      닉네임: <span className="font-medium">{account.nickname}</span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(180,200,255,0.85)" }}>
                      가입일: {new Date(account.createdAt).toLocaleString("ko-KR")}
                    </div>
                  </div>
                </div>

                {account.id !== user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: "rgba(255,130,130,0.9)" }}
                    onClick={() => setDeleteTarget({ id: account.id, username: account.username })}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계정 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.username}</strong> 계정을 삭제하시겠습니까?
              <br />이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
