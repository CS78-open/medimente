
import { jsx as _jsx } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";
import React, {
  useState,
  useCallback,
  useEffect,
  useRef
} from 'react';
import {
  generateMedicationReminder,
  extractTextFromFile
} from './services/geminiService.js';
import {
  LLMState
} from './types.js'; // Note: MedicationEntry and LLMOutput are only types, not runtime values.
import MarkdownRenderer from './components/MarkdownRenderer.js';
const parseTime = timeString => {
  const match = timeString.match(/(\d{1,2}:\d{2})/);
  if (match && match[1]) {
    return match[1]; // e.g., "08:00"
  }
  // Default or best guess for non-standard times
  if (timeString.toLowerCase().includes('mattina')) return '08:00';
  if (timeString.toLowerCase().includes('pranzo')) return '12:00';
  if (timeString.toLowerCase().includes('sera') || timeString.toLowerCase().includes('cena')) return '18:00';
  if (timeString.toLowerCase().includes('dormire') || timeString.toLowerCase().includes('notte')) return '22:00';
  return '09:00'; // Generic default
};
function App() {
  const [medicalText, setMedicalText] = useState('');
  const [llmOutput, setLlmOutput] = useState(null);
  const [llmState, setLlmState] = useState(LLMState.IDLE);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Cleanup speech synthesis on component unmount to prevent lingering audio
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);
  const handleFileChange = useCallback(async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsProcessingFile(true);
    setError(null);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const result = reader.result;
        const [header, base64Data] = result.split(',');
        if (!header || !base64Data) {
          throw new Error("Formato file non valido.");
        }
        const mimeType = header.match(/:(.*?);/)?.[1];
        if (!mimeType) {
          throw new Error("Impossibile determinare il tipo MIME del file.");
        }
        const extractedText = await extractTextFromFile(mimeType, base64Data);
        setMedicalText(extractedText);
      } catch (e) {
        let errorMessage = "Si è verificato un errore durante l'elaborazione del file.";
        if (e instanceof Error) {
          errorMessage = `Errore: ${e.message}`;
        }
        setError(errorMessage);
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.onerror = error => {
      console.error("Error reading file:", error);
      setError("Impossibile leggere il file selezionato.");
      setIsProcessingFile(false);
    };

    // Reset file input value to allow re-uploading the same file
    if (event.target) {
      event.target.value = '';
    }
  }, []);
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  const handleGenerateReminder = useCallback(async () => {
    setError(null);
    setLlmOutput(null);
    setLlmState(LLMState.LOADING);
    if (!medicalText.trim()) {
      setError("Per favora, inserisci le istruzioni mediche.");
      setLlmState(LLMState.IDLE);
      return;
    }
    try {
      const output = await generateMedicationReminder(medicalText);
      setLlmOutput(output);
      setLlmState(LLMState.SUCCESS);
    } catch (e) {
      console.error("Error during reminder generation:", e);
      // Ensure error message is user-friendly and not internal API details
      let errorMessage = "Si è verificato un errore durante la generazione del promemoria. Riprova più tardi.";
      if (e instanceof Error) {
        errorMessage = `Errore: ${e.message}`;
      }
      setError(errorMessage);
      setLlmState(LLMState.ERROR);
    }
  }, [medicalText]);
  const handleAddSingleEventToCalendar = useCallback(entry => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const parsedTime = parseTime(entry.oraImportante); // "HH:MM"
    const [hours, minutes] = parsedTime.split(':').map(Number);

    // Create a date object to easily add minutes
    const startTime = new Date();
    startTime.setHours(hours, minutes, 0, 0);
    const endTime = new Date(startTime.getTime() + 15 * 60000); // Add 15 minutes

    const formatForGoogle = date => {
      const h = date.getHours().toString().padStart(2, '0');
      const m = date.getMinutes().toString().padStart(2, '0');
      return `${h}${m}00`;
    };
    const startDateTimeStr = `${year}${month}${day}T${formatForGoogle(startTime)}`;
    const endDateTimeStr = `${year}${month}${day}T${formatForGoogle(endTime)}`;
    const eventTitle = `Promemoria: ${entry.farmaco}`;
    const eventDescription = `${entry.dosaggio} per ${entry.motivo}.\n\n---\nGenerato da MediMente.`;
    const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&details=${encodeURIComponent(eventDescription)}&dates=${startDateTimeStr}/${endDateTimeStr}&recur=RRULE:FREQ=DAILY`;
    window.open(calendarUrl, '_blank');
  }, []);
  const handleSpeakStory = useCallback(() => {
    if (!('speechSynthesis' in window) || !(llmOutput && llmOutput.gentleStory)) {
      alert("La sintesi vocale non è supportata dal tuo browser o non c'è nessuna storia da raccontare.");
      return;
    }
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(llmOutput.gentleStory);
    utterance.lang = 'it-IT'; // Set language to Italian for correct pronunciation

    utterance.onstart = () => {
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setError("Si è verificato un errore durante la riproduzione vocale.");
    };
    window.speechSynthesis.speak(utterance);
  }, [llmOutput, isSpeaking]);
  return (
    /*#__PURE__*/
    _jsxs("div", {
      className: "min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center p-4 sm:p-6 lg:p-8",
      children: [
        /*#__PURE__*/
        _jsxs("header", {
          className: "w-full max-w-3xl text-center py-6",
          children: [
            /*#__PURE__*/
            _jsx("h1", {
              className: "text-4xl font-extrabold text-blue-800 tracking-tight sm:text-5xl",
              children: "MediMente"
            }),
            /*#__PURE__*/
            _jsx("p", {
              className: "mt-4 text-lg text-blue-600",
              children: "Il tuo assistente AI per istruzioni mediche chiare e promemoria personalizzati."
            })
          ]
        }),
        /*#__PURE__*/
        _jsxs("main", {
          className: "flex-grow w-full max-w-3xl bg-white shadow-xl rounded-lg p-6 sm:p-8 lg:p-10 mb-8",
          children: [
            /*#__PURE__*/
            _jsxs("section", {
              className: "mb-8",
              children: [
                /*#__PURE__*/
                _jsx("label", {
                  htmlFor: "medical-instructions",
                  className: "block text-xl font-semibold text-gray-800 mb-3",
                  children: "1. Inserisci o carica le istruzioni mediche"
                }),
                /*#__PURE__*/
                _jsxs("div", {
                  className: "mb-4",
                  children: [
                    /*#__PURE__*/
                    _jsx("input", {
                      type: "file",
                      ref: fileInputRef,
                      onChange: handleFileChange,
                      className: "hidden",
                      accept: "image/jpeg,image/png,image/webp,application/pdf"
                    }),
                    /*#__PURE__*/
                    _jsx("button", {
                      onClick: handleUploadClick,
                      disabled: isProcessingFile,
                      className: "w-full flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed",
                      children: isProcessingFile ? /*#__PURE__*/_jsxs(React.Fragment, {
                        children: [
                          /*#__PURE__*/
                          _jsx("svg", {
                            className: "animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700",
                            xmlns: "http://www.w3.org/2000/svg",
                            fill: "none",
                            viewBox: "0 0 24 24",
                            children: [
                              /*#__PURE__*/
                              _jsx("circle", {
                                className: "opacity-25",
                                cx: "12",
                                cy: "12",
                                r: "10",
                                stroke: "currentColor",
                                strokeWidth: "4"
                              }),
                              /*#__PURE__*/
                              _jsx("path", {
                                className: "opacity-75",
                                fill: "currentColor",
                                d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              })
                            ]
                          }),
                          "Elaborazione..."
                        ]
                      }) : /*#__PURE__*/_jsxs(React.Fragment, {
                        children: [
                          /*#__PURE__*/
                          _jsx("svg", {
                            className: "-ml-1 mr-3 h-5 w-5",
                            fill: "currentColor",
                            viewBox: "0 0 20 20",
                            xmlns: "http://www.w3.org/2000/svg",
                            children: /*#__PURE__*/
                            _jsx("path", {
                              fillRule: "evenodd",
                              d: "M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z",
                              clipRule: "evenodd"
                            })
                          }),
                          "Carica Foto o PDF della Prescrizione"
                        ]
                      })
                    })
                  ]
                }),
                /*#__PURE__*/
                _jsx("textarea", {
                  id: "medical-instructions",
                  className: "w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-700 resize-y min-h-[150px] shadow-sm",
                  placeholder: "Il testo della prescrizione apparirà qui dopo il caricamento, oppure puoi scriverlo o incollarlo direttamente.",
                  value: medicalText,
                  onChange: e => setMedicalText(e.target.value),
                  rows: 8
                })
              ]
            }),
            /*#__PURE__*/
            _jsx("section", {
              className: "mb-8",
              children: /*#__PURE__*/
              _jsx("button", {
                onClick: handleGenerateReminder,
                disabled: llmState === LLMState.LOADING,
                className: "w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed sm:text-lg sm:px-10",
                children: llmState === LLMState.LOADING ? /*#__PURE__*/_jsxs(React.Fragment, {
                  children: [
                    /*#__PURE__*/
                    _jsx("svg", {
                      className: "animate-spin -ml-1 mr-3 h-5 w-5 text-white",
                      xmlns: "http://www.w3.org/2000/svg",
                      fill: "none",
                      viewBox: "0 0 24 24",
                      children: [
                        /*#__PURE__*/
                        _jsx("circle", {
                          className: "opacity-25",
                          cx: "12",
                          cy: "12",
                          r: "10",
                          stroke: "currentColor",
                          strokeWidth: "4"
                        }),
                        /*#__PURE__*/
                        _jsx("path", {
                          className: "opacity-75",
                          fill: "currentColor",
                          d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        })
                      ]
                    }),
                    "Generazione..."
                  ]
                }) : "2. Genera Promemoria"
              })
            }),
            error && /*#__PURE__*/_jsxs("div", {
              className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-8",
              role: "alert",
              children: [
                /*#__PURE__*/
                _jsx("strong", {
                  className: "font-bold",
                  children: "Errore: "
                }),
                /*#__PURE__*/
                _jsx("span", {
                  className: "block sm:inline",
                  children: error
                })
              ]
            }),
            llmOutput && llmState === LLMState.SUCCESS && /*#__PURE__*/_jsxs("section", {
              children: [
                /*#__PURE__*/
                _jsx("h2", {
                  className: "text-2xl font-semibold text-gray-800 mb-4",
                  children: "3. Il tuo promemoria personalizzato:"
                }),
                /*#__PURE__*/
                _jsxs("div", {
                  className: "mb-8 p-6 bg-blue-50 border-l-4 border-blue-400 rounded-lg shadow-inner",
                  children: [
                    /*#__PURE__*/
                    _jsx("h3", {
                      className: "text-xl font-bold text-blue-700 mb-3",
                      children: "RIASSUNTO FACILE (Tabella):"
                    }),
                    /*#__PURE__*/
                    _jsx("div", {
                      className: "overflow-x-auto",
                      children: /*#__PURE__*/
                      _jsx(MarkdownRenderer, {
                        className: "text-gray-700",
                        children: llmOutput.summaryTable
                      })
                    })
                  ]
                }),
                /*#__PURE__*/
                _jsxs("div", {
                  className: "mb-8 p-6 bg-purple-50 border-l-4 border-purple-400 rounded-lg shadow-inner",
                  children: [
                    /*#__PURE__*/
                    _jsx("h3", {
                      className: "text-xl font-bold text-purple-700 mb-4",
                      children: "AGGIUNGI AL CALENDARIO:"
                    }),
                    /*#__PURE__*/
                    _jsx("div", {
                      className: "flex flex-col space-y-3",
                      children: llmOutput.structuredSummary.map((entry, index) => /*#__PURE__*/_jsxs("button", {
                        onClick: () => handleAddSingleEventToCalendar(entry),
                        className: "w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150 ease-in-out",
                        children: [
                          /*#__PURE__*/
                          _jsx("svg", {
                            className: "-ml-1 mr-3 h-5 w-5",
                            fill: "currentColor",
                            viewBox: "0 0 20 20",
                            xmlns: "http://www.w3.org/2000/svg",
                            children: /*#__PURE__*/
                            _jsx("path", {
                              fillRule: "evenodd",
                              d: "M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z",
                              clipRule: "evenodd"
                            })
                          }),
                          /*#__PURE__*/
                          _jsxs("span", {
                            children: ["Aggiungi promemoria per ", /*#__PURE__*/_jsx("strong", {
                              children: entry.farmaco
                            })]
                          })
                        ]
                      }, index))
                    })
                  ]
                }),
                /*#__PURE__*/
                _jsxs("div", {
                  className: "p-6 bg-green-50 border-l-4 border-green-400 rounded-lg shadow-inner",
                  children: [
                    /*#__PURE__*/
                    _jsxs("div", {
                      className: "flex justify-between items-center mb-3",
                      children: [
                        /*#__PURE__*/
                        _jsx("h3", {
                          className: "text-xl font-bold text-green-700",
                          children: "STORIELLA GENTILE:"
                        }),
                        /*#__PURE__*/
                        _jsx("button", {
                          onClick: handleSpeakStory,
                          disabled: !('speechSynthesis' in window),
                          className: "p-2 rounded-full text-green-700 bg-green-200 hover:bg-green-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed",
                          "aria-label": isSpeaking ? "Ferma la lettura" : "Ascolta la storiella",
                          children: isSpeaking ? /*#__PURE__*/_jsx("svg", {
                            className: "h-6 w-6",
                            fill: "currentColor",
                            viewBox: "0 0 20 20",
                            xmlns: "http://www.w3.org/2000/svg",
                            children: /*#__PURE__*/
                            _jsx("path", {
                              d: "M5 5a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V6a1 1 0 00-1-1H5z"
                            })
                          }) : /*#__PURE__*/_jsx("svg", {
                            className: "h-6 w-6",
                            fill: "none",
                            stroke: "currentColor",
                            viewBox: "0 0 24 24",
                            xmlns: "http://www.w3.org/2000/svg",
                            children: /*#__PURE__*/
                            _jsx("path", {
                              strokeLinecap: "round",
                              strokeLinejoin: "round",
                              strokeWidth: "2",
                              d: "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                            })
                          })
                        })
                      ]
                    }),
                    /*#__PURE__*/
                    _jsx("p", {
                      className: "text-gray-700 leading-relaxed",
                      children: llmOutput.gentleStory
                    })
                  ]
                })
              ]
            })
          ]
        }),
        /*#__PURE__*/
        _jsx("footer", {
          className: "w-full max-w-3xl text-center py-4",
          children: /*#__PURE__*/_jsxs("p", {
            className: "text-gray-600 text-sm",
            children: ["L'app \xE8 progettata da ", /*#__PURE__*/_jsx("a", {
              href: "https://openssn.marcopingitore.it",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "underline hover:text-blue-700 transition-colors",
              children: "Marco Pingitore"
            })]
          })
        })
      ]
    })
  );
}
export default App;