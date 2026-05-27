import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";

const ADMIN_PASSWORD = "2101";

const glassCard = {
  background: "rgba(255,255,255,0.10)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.18)",
  borderRadius: "1rem",
} as React.CSSProperties;

export default function EmployeeManagePage() {
  const utils = trpc.useUtils();
  const { data: employees, isLoading } = trpc.employee.list.useQuery();
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; nickname: string } | null>(null);

  const addMutation = trpc.employee.add.useMutation({
    onSuccess: () => {
      toast.success("직원이 추가되었습니다");
      setNewName("");
      utils.employee.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "직원 추가에 실패했습니다"),
  });

  const deleteMutation = trpc.employee.delete.useMutation({
    onSuccess: () => {
      toast.success("직원이 삭제되었습니다");
      setDeleteTarget(null);
      utils.employee.list.invalidate();
    },
    onError: (error) => toast.error(error.message || "직원 삭제에 실패했습니다"),
  });

  const handleAdd = async () => {
    if (!newName.trim()) { toast.error("이름을 입력해 주세요"); return; }
    try {
      await addMutation.mutateAsync({ nickname: newName.trim(), password: ADMIN_PASSWORD });
    } catch (error) {
      console.error("Add mutation error:", error);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate({ employeeId: deleteTarget.id, password: ADMIN_PASSWORD });
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "white", textShadow: "0 2px 8px rgba(0,0,0,0.4)" }}>직원 관리</h1>
          <p style={{ color: "rgba(180,200,255,0.75)" }}>직원을 추가하거나 삭제할 수 있습니다</p>
        </div>

        {/* 직원 추가 */}
        <div className="mb-6 p-6" style={glassCard}>
          <h2 className="text-base font-semibold mb-1" style={{ color: "white" }}>직원 추가</h2>
          <p className="text-sm mb-4" style={{ color: "rgba(180,200,255,0.65)" }}>새로운 직원의 이름을 입력하고 추가 버튼을 클릭하세요</p>
          <form
            onSubmit={(e) => { e.preventDefault(); handleAdd(); }}
            className="flex gap-2"
          >
            <Input
              placeholder="직원 이름 (닉네임)"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              disabled={addMutation.isPending}
              autoComplete="off"
              className="focus-visible:ring-white/30 placeholder:text-white/40"
              style={{ background: "rgba(255,255,255,0.12)", border: "none", color: "white" }}
            />
            <Button
              type="submit"
              disabled={addMutation.isPending}
              className="border-0 active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg, rgba(80,120,255,0.85), rgba(60,100,230,0.85))", color: "white" }}
            >
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              추가
            </Button>
          </form>
        </div>

        {/* 직원 목록 */}
        <div className="p-6" style={glassCard}>
          <h2 className="text-base font-semibold mb-1" style={{ color: "white" }}>직원 목록</h2>
          <p className="text-sm mb-4" style={{ color: "rgba(180,200,255,0.65)" }}>총 {employees?.length || 0}명의 직원</p>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "rgba(150,170,255,0.8)" }} />
            </div>
          ) : employees && employees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {employees.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center justify-between p-3 rounded-xl transition-all"
                  style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.10)" }}
                >
                  <span className="font-medium" style={{ color: "white" }}>{emp.nickname}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget({ id: emp.id, nickname: emp.nickname })}
                        style={{ color: "rgba(255,120,120,0.8)" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>직원 삭제</AlertDialogTitle>
                        <AlertDialogDescription>
                          &apos;{deleteTarget?.nickname}&apos;을(를) 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="flex gap-3 justify-end">
                        <AlertDialogCancel>취소</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={deleteMutation.isPending}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                          삭제
                        </AlertDialogAction>
                      </div>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8" style={{ color: "rgba(180,200,255,0.5)" }}>직원이 없습니다</div>
          )}
        </div>
      </div>
    </div>
  );
}
