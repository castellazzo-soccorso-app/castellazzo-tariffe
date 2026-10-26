import { useEffect, useMemo, useState } from 'react'
import { useAuth } from './context/AuthContext'

type Fascia = { id: string; da: number; a: number; costo: number }

const DEFAULT_FASCE: Fascia[] = [
  { id: crypto.randomUUID(), da: 1, a: 30, costo: 1.8 },
  { id: crypto.randomUUID(), da: 31, a: 60, costo: 1.68 },
  { id: crypto.randomUUID(), da: 61, a: 100, costo: 1.56 },
  { id: crypto.randomUUID(), da: 101, a: 300, costo: 1.44 },
]

const euro = new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR',
})

export default function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [partenza, setPartenza] = useState('')
  const [arrivo, setArrivo] = useState('')
  const [tappe, setTappe] = useState<string[]>([])
  const [km, setKm] = useState('')
  const [andataRitorno, setAndataRitorno] = useState(false)
  const [evitaAutostrada, setEvitaAutostrada] = useState(false)
  const [nome, setNome] = useState('')
  const [telefono, setTelefono] = useState('')

  const {
    user,
    loading,
    authorized,
    role,
    loginEmail,
    logout,
  } = useAuth()

  const [fasce, setFasce] = useState<Fascia[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('fasceTariffe') || '') || DEFAULT_FASCE
    } catch {
      return DEFAULT_FASCE
    }
  })

  const [mostraConfig, setMostraConfig] = useState(false)

  useEffect(() => {
    localStorage.setItem('fasceTariffe', JSON.stringify(fasce))
  }, [fasce])

  const kmInseriti = Number(km.replace(',', '.')) || 0

  // I km inseriti devono essere gia quelli mostrati da Google Maps.
  // Se il percorso e andata e ritorno, sara Maps a calcolare i km completi.
  const kmTariffati = kmInseriti

  const fascia = useMemo(
    () => fasce.find(f => kmTariffati >= f.da && kmTariffati <= f.a),
    [fasce, kmTariffati]
  )

  const totale = fascia ? kmTariffati * fascia.costo : 0

  function aggiungiTappa() {
    setTappe([...tappe, ''])
  }

  function modificaTappa(i: number, valore: string) {
    setTappe(tappe.map((t, n) => (n === i ? valore : t)))
  }

  function eliminaTappa(i: number) {
    setTappe(tappe.filter((_, n) => n !== i))
  }

  function apriMaps() {
    if (!partenza.trim() || !arrivo.trim()) {
      alert('Inserisci partenza e arrivo.')
      return
    }

    const tappeValide = tappe.map(t => t.trim()).filter(Boolean)

    const origin = partenza.trim()
    let destination = arrivo.trim()
    let waypoints = [...tappeValide]

    if (andataRitorno) {
      waypoints = [...tappeValide]
      waypoints.push(arrivo.trim())
      destination = partenza.trim()

      if (
        waypoints.length > 0 &&
        waypoints[waypoints.length - 1].toLowerCase() === destination.toLowerCase()
      ) {
        waypoints.pop()
      }
    }

    const params = new URLSearchParams({
      api: '1',
      origin,
      destination,
      travelmode: 'driving',
    })

    if (waypoints.length > 0) {
      params.set('waypoints', waypoints.join('|'))
    }

    if (evitaAutostrada) {
      params.set('avoid', 'highways')
    }

    window.open(
      `https://www.google.com/maps/dir/?${params.toString()}`,
      '_blank',
      'noopener,noreferrer'
    )
  }

  function pulisci() {
    setPartenza('')
    setArrivo('')
    setTappe([])
    setKm('')
    setAndataRitorno(false)
    setEvitaAutostrada(false)
    setNome('')
    setTelefono('')
  }

  function inviaWhatsApp() {
    if (!nome.trim() || !telefono.trim()) {
      alert('Inserisci nominativo e telefono.')
      return
    }

    if (!partenza.trim() || !arrivo.trim()) {
      alert('Inserisci partenza e arrivo.')
      return
    }

    if (kmTariffati <= 0 || !fascia) {
      alert('Inserisci i chilometri e verifica la tariffa.')
      return
    }

    const percorso = [
      partenza.trim(),
      ...tappe.map(t => t.trim()).filter(Boolean),
      arrivo.trim(),
      ...(andataRitorno ? [partenza.trim()] : []),
    ].join('\n-> ')

    const messaggio = `*TRASPORTO PAZIENTE*

*Nominativo:* ${nome.trim()}
*Telefono:* ${telefono.trim()}

*Percorso:*
${percorso}

*Km:* ${kmTariffati}
*Fascia:* ${fascia.da}-${fascia.a} km
*Costo/km:* ${euro.format(fascia.costo)}

*Totale: ${euro.format(totale)}*`

    const url = `https://wa.me/393351444925?text=${encodeURIComponent(messaggio)}`

    window.open(url, '_blank', 'noopener,noreferrer')
  }

  function aggiornaFascia(
    id: string,
    campo: keyof Omit<Fascia, 'id'>,
    valore: string
  ) {
    setFasce(
      fasce.map(f =>
        f.id === id
          ? { ...f, [campo]: Number(valore.replace(',', '.')) || 0 }
          : f
      )
    )
  }

  async function eseguiLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginError('')

    if (!email.trim() || !password) {
      setLoginError('Inserisci email e password.')
      return
    }

    try {
      await loginEmail(email.trim(), password)
    } catch (error: any) {
      console.error(error)

      switch (error?.code) {
        case 'auth/invalid-credential':
        case 'auth/wrong-password':
        case 'auth/user-not-found':
          setLoginError('Email o password non corretti.')
          break
        case 'auth/invalid-email':
          setLoginError('Indirizzo email non valido.')
          break
        case 'auth/too-many-requests':
          setLoginError('Troppi tentativi di accesso. Riprova piu tardi.')
          break
        default:
          setLoginError('Impossibile effettuare l accesso.')
      }
    }
  }

  if (loading) {
    return (
      <main className="container">
        <section className="card">
          <h1>Caricamento...</h1>
        </section>
      </main>
    )
  }

  if (!user || !authorized) {
    return (
      <main className="container">
        <section className="card">
          <h1>Calcolo Tariffe Trasporto</h1>
          <p>Accesso riservato agli utenti autorizzati.</p>

          <form onSubmit={eseguiLogin}>
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nome@dominio.it"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
              />
            </label>

            {loginError && <p style={{ color: '#c62828' }}>{loginError}</p>}

            <button className="primary" type="submit">
              Accedi
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="container">
      <header>
        <div>
          <p className="eyebrow">Associazione di volontariato</p>
          <h1>Calcolo tariffa trasporto</h1>
          <p>
            Imposta il percorso, aprilo in Google Maps e inserisci i chilometri
            visualizzati.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {role === 'admin' && (
            <button
              className="secondary"
              onClick={() => setMostraConfig(!mostraConfig)}
            >
              ⚙ Configurazione
            </button>
          )}

          <button className="secondary" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      {mostraConfig && (
        <section className="card config">
          <h2>Fasce tariffarie</h2>
          <p>Le modifiche sono salvate solo su questo dispositivo.</p>
          <div className="tariffe-head">
            <span>Da km</span>
            <span>A km</span>
            <span>€/km</span>
            <span></span>
          </div>
          {fasce.map(f => (
            <div className="tariffa-row" key={f.id}>
              <input
                type="number"
                value={f.da}
                onChange={e => aggiornaFascia(f.id, 'da', e.target.value)}
              />
              <input
                type="number"
                value={f.a}
                onChange={e => aggiornaFascia(f.id, 'a', e.target.value)}
              />
              <input
                type="number"
                step="0.01"
                value={f.costo}
                onChange={e => aggiornaFascia(f.id, 'costo', e.target.value)}
              />
              <button
                className="danger small"
                onClick={() => setFasce(fasce.filter(x => x.id !== f.id))}
              >
                Elimina
              </button>
            </div>
          ))}
          <button
            className="secondary"
            onClick={() =>
              setFasce([
                ...fasce,
                { id: crypto.randomUUID(), da: 0, a: 0, costo: 0 },
              ])
            }
          >
            + Aggiungi fascia
          </button>
        </section>
      )}

      <section className="card">
        <h2>1. Definizione percorso</h2>
        <label>
          Partenza
          <input
            value={partenza}
            onChange={e => setPartenza(e.target.value)}
            placeholder="Es. Castellazzo Soccorso"
          />
        </label>
        <div className="section-title">
          <strong>Tappe intermedie</strong>
          <button className="secondary small" onClick={aggiungiTappa}>
            + Aggiungi tappa
          </button>
        </div>
        {tappe.length === 0 && <p className="empty">Nessuna tappa inserita.</p>}
        {tappe.map((t, i) => (
          <div className="stop" key={i}>
            <label>
              Tappa {i + 1}
              <input
                value={t}
                onChange={e => modificaTappa(i, e.target.value)}
                placeholder={`Inserisci tappa ${i + 1}`}
              />
            </label>
            <button className="danger" onClick={() => eliminaTappa(i)}>
              ✕
            </button>
          </div>
        ))}
        <label>
          Arrivo
          <input
            value={arrivo}
            onChange={e => setArrivo(e.target.value)}
            placeholder="Es. Alessandria"
          />
        </label>
        <div className="checks">
          <label>
            <input
              type="checkbox"
              checked={andataRitorno}
              onChange={e => setAndataRitorno(e.target.checked)}
            />{' '}
            Andata e ritorno
          </label>
          <label>
            <input
              type="checkbox"
              checked={evitaAutostrada}
              onChange={e => setEvitaAutostrada(e.target.checked)}
            />{' '}
            Evita autostrada
          </label>
        </div>
        <button className="primary" onClick={apriMaps}>
          Apri percorso in Google Maps
        </button>
      </section>

      <section className="card">
        <h2>2. Inserimento chilometri</h2>
        <label>
          Km mostrati da Google Maps
          <input
            className="km"
            inputMode="decimal"
            value={km}
            onChange={e => setKm(e.target.value)}
            placeholder="0"
          />
        </label>
      </section>

      <section className="card">
        <h2>3. Paziente / richiedente</h2>
        <div className="grid2">
          <label>
            Nominativo
            <input value={nome} onChange={e => setNome(e.target.value)} />
          </label>
          <label>
            Telefono
            <input
              type="tel"
              value={telefono}
              onChange={e => setTelefono(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="result">
        <div>
          <span>Km tariffati</span>
          <strong>{kmTariffati.toLocaleString('it-IT')}</strong>
        </div>
        <div>
          <span>Fascia applicata</span>
          <strong>
            {fascia
              ? `${fascia.da}-${fascia.a} km · ${euro.format(fascia.costo)}/km`
              : kmTariffati
                ? 'Nessuna fascia configurata'
                : '-'}
          </strong>
        </div>
        <div className="total">
          <span>Totale trasporto</span>
          <strong>{euro.format(totale)}</strong>
        </div>
      </section>

      <div style={{ display: 'grid', gap: '10px', marginTop: '16px' }}>
        <button className="primary full" onClick={inviaWhatsApp}>
          📲 Invia riepilogo WhatsApp
        </button>

        <button className="secondary full" onClick={pulisci}>
          Pulisci tutto
        </button>
      </div>
    </main>
  )
}
