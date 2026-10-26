import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../firebase/config'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

type AuthContextType = {
  user: any
  loading: boolean
  authorized: boolean
  role: string
  loginEmail: (email: string, password: string) => Promise<void>
  loginGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [role, setRole] = useState('user')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async firebaseUser => {
      try {
        if (firebaseUser?.email) {
          const email = firebaseUser.email.trim().toLowerCase()
          const authDoc = await getDoc(
            doc(db, 'utenti_autorizzati_tariffe', email)
          )

          if (authDoc.exists() && authDoc.data().autorizzato === true) {
            setUser(firebaseUser)
            setAuthorized(true)
            setRole(authDoc.data().ruolo || 'user')
          } else {
            await signOut(auth)
            setUser(null)
            setAuthorized(false)
            setRole('user')
            alert('Accesso non autorizzato. Contatta il responsabile.')
          }
        } else {
          setUser(null)
          setAuthorized(false)
          setRole('user')
        }
      } catch (error) {
        console.error(error)
        setUser(null)
        setAuthorized(false)
        setRole('user')
      } finally {
        setLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const loginEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password)
  }

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider()
    provider.setCustomParameters({ prompt: 'select_account' })
    await signInWithPopup(auth, provider)
  }

  const logout = async () => {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authorized,
        role,
        loginEmail,
        loginGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve essere usato dentro AuthProvider')
  }

  return context
}
