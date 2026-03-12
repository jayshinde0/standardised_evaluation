import { createContext } from 'react';

export const AuthContext = createContext({
  signIn: async () => {},
  signOut: async () => {},
  userToken: null,
  userRole: null,
  apaarId: null,
});
