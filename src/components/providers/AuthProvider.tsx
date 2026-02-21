"use client";

import {
  createContext,
  useContext,
  ReactNode,
} from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface AuthContextValue {
  userId: Id<"users"> | null;
  isAuthed: boolean;
  isLoading: boolean;
  onboardingComplete: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  userId: null,
  isAuthed: false,
  isLoading: true,
  onboardingComplete: false,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { isLoading: authLoading, isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  const user = useQuery(
    api.users.getUser,
    isAuthenticated ? {} : "skip"
  );

  const isLoading = authLoading || (isAuthenticated && user === undefined);

  return (
    <AuthContext.Provider
      value={{
        userId: user?._id ?? null,
        isAuthed: isAuthenticated,
        isLoading,
        onboardingComplete: user?.onboardingComplete ?? false,
        logout: () => void signOut(),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
