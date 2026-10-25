"use client";

import { useTranslation } from "react-i18next";
import { Collapsible } from "~~/components/smallerComponents/Collapsible";

export default function QA() {
  const { t } = useTranslation();

  return (
    <main className="flex flex-col space-y-2">
      <Collapsible title={t(`What is this app`)} defaultOpen={false}>
        <div>{t("What is this app (contents)")}</div>
      </Collapsible>
      <Collapsible title={t(`What is shorter`)} defaultOpen={false}>
        <div>{t("What is shorter (contents)")}</div>
      </Collapsible>
      <Collapsible title={t(`The idea`)} defaultOpen={false}>
        <div>{t("The idea (contents)")}</div>
      </Collapsible>
      <Collapsible title={t(`Balance is key`)} defaultOpen={false}>
        <div>{t("Balance is key (contents)")}</div>
      </Collapsible>
      <Collapsible title={t(`The details`)} defaultOpen={false}>
        <div>{t("The details (contents)")}</div>
      </Collapsible>
      <Collapsible title={t(`How can I trust you`)} defaultOpen={false}>
        <div>{t("How can I trust you (contents)")}</div>
      </Collapsible>
      <Collapsible title={t(`Why does it leave some money in the allowance`)} defaultOpen={false}>
        <div>{t("Why does it leave some money in the allowance (contents)")}</div>
      </Collapsible>
    </main>
  );
}
