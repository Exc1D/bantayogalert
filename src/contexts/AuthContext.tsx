import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { getFirebaseAuth } from '../config/firebase'

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
  signUp: (
    email: string,
    password: string,
    displayName: string,
    municipality: string,
    phone: string
  ) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Get ID token result which contains custom claims
        // Note: Custom claims may be stale after role changes — user may need to re-authenticate
        const idTokenResult = await firebaseUser.getIdTokenResult()
        const claims = idTokenResult.claims as { role?: string; municipality?: string }
        const role = claims.role ?? null
        const municipality = claims.municipality ?? null

        // Validate role
        const validRoles = ['citizen', 'municipal_admin', 'provincial_superadmin'] as const
        const typedRole = validRoles.includes(role as (typeof validRoles)[number])
          ? (role as (typeof validRoles)[number])
          : null

        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          role: typedRole,
          municipality,
        })
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    const auth = getFirebaseAuth()
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    const auth = getFirebaseAuth()
    await firebaseSignOut(auth)
  }

  // signUp creates a new account; role assignment happens via Cloud Function approval flow
  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    municipality: string,
    phone: string
  ) => {
    const auth = getFirebaseAuth()
    const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth')
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName })
    // Additional profile data (municipality, phone) stored in Firestore (Phase 3)
    void municipality
    void phone
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
