import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Lock, Users, Plus, Trash2, ChevronLeft } from "lucide-react";
import { Link } from "wouter";

const ADMIN_PASSWORD = "2101";

function PasswordGate({ children }: { children: React.ReactNode }) {
  const [input, setInput] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState(false);

  function handleUnlock() {
    if (input === ADMIN_PASSWORD) {
      setUnlocked(true);
    } else {
      setError(true);
      setInput("");
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div className="max-w-sm mx-auto mt-12">
      <Card>
        <CardHeader className="text-center pb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg font-bold">관리자 인증</CardTitle>
          <p className="text-sm text-muted-foreground">비밀번호를 입력하세요</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="password"
            placeholder="비밀번호"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false); }}
            onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            className={error ? "border-destructive" : ""}
          />
          {error && <p className="text-xs text-destructive">비밀번호가 올바르지 않습니다.</p>}
          <Button className="w-full font-bold" onClick={handleUnlock}>확인</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function EmployeeContent() {
  const utils = trpc.useUtils();
  const { data: employees, isLoading } = trpc.employee.list.useQuery();
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");

  const addMutation = trpc.employee.add.useMutation({
    onSuccess: () => {
      toast.success("직원이 추가되었습니다.");
      setNewName("");
      utils.employee.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.employee.delete.useMutation({
    onSuccess: () => {
      toast.success("직원이 삭제되었습니다.");
      utils.employee.list.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const filtered = (employees ?? []).filter((e) =>
    !search.trim() || e.nickname.includes(search.trim())
  );

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/admin">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <ChevronLeft className="w-4 h-4" />
            관리자
          </Button>
        </Link>
        <h1 className="text-xl font-black flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          직원 관리
        </h1>
      </div>

      {/* 직원 추가 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">직원 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="직원 이름 입력"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && newName.trim() && addMutation.mutate({ nickname: newName.trim(), password: ADMIN_PASSWORD })}
            />
            <Button
              onClick={() => addMutation.mutate({ nickname: newName.trim(), password: ADMIN_PASSWORD })}
              disabled={!newName.trim() || addMutation.isPending}
              className="gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              추가
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 직원 목록 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
              직원 목록 ({(employees ?? []).length}명)
            </CardTitle>
          </div>
          <Input
            placeholder="이름 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-6">직원이 없습니다.</p>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((emp) => (
                <div key={emp.id} className="flex items-center justify-between py-2.5 px-1">
                  <span className="font-medium text-sm">{emp.nickname}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>직원 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          <strong>{emp.nickname}</strong>을(를) 삭제하시겠습니까?
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-white hover:bg-destructive/90"
                          onClick={() => deleteMutation.mutate({ id: emp.id, password: ADMIN_PASSWORD })}
                        >
                          삭제
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployeeManagePage() {
  return (
    <PasswordGate>
      <EmployeeContent />
    </PasswordGate>
  );
}
