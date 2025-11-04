// types.js

/**
 * Represents a single medication entry with its details.
 * @typedef {object} MedicationEntry
 * @property {string} farmaco
 * @property {string} dosaggio
 * @property {string} oraImportante
 * @property {string} motivo
 */

/**
 * Represents the structured output expected from the LLM, containing
 * a Markdown table summary, a structured array of medication entries,
 * and a gentle narrative story.
 * @typedef {object} LLMOutput
 * @property {string} summaryTable
 * @property {MedicationEntry[]} structuredSummary
 * @property {string} gentleStory
 */

/**
 * Defines the possible states of the LLM interaction for UI feedback.
 */
export const LLMState = {
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
};