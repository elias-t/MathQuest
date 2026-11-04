import { createContext, useContext } from 'react';

export interface AuthUser {
  userId: string;
  email: string;
  displayName: string;
  role: 'TEACHER' | 'STUDENT';
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (token: string) => Promise<AuthUser>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => { throw new Error('AuthProvider not mounted'); },
  signOut: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
