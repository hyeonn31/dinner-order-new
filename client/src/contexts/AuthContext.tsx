import { createContext, useContext, ReactNode } from "react";
import { trpc } from "@/lib/trpc";

export type SessionUser = {
  id: number;
  username: string;
  nickname: string;
  role: "user" | "admin";
};

type AuthContextType = {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  refetch: () => Promise<SessionUser | null>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  refetch: async () => null,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = trpc.account.session.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const user = (data as SessionUser | null | undefined) ?? null;

  // refetch를 호출하고 새로운 user 값을 반환하는 Promise를 리턴
  const refetchAndReturn = async (): Promise<SessionUser | null> => {
    const result = await refetch();
    return (result.data as SessionUser | null | undefined) ?? null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        refetch: refetchAndReturn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  return useContext(AuthContext);
}
