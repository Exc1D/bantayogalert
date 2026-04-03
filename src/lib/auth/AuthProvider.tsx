import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { type User } from 'firebase/auth'
import { observeAuthState, configureAuthPersistence } from './auth'
import { UserRole } from '../../types/user'

export interface CustomClaims {
  role: UserRole
  municipalityCode: string | null
  provinceCode: string
}

export interface AuthContextValue {
  user: User | null
  customClaims: CustomClaims | null
  isLoading: boolean
  isAuthenticated: boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined
)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [customClaims, setCustomClaims] = useState<CustomClaims | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let unsubscribe: (() => void) | undefined

    async function initAuth() {
      // Configure persistence once at startup
      await configureAuthPersistence()

      // Subscribe to auth state changes
      unsubscribe = observeAuthState(async (firebaseUser) => {
        setUser(firebaseUser)

        if (firebaseUser) {
          // Extract custom claims from ID token
          const idTokenResult = await firebaseUser.getIdTokenResult()
          const claims = idTokenResult.claims

          const extractedClaims: CustomClaims = {
            role: claims.role as UserRole,
            municipalityCode: claims.municipalityCode as string | null,
            provinceCode: claims.provinceCode as string,
          }

          setCustomClaims(extractedClaims)
        } else {
          setCustomClaims(null)
        }

        setIsLoading(false)
      })
    }

    initAuth()

    return () => {
      unsubscribe?.()
    }
  }, [])

  const value: AuthContextValue = {
    user,
    customClaims,
    isLoading,
    isAuthenticated: user !== null,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
