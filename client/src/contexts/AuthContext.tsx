import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
  refetch: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data, isLoading, refetch } = trpc.account.session.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const user = data as SessionUser | null | undefined;

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAppAuth() {
  return useContext(AuthContext);
}
