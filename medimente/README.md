
# MediMente

Questa è un'applicazione web progettata per rendere le istruzioni mediche più accessibili e facili da seguire. Utilizzando le capacità di un Large Language Model (LLM) di Google Gemini, l'app prende in input testo medico grezzo (digitato manualmente o estratto da immagini/PDF) e lo trasforma in un formato comprensibile, accompagnato da una storiella gentile per facilitare la memorizzazione e una pratica integrazione con Google Calendar.

## Caratteristiche Principali

*   **Input Flessibile:** Inserisci le istruzioni mediche direttamente tramite una casella di testo o carica un'immagine (JPEG, PNG, WEBP) o un documento PDF. L'app utilizza l'OCR (Optical Character Recognition) tramite l'API di Gemini per estrarre automaticamente il testo da questi file.
*   **Riassunto Strutturato:** Il testo medico viene elaborato per generare una tabella Markdown chiara e concisa che riassume i farmaci, il loro dosaggio, l'orario importante per l'assunzione e il motivo per cui vengono presi.
*   **Promemoria Calendario Intelligenti:** Ogni farmaco e il suo orario vengono trasformati in un evento del calendario. L'app offre la possibilità di aggiungere singolarmente questi promemoria a Google Calendar, con una frequenza giornaliera pre-configurata, facilitando l'aderenza alla terapia.
*   **Storiella Gentile:** Per aiutare a ricordare le istruzioni in modo più creativo e meno intimidatorio, l'LLM genera una breve storiella narrativa. Questa storiella è pensata per essere rassicurante e adatta a un pubblico di tutte le età, inclusi anziani e bambini.
*   **Sintesi Vocale (TTS):** Ascolta la storiella generata dall'LLM grazie all'integrazione con la sintesi vocale del browser, rendendo l'esperienza più accessibile e coinvolgente.
*   **Interfaccia Utente Intuitiva:** Un design pulito e reattivo basato su Tailwind CSS garantisce un'esperienza utente piacevole su dispositivi di diverse dimensioni.
*   **Feedback di Stato:** Indicatori visivi chiari mostrano lo stato dell'elaborazione (caricamento, successo, errore) per tenere l'utente sempre informato.

## Architettura e Componenti Chiave

L'applicazione è sviluppata in React e utilizza le seguenti funzionalità:

*   **React:** Per la costruzione dell'interfaccia utente interattiva.
*   **Google Gemini API (`@google/genai`):** Il cuore dell'intelligenza dell'app. Viene utilizzato per:
    *   **Estrazione Testo:** Il modello `gemini-2.5-flash` (multi-modale) è impiegato per l'OCR da immagini e PDF.
    *   **Generazione Promemoria:** Il modello `gemini-2.5-flash` viene usato per trasformare il testo medico in un riassunto strutturato, una tabella Markdown e la storiella. La configurazione `responseSchema` assicura che l'output sia un JSON coerente e predicibile.
*   **Speech Synthesis API (Browser):** Utilizzata per convertire la storiella in audio, con supporto per la lingua italiana.
*   **Google Calendar API (Tramite URL):** L'integrazione avviene generando URL pre-popolati per la creazione di eventi, che l'utente può aprire e confermare direttamente nel proprio Google Calendar.
*   **Tailwind CSS:** Per uno styling rapido e personalizzabile.
*   **`react-markdown` e `remark-gfm`:** Per il rendering delle tabelle Markdown generate dall'LLM.

## Prerequisiti

Per eseguire questa applicazione localmente, avrai bisogno di:

-   [Node.js](https://nodejs.org/) (versione 18 o superiore) installato sul tuo computer.
-   Una **chiave API di Google Gemini**. Puoi ottenerne una gratuitamente da [Google AI Studio](https://aistudio.google.com/app/apikey).
-   La chiave API deve essere configurata come variabile d'ambiente chiamata `API_KEY` nel tuo ambiente di esecuzione.

## Configurazione

1.  **Clona il Progetto**
    ```bash
    git clone https://github.com/tuo-utente/medimente.git
    cd medimente
    ```

2.  **Installa le Dipendenze**
    ```bash
    npm install
    ```
    Questo comando installerà il server web locale (`serve`) e tutte le dipendenze di React.

3.  **Configura la Tua Chiave API**
    L'applicazione preleva automaticamente la chiave API dalla variabile d'ambiente `process.env.API_KEY`.
    
    **Non è necessario modificare alcun file di codice (come `config.ts` o `config.js`) per configurare la chiave API.**
    
    Per eseguire l'app localmente, assicurati che la variabile d'ambiente `API_KEY` sia impostata prima di avviare il server. Puoi farlo in diversi modi:
    
    *   **Temporaneamente nel terminale (per sessione corrente):**
        ```bash
        export API_KEY='LA_TUA_CHIAVE_API' # Linux/macOS
        set API_KEY='LA_TUA_CHIAVE_API'   # Windows (CMD)
        $env:API_KEY='LA_TUA_CHIAVE_API'  # Windows (PowerShell)
        ```
    *   **Usando un file `.env` (richiede `dotenv` o configurazioni simili, non incluso di default in questo setup semplice):** Se volessi un file `.env`, dovresti installare e configurare la libreria `dotenv`. Per questo progetto, si assume che la variabile d'ambiente sia già presente nell'ambiente di esecuzione.

## Come Eseguire l'App

Dopo aver installato le dipendenze e configurato la chiave API, avvia l'applicazione con:

```bash
npm start
```

Il terminale ti mostrerà un indirizzo locale, solitamente `http://localhost:3000`. Apri questo indirizzo nel tuo browser web per usare l'applicazione.

## Nota sulla Sicurezza :warning:

Questa configurazione è pensata **esclusivamente per lo sviluppo e la dimostrazione in locale**.

**NON distribuire questa applicazione su un server pubblico (come Netlify, Vercel, GitHub Pages, ecc.) senza prima implementare un backend sicuro.** Effettuare chiamate dirette all'API di Gemini dal browser esporrebbe la tua chiave API a chiunque ispezioni il codice sorgente, con possibili conseguenze come costi inattesi o abusi. Per una distribuzione pubblica, le chiamate all'API di Gemini devono essere mediate da un server lato backend che mantenga la chiave API nascosta.

## Implementazioni Future (con HL7 FHIR e FSE)

Questa applicazione, nella sua forma attuale, dimostra il potenziale degli LLM per semplificare le informazioni mediche. Tuttavia, il vero impatto potrebbe essere raggiunto integrandosi con gli standard e i sistemi sanitari esistenti come **HL7 FHIR** (Fast Healthcare Interoperability Resources) e il **Fascicolo Sanitario Elettronico (FSE)**.

### Vantaggi dell'integrazione FHIR/FSE:

*   **Interoperabilità:** Garantire che i dati sanitari possano essere scambiati e compresi tra diversi sistemi.
*   **Accuratezza dei Dati:** Ridurre gli errori manuali e fornire informazioni mediche direttamente da fonti affidabili.
*   **Esperienza Utente Migliorata:** Automatizzare l'input dei dati e personalizzare ulteriormente i promemoria.
*   **Aderenza Terapeutica:** Fornire strumenti più efficaci per aiutare i pazienti a seguire le prescrizioni.

### Possibili Implementazioni:

1.  **Input Dati Diretti da FHIR/FSE:**
    *   **Autenticazione:** Implementare un flusso di autenticazione sicuro (es. OAuth 2.0 / OpenID Connect) per consentire agli utenti (pazienti o operatori sanitari) di accedere al proprio FSE o a un server FHIR.
    *   **Query FHIR:** L'app potrebbe interrogare risorse FHIR come `MedicationRequest` (prescrizioni attive), `MedicationStatement` (farmaci assunti dal paziente), `Patient` (informazioni demografiche), `Condition` (diagnosi) per ottenere automaticamente l'elenco dei farmaci del paziente.
    *   **Eliminazione OCR:** Con i dati strutturati direttamente da FHIR, il processo di OCR da immagini/PDF potrebbe diventare superfluo o essere utilizzato solo per referti non strutturati.

2.  **Output e Aggiornamento del FSE:**
    *   **Generazione di Risorse FHIR:** L'LLM potrebbe non solo semplificare le istruzioni, ma anche suggerire la creazione o l'aggiornamento di risorse FHIR (es. un `Communication` per il promemoria semplificato, o un `CarePlan` aggiornato con le istruzioni spiegate).
    *   **Push di Promemoria:** In un contesto clinico autorizzato, l'app potrebbe essere in grado di inviare i promemoria semplificati direttamente nel FSE del paziente, rendendoli disponibili anche ad altri operatori sanitari e ai familiari autorizzati.

3.  **Personalizzazione Avanzata:**
    *   **Contesto Clinico:** Utilizzando informazioni da risorse FHIR come `Patient` (età, lingua preferita), `Condition` (patologie croniche) e `AllergyIntolerance` (allergie note), l'LLM potrebbe generare storiella e promemoria ancora più personalizzati e rilevanti, adattando il linguaggio e gli esempi al contesto specifico del paziente.
    *   **Interazioni Farmacologiche:** Se l'app avesse accesso a `MedicationKnowledge` o ad altri servizi di supporto decisionale clinico, potrebbe integrare avvisi su potenziali interazioni farmacologiche nel riassunto semplificato.

4.  **Supporto Decisionale per Operatori Sanitari:**
    *   **Semplificazione per il Paziente:** Gli operatori sanitari potrebbero utilizzare l'app per generare rapidamente istruzioni semplificate da consegnare ai pazienti, migliorando la comprensione e l'aderenza.
    *   **Documentazione Migliorata:** L'output strutturato potrebbe essere utile per la documentazione nel FSE, garantendo che le istruzioni siano chiare e standardizzate.

L'integrazione con FHIR e FSE trasformerebbe questa demo in uno strumento potente e sicuro, capace di dialogare con l'ecosistema sanitario digitale per un'assistenza al paziente più efficiente e centrata.

## Contributi

I contributi sono benvenuti! Se hai idee per migliorare questa app, sentiti libero di aprire una issue o una pull request.

## Licenza

Questo progetto è rilasciato sotto licenza ISC.

---
L'app è progettata da [Marco Pingitore](https://openssn.marcopingitore.it).