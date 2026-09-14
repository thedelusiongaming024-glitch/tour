import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Atmosphere } from "@/components/Atmosphere";
import { Reveal } from "@/components/Reveal";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { JournalCard } from "@/components/JournalCard";
import { Icon } from "@/components/Icon";
import { journalPosts, getJournalPost } from "@/data/journal";
import { fetchJournalPost, fetchJournalPosts } from "@/lib/api";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return journalPosts.map((p) => ({ slug: p.slug }));
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

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pb-8 pt-32 sm:px-6 sm:pt-40">
        <Atmosphere intensity={0.25} />
        <div className="relative z-10 mx-auto max-w-3xl">
          <Reveal>
            <Link
              href="/journal"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-faint transition-colors hover:text-emerald"
            >
              <Icon name="arrow" className="h-4 w-4 -scale-x-100" />
              Journal
            </Link>
          </Reveal>

          <Reveal delay={0.06}>
            <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {post.category}
            </span>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl md:text-5xl">
              {post.title}
            </h1>
            <p className="mt-4 text-lg leading-relaxed text-ink-soft">
              {post.excerpt}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald to-emerald-deep text-sm font-bold text-white">
                {post.author.charAt(0)}
              </span>
              <div className="text-sm text-ink-faint">
                <div className="font-semibold text-ink">{post.author}</div>
                <div>
                  {post.date} · {post.readTime}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Cover */}
      <section className="px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <Reveal>
            <SceneBackdrop
              scene={post.cover}
              className="aspect-[16/9] w-full rounded-[2rem]"
              showLabel={false}
            />
          </Reveal>
        </div>
      </section>

      {/* Body */}
      <section className="px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {post.body.map((block, i) => (
            <Reveal key={block.heading ?? i} delay={i * 0.04} className="mb-8">
              {block.heading && (
                <h2 className="font-display text-xl font-semibold text-ink sm:text-2xl">
                  {block.heading}
                </h2>
              )}
              <div className={block.heading ? "mt-3 space-y-4" : "space-y-4"}>
                {block.paragraphs.map((paragraph, j) => (
                  <p
                    key={j}
                    className="text-base leading-relaxed text-ink-soft"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </Reveal>
          ))}

          <Reveal className="mt-10">
            <div className="glass glass-sweep flex flex-col items-center gap-4 rounded-3xl p-8 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">
                  Ready to see it for yourself?
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  We&apos;ll help you plan the trip, handle the logistics, and
                  host you the whole way.
                </p>
              </div>
              <Link href="/tours" className="btn btn-emerald shrink-0">
                Browse Tours
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="px-4 pb-24 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                More stories
              </h2>
            </Reveal>
            <Stagger
              className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3"
              stagger={0.1}
            >
              {related.map((p) => (
                <StaggerItem key={p.slug} className="h-full">
                  <JournalCard post={p} />
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </section>
      )}
    </>
  );
}
