'use client';

import { useTranslation } from 'react-i18next';
import { Collapsible } from '~~/components/smallerComponents/Collapsible';

export default function QA() {
  const { t } = useTranslation();
  
  return (
    <main style={{ padding: '0.2rem', fontFamily: 'sans-serif' }}>
      <Collapsible
        title={t(`What is this app`)}
        defaultOpen={false}
      >
        <div>{t('What is this app (contents)')}</div>
      </Collapsible>
    </main>
  );
}