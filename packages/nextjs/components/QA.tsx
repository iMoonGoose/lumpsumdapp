'use client';

import { Collapsible } from '~~/components/smallerComponents/Collapsible';

export default function QA() {
  return (
    <main style={{ padding: '0.2rem', fontFamily: 'sans-serif' }}>
      <Collapsible
        title={`What is this app`}
        defaultOpen={false}
      >
        <div>
          I believe that trust is essencial. I believe that trust builds on experience. This app helps people build trust by providing a reliable framework that enables posponed bonus payments
        </div>
      </Collapsible>
    </main>
  );
}