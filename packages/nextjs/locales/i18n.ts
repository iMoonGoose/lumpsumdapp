// src/i18n.js
// Import translation resources
import en from "./en.json";
import es from "./es.json";
import ru from "./ru.json";
import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      ru: { translation: ru },
    },
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      caches: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
      order: ["localStorage", "navigator", "htmlTag"],
    },
  });

export default i18n;
