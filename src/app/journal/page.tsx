import type { Metadata } from "next";
import { fetchJournalPageCms, fetchJournalPosts } from "@/lib/api";
import { JournalClient } from "@/components/JournalClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Travel Journal",
  description:
    "Field guides, food trails, and honest travel writing from across Bangladesh.",
};

export default async function JournalPage() {
  const [live, cms] = await Promise.all([
    fetchJournalPosts(),
    fetchJournalPageCms(),
  ]);

  const journalPosts = live ?? [];

  return <JournalClient journalPosts={journalPosts} cms={cms} />;
}
