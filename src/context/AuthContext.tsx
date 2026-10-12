import { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from '../firebase/config'
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'

type AuthContextType = {
  user: any
  loading: boolean
  authorized: boolean
  role: string
  loginGoogle: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)
  const [role, setRole] = useState('user')

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        try {
          if (firebaseUser?.email) {
            const authDoc = await getDoc(
              doc(
                db,
                'utenti_autorizzati_tariffe',
                firebaseUser.email
              )
            )
            if (
              authDoc.exists() &&
              authDoc.data().autorizzato === true
            ) {
              setUser(firebaseUser)
              setAuthorized(true)
              setRole(authDoc.data().ruolo || 'user')
            } else {
              await signOut(auth)

              setUser(null)
              setAuthorized(false)

              alert(
                'Accesso non autorizzato. Contatta il responsabile.'
              )
            }
          } else {
            setUser(null)
            setAuthorized(false)
          }
        } catch (err) {
          console.error(err)
          setUser(null)
          setAuthorized(false)
        }

        setLoading(false)
      }
    )

    return unsubscribe
  }, [])

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider()
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
    throw new Error(
      'useAuth deve essere usato dentro AuthProvider'
    )
  }

  return context
}