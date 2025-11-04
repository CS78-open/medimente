// types.ts

/**
 * Represents a single medication entry with its details.
 */
export interface MedicationEntry {
  farmaco: string;
  dosaggio: string;
  oraImportante: string;
  motivo: string;
}

/**
 * Represents the structured output expected from the LLM, containing
 * a Markdown table summary, a structured array of medication entries,
 * and a gentle narrative story.
 */
export interface LLMOutput {
  summaryTable: string;
  structuredSummary: MedicationEntry[]; // New field for structured data
  gentleStory: string;
}

/**
 * Defines the possible states of the LLM interaction for UI feedback.
 */
export enum LLMState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}