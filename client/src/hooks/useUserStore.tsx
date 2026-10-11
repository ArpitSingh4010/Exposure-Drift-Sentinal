import { createContext, useContext, useState, useCallback } from 'react';

interface UserStoreCtx {
  userId: string | null;
  setUserId: (id: string) => void;
}

const UserStoreContext = createContext<UserStoreCtx | null>(null);

const STORAGE_KEY = 'eds_userId';

/** Provides userId state backed by localStorage so it survives page refreshes. */
export function UserStoreProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [userId, setUserIdState] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY) ?? null,
  );

  const setUserId = useCallback((id: string) => {
    localStorage.setItem(STORAGE_KEY, id);
    setUserIdState(id);
  }, []);

  return (
    <UserStoreContext.Provider value={{ userId, setUserId }}>
      {children}
    </UserStoreContext.Provider>
  );
}

/** Hook to read and update the current user id. */
export function useUserStore(): UserStoreCtx {
  const ctx = useContext(UserStoreContext);
  if (!ctx) throw new Error('useUserStore must be used within UserStoreProvider');
  return ctx;
}
