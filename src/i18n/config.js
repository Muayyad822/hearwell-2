import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // English translations
    }
  },
  ha: {
    translation: {
      // Hausa translations
      'Welcome to': 'Barka da zuwa',
      'Start Converting': 'Fara Canza',
      'Sound Amplifier': 'Mai Ƙarfafa Sauti',
      'Tinnitus Relief': 'Warkarwa daga Tinnitus'
    }
  },
  yo: {
    translation: {
      // Yoruba translations
      'Welcome to': 'E kaabo si',
      'Start Converting': 'Bẹrẹ Yiyi',
      'Sound Amplifier': 'Olukopa Ohùn',
      'Tinnitus Relief': 'Iṣẹ Irọrun Tinnitus'
    }
  },
  ig: {
    translation: {
      // Igbo translations
      'Welcome to': 'Nnọọ na',
      'Start Converting': 'Bido Ntụgharị',
      'Sound Amplifier': 'Mgbali Ụda',
      'Tinnitus Relief': 'Mbelata Tinnitus'
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;