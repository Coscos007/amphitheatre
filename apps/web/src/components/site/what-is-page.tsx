import { IconDoor, IconEyeOff, IconHome, IconUsers } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { buttonVariants } from "../ui/button.tsx";
import { ContentPage } from "./content-page.tsx";
import { EditorialKicker, EditorialLead, EditorialStory, EditorialTitle } from "./editorial.tsx";

export function WhatIsPage() {
  const { t } = useTranslation();
  return (
    <ContentPage title={t("pages.whatIsTitle")}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
        <header className="flex max-w-2xl flex-col items-start gap-5">
          <div>
            <EditorialKicker>{t("pages.whatIsKicker")}</EditorialKicker>
            <EditorialTitle>{t("pages.whatIsTitle")}</EditorialTitle>
          </div>
          <EditorialLead>{t("pages.whatIsLead")}</EditorialLead>
          <Link to="/" className={buttonVariants({ variant: "primary", size: "touch" })}>
            {t("pages.goHome")}
          </Link>
        </header>
        <div className="grid grid-cols-1 gap-x-12 gap-y-10 sm:grid-cols-2">
          <EditorialStory icon={IconUsers} title={t("pages.whatIsForTitle")}>
            {t("pages.whatIsFor")}
          </EditorialStory>
          <EditorialStory icon={IconDoor} title={t("pages.whatIsRoomTitle")}>
            {t("pages.whatIsRoom")}
          </EditorialStory>
          <EditorialStory icon={IconHome} title={t("pages.whatIsDesignedTitle")}>
            {t("pages.whatIsDesigned")}
          </EditorialStory>
          <EditorialStory icon={IconEyeOff} title={t("pages.whatIsLeaveTitle")}>
            {t("pages.whatIsLeave")}
          </EditorialStory>
        </div>
      </div>
    </ContentPage>
  );
}
