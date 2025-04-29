import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';

function SpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');
  const [interimResult, setInterimResult] = useState('');
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState(false);
  const [savedTranscripts, setSavedTranscripts] = useState([]);
  const [stats, setStats] = useState({ words: 0, chars: 0 });
  const [showSaved, setShowSaved] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const mediaStreamRef = useRef(null); // Add this ref to track the media stream

  // Add this cleanup function
  const stopMicrophone = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  }, []);

  // Add cleanup on component unmount
  useEffect(() => {
    return () => {
      if (recognition) {
        recognition.stop();
      }
      stopMicrophone();
      // Save draft on unmount
      if (transcript) {
        localStorage.setItem('draft-transcript', transcript);
      }
    };
  }, [recognition, transcript, stopMicrophone]);

  // Updated languages array with Nigerian languages prioritized after English
  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-NG', name: 'English (Nigeria)' },
    { code: 'ha-NG', name: 'Hausa' },
    { code: 'yo-NG', name: 'Yorùbá' },
    { code: 'ig-NG', name: 'Igbo' },
    // Other international languages
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'es-ES', name: 'Spanish' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'ja-JP', name: 'Japanese' },
  ];

  // Check if mobile on mount
  useEffect(() => {
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
    
    // Load saved transcripts and draft
    const saved = JSON.parse(localStorage.getItem('transcripts') || '[]');
    setSavedTranscripts(saved);
    
    const draft = localStorage.getItem('draft-transcript');
    if (draft) {
      setTranscript(draft);
    }

    // Check microphone availability (only auto-check on desktop)
    if (!isMobile) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => setIsMicrophoneAvailable(true))
        .catch(() => setIsMicrophoneAvailable(false));
    }
  }, [isMobile]);

  // Auto-save draft
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (transcript) {
        localStorage.setItem('draft-transcript', transcript);
      }
    }, 5000);
    
    return () => clearInterval(saveInterval);
  }, [transcript]);

  // Update statistics
  useEffect(() => {
    const words = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
    const chars = transcript.length;
    setStats({ words, chars });
  }, [transcript]);

  // Initialize speech recognition
  const initializeSpeechRecognition = useCallback(() => {
    if (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser. Please try Chrome or Safari.');
      return null;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Mobile-friendly configuration
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = selectedLanguage;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onerror = (event) => {
        console.log("Speech recognition error", event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow microphone access.');
        } else if (event.error === 'audio-capture') {
          setError('No microphone found. Please ensure a microphone is connected.');
        } else if (event.error === 'network') {
          setError('Network error. Please check your connection.');
        } else {
          setError(`Error occurred: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        if (isListening) {
          try {
            recognition.start();
          } catch (e) {
            console.error("Failed to restart recognition", e);
            setIsListening(false);
          }
        } else {
          setIsListening(false);
        }
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => {
            return prev ? prev + ' ' + finalTranscript.trim() : finalTranscript.trim();
          });
        }
        setInterimResult(interimTranscript);
      };

      return recognition;
    } catch (err) {
      setError('Failed to initialize speech recognition');
      console.error('Speech recognition initialization error:', err);
      return null;
    }
  }, [selectedLanguage, isListening]);

  // Initialize recognition when language changes
  useEffect(() => {
    if (isListening) {
      const newRecognition = initializeSpeechRecognition();
      if (newRecognition) {
        setRecognition(newRecognition);
        newRecognition.start();
      }
    }
    return () => {
      if (recognition) {
        recognition.stop();
      }
      stopMicrophone(); // Clean up microphone on unmount or language change
    };
  }, [selectedLanguage, initializeSpeechRecognition, stopMicrophone, recognition]);

  const toggleListening = async () => {
    if (isListening) {
      setIsListening(false);
      if (recognition) {
        recognition.stop();
      }
      stopMicrophone(); // Stop the microphone when stopping listening
      return;
    }

    // On mobile, we need to request permission through a user gesture
    try {
      // Request microphone access and store the stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setIsMicrophoneAvailable(true);
      
      setTranscript('');
      setInterimResult('');
      setIsListening(true);
      
      const newRecognition = initializeSpeechRecognition();
      if (newRecognition) {
        setRecognition(newRecognition);
        try {
          newRecognition.start();
        } catch (err) {
          console.error("Failed to start recognition", err);
          setError('Failed to start speech recognition');
          setIsListening(false);
          stopMicrophone(); // Clean up if starting fails
        }
      }
    } catch (err) {
      setError('Please enable microphone access to use this feature');
      setIsMicrophoneAvailable(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      setError('Failed to copy text to clipboard');
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    setInterimResult('');
    localStorage.removeItem('draft-transcript');
  };

  const saveTranscript = () => {
    try {
      const newTranscript = {
        id: Date.now(),
        text: transcript,
        date: new Date().toISOString(),
        language: selectedLanguage,
        stats: { ...stats }
      };
      
      const updatedTranscripts = [newTranscript, ...savedTranscripts];
      
      // Check storage limits (5MB is typical for mobile)
      if (JSON.stringify(updatedTranscripts).length > 4.5 * 1024 * 1024) {
        setError('Storage limit reached. Please delete some saved transcripts.');
        return;
      }
      
      setSavedTranscripts(updatedTranscripts);
      localStorage.setItem('transcripts', JSON.stringify(updatedTranscripts));
      localStorage.removeItem('draft-transcript');
      setTranscript('');
      setInterimResult('');
    } catch (err) {
      setError('Failed to save transcript. Storage might be full.');
    }
  };

  const exportTranscript = () => {
    const content = `
Transcript
Date: ${format(new Date(), 'PPpp')}
Language: ${languages.find(l => l.code === selectedLanguage)?.name}
Words: ${stats.words}
Characters: ${stats.chars}

${transcript}
    `.trim();

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteSavedTranscript = (id) => {
    const updated = savedTranscripts.filter(t => t.id !== id);
    setSavedTranscripts(updated);
    localStorage.setItem('transcripts', JSON.stringify(updated));
  };

  const loadSavedTranscript = (saved) => {
    setTranscript(saved.text);
    setSelectedLanguage(saved.language);
    setShowSaved(false);
  };

  const getLanguageName = (code) => {
    const language = languages.find(lang => lang.code === code);
    return language ? language.name : code;
  };

  const renderLanguageOptions = () => {
    return (
      <>
        <optgroup label="Nigeria">
          <option value="en-NG">English (Nigeria)</option>
          <option value="ha-NG">Hausa</option>
          <option value="yo-NG">Yorùbá</option>
          <option value="ig-NG">Igbo</option>
        </optgroup>
        <optgroup label="International">
          <option value="en-US">English (US)</option>
          <option value="ar-SA">Arabic</option>
          <option value="es-ES">Spanish</option>
          <option value="fr-FR">French</option>
          <option value="de-DE">German</option>
          <option value="it-IT">Italian</option>
          <option value="ja-JP">Japanese</option>
        </optgroup>
      </>
    );
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Speech to Text
        </h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-2 w-full sm:w-auto"
            disabled={isListening}
          >
            {renderLanguageOptions()}
          </select>
          <button
            onClick={toggleListening}
            disabled={!isMicrophoneAvailable && !isMobile}
            className={`px-4 py-2 rounded-lg ${
              isListening
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary-500 hover:bg-primary-600'
            } text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto`}
          >
            {isListening ? (
              <>
                <span className="inline-block mr-2">Listening...</span>
                <span className="inline-flex items-center">
                  <span className="animate-ping absolute h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </>
            ) : (
              'Start Listening'
            )}
          </button>
        </div>
      </div>

      {isMobile && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <p>For best results on mobile:</p>
          <ul className="list-disc pl-5 mt-1">
            <li>Use Chrome or Safari</li>
            <li>Hold your phone close to your mouth</li>
            <li>Speak clearly in a quiet environment</li>
          </ul>
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {copySuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">Text copied to clipboard!</span>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="min-h-[200px] mb-4">
          <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {transcript}
            <span className="text-gray-500 italic">{interimResult}</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Words: {stats.words} | Characters: {stats.chars}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowSaved(!showSaved)}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              {showSaved ? 'Hide Saved' : 'Show Saved'}
            </button>
            <button
              onClick={clearTranscript}
              className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 rounded bg-primary-500 text-white hover:bg-primary-600 transition-colors"
            >
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={saveTranscript}
              disabled={!transcript}
              className="px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
            <button
              onClick={exportTranscript}
              disabled={!transcript}
              className="px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Export
            </button>
          </div>
        </div>

        {showSaved && savedTranscripts.length > 0 && (
          <div className="mt-6 border-t pt-4">
            <h2 className="text-lg font-semibold mb-4">Saved Transcripts</h2>
            <div className="space-y-4">
              {savedTranscripts.map((saved) => (
                <div key={saved.id} className="border rounded p-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                    <div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(saved.date), 'PPpp')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getLanguageName(saved.language)} | 
                        Words: {saved.stats.words} | 
                        Characters: {saved.stats.chars}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadSavedTranscript(saved)}
                        className="text-sm px-2 py-1 rounded bg-primary-500 text-white hover:bg-primary-600"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deleteSavedTranscript(saved.id)}
                        className="text-sm px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-2 mt-2">
                    {saved.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SpeechToText;




