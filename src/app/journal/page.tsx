import type { Metadata } from "next";
import Link from "next/link";
import { Atmosphere } from "@/components/Atmosphere";
import { Stagger, StaggerItem } from "@/components/Stagger";
import { SectionHeading } from "@/components/SectionHeading";
import { JournalCard } from "@/components/JournalCard";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { Icon } from "@/components/Icon";
import { journalPosts as staticJournalPosts } from "@/data/journal";
import { fetchJournalPosts } from "@/lib/api";
import type { JournalPost } from "@/lib/types";

function JournalFeatured({ post }: { post: JournalPost }) {
  return (
    <Link href={`/journal/${post.slug}`} className="group block h-full">
      <SceneBackdrop
        scene={post.cover}
        className="h-full min-h-[280px] w-full transition-transform duration-700 ease-out group-hover:scale-105"
        showLabel={false}
      />
      <span className="absolute bottom-4 left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/85 text-emerald-deep backdrop-blur transition-transform duration-300 group-hover:translate-x-1">
        <Icon name="arrowRight" className="h-5 w-5" />
      </span>
    </Link>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Travel Journal",
  description:
    "Field guides, food trails, and honest travel writing from across Bangladesh.",
};

export default async function JournalPage() {
  const live = await fetchJournalPosts();
  const journalPosts = live && live.length > 0 ? live : staticJournalPosts;
  const hasPosts = journalPosts.length > 0;
  const [featured, ...rest] = journalPosts;

  return (
    <>
      <section className="relative overflow-hidden px-4 pb-12 pt-32 sm:px-6 sm:pt-40">
        <Atmosphere intensity={0.25} />
        <div className="relative z-10 mx-auto max-w-6xl">
          <SectionHeading
            eyebrow="Travel Journal"
            title="Stories from the road"
            description="Field guides, food trails, and honest travel writing from our hosts and guests across Bangladesh."
          />
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6">
        <div className="mx-auto max-w-6xl">
          {!hasPosts ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-xs">
              <h3 className="font-display text-lg font-semibold text-ink">No articles published yet</h3>
              <p className="mt-2 text-sm text-ink-soft max-w-md mx-auto">
                Stories, packing guides, and field notes will appear here once written and published from the Super Admin Panel.
              </p>
            </div>
          ) : (
            <>
              {/* Featured post */}
              <Stagger className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
                <StaggerItem>
                  <div className="relative h-full min-h-[280px] overflow-hidden rounded-3xl">
                    <JournalFeatured post={featured} />
                  </div>
                </StaggerItem>
                <StaggerItem className="flex flex-col justify-center gap-4 lg:p-6">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    Latest story
                  </span>
                  <h1 className="font-display text-2xl font-semibold leading-snug text-ink sm:text-3xl">
                    {featured.title}
                  </h1>
                  <p className="text-base leading-relaxed text-ink-soft">
                    {featured.excerpt}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald to-emerald-deep text-xs font-bold text-white">
                      {featured.author.charAt(0)}
                    </span>
                    <div className="text-xs text-ink-faint">
                      <div className="font-semibold text-ink">{featured.author}</div>
                      <div>
                        {featured.date} · {featured.readTime}
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              </Stagger>

              {/* Rest of posts */}
              {rest.length > 0 && (
                <Stagger className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" stagger={0.1}>
                  {rest.map((post) => (
                    <StaggerItem key={post.slug} className="h-full">
                      <JournalCard post={post} />
                    </StaggerItem>
                  ))}
                </Stagger>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}
