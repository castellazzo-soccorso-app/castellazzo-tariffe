# Calcolo Tariffe Trasporto

App gratuita React + TypeScript per aprire un percorso con tappe variabili in Google Maps e calcolare la tariffa inserendo manualmente i chilometri.

## Avvio locale

1. Installa Node.js LTS.
2. Apri la cartella in Visual Studio Code.
3. Apri il terminale e lancia:

```bash
npm install
npm run dev
```

## Pubblicazione GitHub Pages

1. Crea su GitHub un repository vuoto chiamato `calcolo-tariffe`.
2. Dal terminale nella cartella del progetto esegui:

```bash
git init
git add .
git commit -m "Prima versione"
git branch -M main
git remote add origin https://github.com/TUO-UTENTE/calcolo-tariffe.git
git push -u origin main
```

3. Su GitHub apri `Settings > Pages`.
4. In `Build and deployment`, imposta `Source` su `GitHub Actions`.
5. Apri la scheda `Actions` e attendi il completamento di `Deploy to GitHub Pages`.
6. Il link pubblico appare in `Settings > Pages`.

## Modifiche successive

```bash
git add .
git commit -m "Descrizione modifica"
git push
```

Ogni push sul branch `main` avvia automaticamente la pubblicazione.

## Note

- Nessuna API e nessuna chiave Google sono necessarie.
- Le tariffe modificate dalla schermata Configurazione vengono salvate nel browser del dispositivo tramite localStorage.
- La cancellazione dei dati del browser ripristina le tariffe iniziali definite in `src/App.tsx`.
