import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { journalPosts, getJournalPost } from "@/data/journal";
import { fetchJournalPost, fetchJournalPosts } from "@/lib/api";
import { JournalPostClient } from "@/components/JournalPostClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = (await fetchJournalPost(slug)) ?? getJournalPost(slug);
  if (!post) return { title: "Story not found" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function JournalPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = (await fetchJournalPost(slug)) ?? getJournalPost(slug);
  if (!post) notFound();

  const liveList = await fetchJournalPosts();
  const allPosts = liveList && liveList.length > 0 ? liveList : journalPosts;
  const related = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return <JournalPostClient post={post} related={related} />;
}
