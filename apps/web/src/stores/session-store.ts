import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setAuthToken } from "../lib/api.ts";
import type { SessionUser } from "../shared-types.ts";

type SessionState = {
  user: SessionUser | null;
  token: string | null;
  displayNameDraft: string;
  setSession: (user: SessionUser | null, token?: string | null) => void;
  setDisplayNameDraft: (displayNameDraft: string) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      displayNameDraft: "",
      setSession: (user, token) => {
        set((state) => {
          const nextToken = token === undefined ? state.token : token;
          setAuthToken(nextToken);
          return {
            user,
            token: nextToken,
            displayNameDraft: user?.displayName ?? state.displayNameDraft,
          };
        });
      },
      setDisplayNameDraft: (displayNameDraft) => set({ displayNameDraft }),
    }),
    {
      name: "coliseum.session",
      partialize: (state) => ({
        displayNameDraft: state.displayNameDraft,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) setAuthToken(state.token);
      },
    },
  ),
);
