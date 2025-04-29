import React, { createContext, useContext, useState } from 'react';

const AccessibilityContext = createContext();

export function AccessibilityProvider({ children }) {
  const [fontSize, setFontSize] = useState('normal'); // normal, large, xlarge
  const [highContrast, setHighContrast] = useState(false);
  const [voiceInstructions, setVoiceInstructions] = useState(true);
  
  const speak = (text) => {
    if (voiceInstructions && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-NG'; // Default to Nigerian English
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <AccessibilityContext.Provider value={{
      fontSize,
      setFontSize,
      highContrast,
      setHighContrast,
      voiceInstructions,
      setVoiceInstructions,
      speak
    }}>
      <div className={`
        ${fontSize === 'large' ? 'text-lg' : fontSize === 'xlarge' ? 'text-xl' : 'text-base'}
        ${highContrast ? 'high-contrast' : ''}
      `}>
        {children}
      </div>
    </AccessibilityContext.Provider>
  );
}