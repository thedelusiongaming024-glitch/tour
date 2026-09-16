import type { Metadata } from "next";
import { notFound } from "next/navigation";
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
  const post = await fetchJournalPost(slug);
  if (!post) return { title: "Story not found" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function JournalPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await fetchJournalPost(slug);
  if (!post) notFound();

  const allPosts = (await fetchJournalPosts()) || [];
  const related = allPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return <JournalPostClient post={post} related={related} />;
}
