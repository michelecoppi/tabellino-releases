# Tabellino

**Tabellino** è un gestionale di basket con una lega inventata: squadre, giocatori e città sono generati, le partite sono simulate dal motore e le scelte che contano (mercato, rotazioni, tattiche, club) sono tue. Si gioca anche in 3D, con la partita vista come in TV.

Questo repository contiene **solo gli installer per Windows** e la pagina di download. Il codice del gioco non è pubblico.

## Scarica

- Pagina di download: <https://michelecoppi.github.io/tabellino-releases/>
- Tutte le versioni: <https://github.com/michelecoppi/tabellino-releases/releases>

Requisiti: Windows 10 o 11 a 64 bit, circa 10 MB di spazio (installer da circa 5 MB). Scarica il file che finisce con `-setup.exe` e avvialo.

## Primo avvio: l'avviso di Windows

La prima volta Windows può mostrare «Windows ha protetto il PC» (SmartScreen). Per procedere:

1. Clicca su **Ulteriori informazioni**.
2. Clicca su **Esegui comunque**.

Succede perché Tabellino non ha un certificato a pagamento per i programmi Windows, e quindi Windows non riconosce ancora l'editore. Gli aggiornamenti del gioco, invece, sono firmati e l'app li verifica prima di installarli.

## Aggiornamenti

Il gioco ti avvisa da solo quando esce una versione nuova e si aggiorna con un clic. I salvataggi restano dove sono.

## I tuoi salvataggi

Le leghe restano sul tuo PC. Da **Salvataggi** puoi esportarle in un file `.tabellino`, per farne una copia o portarle su un altro computer.

## Segnalare un problema

Apri una segnalazione nelle [Issues](https://github.com/michelecoppi/tabellino-releases/issues) di questo repository. Indica la versione del gioco (la trovi nella pagina di download e nelle Releases), la versione di Windows e, se puoi, i passi per riprodurre il problema.

## Crediti

Squadre, giocatori e città di Tabellino sono tutti inventati: ogni somiglianza con persone o club reali è casuale.

- Dati di calcio per la calibrazione: [StatsBomb open data](https://github.com/statsbomb/open-data).
- Dati di basket per la calibrazione: stats.nba.com tramite [nba_api](https://github.com/swar/nba_api).
- Font Barlow e Barlow Condensed, licenza SIL Open Font License 1.1 (i file di licenza sono in `assets/fonts/`).

## Per chi mantiene questo repository

La pagina è statica (`index.html`, `styles.css`, `app.js`), senza build né dipendenze esterne, e si pubblica con GitHub Pages dalla radice del ramo principale. `app.js` legge l'ultima release dall'API di GitHub e mostra versione, dimensione, data e note; se la chiamata fallisce il bottone punta alla pagina delle release. Le schermate in `assets/` si rigenerano con `capture.mjs` dal monorepo del gioco.
