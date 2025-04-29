import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY;

export const encryptData = (data) => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
};

export const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

export const secureStore = {
  set: (key, data) => {
    const encrypted = encryptData(data);
    if (encrypted) {
      localStorage.setItem(key, encrypted);
      return true;
    }
    return false;
  },
  
  get: (key) => {
    const encrypted = localStorage.getItem(key);
    if (encrypted) {
      return decryptData(encrypted);
    }
    return null;
  }
};