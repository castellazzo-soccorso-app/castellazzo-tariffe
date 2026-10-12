import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyCuvZm_Me1bAmQDGkaEtzIqhTJp5VAIvbc',
  authDomain: 'castellazzo-soccorso-92a79.firebaseapp.com',
  projectId: 'castellazzo-soccorso-92a79',
  storageBucket: 'castellazzo-soccorso-92a79.firebasestorage.app',
  messagingSenderId: '246890870865',
  appId: '1:246890870865:web:4437630efeba62903ca070',
}


const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)

export default app