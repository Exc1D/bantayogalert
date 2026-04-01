import { createContext, useContext, useState, ReactNode } from 'react'

interface User {
  uid: string
  email: string | null
  displayName: string | null
  role: 'citizen' | 'municipal_admin' | 'provincial_superadmin' | null
  municipality: string | null
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  // Phase 2: Full Firebase Auth integration
  // setUser will be used; email/password params will be used
  void user // suppress "unused variable" — placeholder until Phase 2

  const signIn = async (_email: string, _password: string) => {
    setLoading(true)
    // Phase 2: implement with Firebase Auth
    setLoading(false)
  }

  const signOut = async () => {
    setLoading(true)
    // Phase 2: implement
    setLoading(false)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
