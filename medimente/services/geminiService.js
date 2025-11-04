// services/geminiService.js
import {
  GoogleGenAI,
  Type
} from '@google/genai';
// Rimossa l'importazione di API_KEY da '../config.js' poiché useremo process.env.API_KEY direttamente

// Rimossa l'istanza globale di GoogleGenAI.
// const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Checks if the API key has been set in the config file.
 * If not, it throws a user-friendly error.
 * QUESTA FUNZIONE È STATA RIMOSSA.
 */
/*
function ensureApiKeyIsSet() {
  if (API_KEY === 'INCOLLA_LA_TUA_CHIAVE_API_QUI' || !API_KEY) {
    throw new Error("API_KEY non configurata. Apri il file 'config.ts' (o 'config.js') e inserisci la tua chiave API di Google Gemini come indicato nelle istruzioni del file README.md.");
  }
}
*/

/**
 * Defines the schema for the LLMOutput to ensure the model returns structured JSON.
 */
const llmOutputSchema = {
  type: Type.OBJECT,
  properties: {
    summaryTable: {
      type: Type.STRING,
      description: 'A markdown table summarizing medications, dosage, important time, and reason.'
    },
    structuredSummary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          farmaco: {
            type: Type.STRING,
            description: 'Name of the medication.'
          },
          dosaggio: {
            type: Type.STRING,
            description: 'Dosage of the medication.'
          },
          oraImportante: {
            type: Type.STRING,
            description: 'Important time for medication (e.g., "mattina", "alle 8", "dopo cena").'
          },
          motivo: {
            type: Type.STRING,
            description: 'Reason for taking the medication.'
          }
        },
        required: ['farmaco', 'dosaggio', 'oraImportante', 'motivo'],
        propertyOrdering: ['farmaco', 'dosaggio', 'oraImportante', 'motivo']
      },
      description: 'An array of structured medication entries.'
    },
    gentleStory: {
      type: Type.STRING,
      description: 'A gentle, short narrative story (max 100 words) to help remember the medications, suitable for elderly or children.'
    }
  },
  required: ['summaryTable', 'structuredSummary', 'gentleStory'],
  propertyOrdering: ['summaryTable', 'structuredSummary', 'gentleStory']
};

/**
 * Extracts handwritten or printed text from an image or PDF file.
 * @param mimeType The MIME type of the file (e.g., 'image/jpeg').
 * @param data The base64 encoded string of the file data.
 * @returns A promise that resolves to the extracted text.
 */
export async function extractTextFromFile(mimeType, data) {
  // ensureApiKeyIsSet(); // Rimossa
  try {
    const filePart = {
      inlineData: {
        mimeType,
        data
      }
    };
    const textPart = {
      text: 'Trascrivi il testo da questo file (immagine o PDF di una prescrizione medica scritta a mano). Restituisci solo il testo trascritto, senza alcuna formattazione o testo aggiuntivo.'
    };

    // Crea una nuova istanza di GoogleGenAI per ogni chiamata API
    const currentAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await currentAi.models.generateContent({
      model: 'gemini-2.5-flash',
      // This model is multi-modal
      contents: {
        parts: [filePart, textPart]
      }
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API for text extraction:", error);
    throw new Error(`Errore durante l'estrazione del testo dal file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Sends a request to the Gemini API to generate a medication reminder
 * based on the provided medical text.
 *
 * @param medicalText The raw medical instructions provided by the user.
 * @returns A Promise that resolves to an LLMOutput object containing the summary table and gentle story.
 * @throws An error if the API call to Gemini fails or the response is invalid.
 */
export async function generateMedicationReminder(medicalText) {
  // ensureApiKeyIsSet(); // Rimossa
  try {
    // Crea una nuova istanza di GoogleGenAI per ogni chiamata API
    const currentAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await currentAi.models.generateContent({
      model: 'gemini-2.5-flash',
      // Using gemini-2.5-flash for basic text tasks
      contents: [{
        parts: [{
          text: medicalText
        }]
      }],
      config: {
        responseMimeType: 'application/json',
        responseSchema: llmOutputSchema,
        systemInstruction: `Sei un assistente medico amichevole e gentile. Il tuo compito è prendere le istruzioni mediche grezze e trasformarle in un promemoria facile da capire e in una storiella delicata per aiutare a ricordare di prendere i farmaci. Devi fornire l'output nel formato JSON specificato.

1. \`summaryTable\`: Una tabella Markdown che riassume i farmaci, il dosaggio, l'orario importante e il motivo.
2. \`structuredSummary\`: Un array JSON di oggetti, ciascuno contenente 'farmaco', 'dosaggio', 'oraImportante' e 'motivo'.
3. \`gentleStory\`: Una breve storiella narrativa (massimo 100 parole) che incorpora i farmaci in modo gentile e creativo, adatta a persone anziane o bambini.

Assicurati che tutte le informazioni siano accurate e facili da capire. La storiella deve essere positiva e rassicurante.`
      }
    });
    const jsonStr = response.text.trim();
    const llmOutput = JSON.parse(jsonStr);

    // Basic validation of the LLM output structure
    if (!llmOutput.summaryTable || !Array.isArray(llmOutput.structuredSummary) || !llmOutput.gentleStory) {
      console.error("Invalid LLM output structure:", llmOutput);
      throw new Error("La risposta dell'LLM non è nel formato atteso. Riprova.");
    }
    return llmOutput;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Impossibile leggere la risposta dell'LLM. Sembra che l'output non sia un JSON valido. Riprova.");
    }
    throw new Error(`Errore durante la comunicazione con l'API Gemini: ${error instanceof Error ? error.message : String(error)}`);
  }
}