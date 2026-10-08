'use client'

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ES, GB, RU } from 'country-flag-icons/react/3x2';
import { InlineDropdown } from './InlineDropdows';
import { useAppState } from '~~/hooks/appContext';
import { DEFAULT_TIME_LOCALE } from '~~/utils/formatting';

const languages = [
  { value: 'es', label: 'Español', Flag: ES, locale: 'es-ES' },
  { value: 'en', label: 'English', Flag: GB, locale: 'en-GB' },
  { value: 'ru', label: 'Русский', Flag: RU, locale: 'ru-RU' },
];

export function LanguageDropdown() {
  const { i18n } = useTranslation();
  const { setTimeLocale } = useAppState();

  const selected = languages.find((l) => l.value === i18n.language.substring(0, 2)) || languages[0];

  const handleSelect = (code: string) => {
    i18n.changeLanguage(code);
    setTimeLocale(languages.find((l) => l.value === code)?.locale ?? DEFAULT_TIME_LOCALE);
  };

  return (
    <InlineDropdown
        label={<selected.Flag className="w-5 h-4" />}
        options={languages}
        onSelect={handleSelect}
        className="pr-1"
      />
  );
}