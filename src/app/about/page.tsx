import type { Metadata } from "next";
import { fetchAboutPageCms } from "@/lib/api";
import { DEFAULT_ABOUT_CMS } from "@/server/db";
import { AboutClient } from "@/components/AboutClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The story, values, and local hosts behind Savar Tour Lover — আপনার স্বপ্ন উড়তে দিন। Curated domestic tours across Bangladesh.",
};

export default async function AboutPage() {
  const cms = await fetchAboutPageCms();
  const defaultValues = DEFAULT_ABOUT_CMS.values || [];
  const defaultTeam = DEFAULT_ABOUT_CMS.team || [];
  const defaultParagraphs = DEFAULT_ABOUT_CMS.story_paragraphs || [];

  return (
    <AboutClient
      cms={cms}
      defaultValues={defaultValues}
      defaultTeam={defaultTeam}
      defaultParagraphs={defaultParagraphs}
    />
  );
}
