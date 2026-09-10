"use client";

import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { SceneBackdrop } from "@/components/SceneBackdrop";
import { Icon } from "@/components/Icon";
import type { JournalPost } from "@/lib/types";

interface JournalCardProps {
  post: JournalPost;
}

export function JournalCard({ post }: JournalCardProps) {
  return (
    <GlassCard className="group flex h-full flex-col overflow-hidden rounded-3xl shadow-glass transition-shadow duration-300 hover:shadow-glass-lg">
      <Link href={`/journal/${post.slug}`} className="flex flex-1 flex-col">
        <SceneBackdrop
          scene={post.cover}
          className="aspect-[16/10] transition-transform duration-700 ease-out group-hover:scale-105"
          showLabel={false}
        />
        <div className="glass glass-sweep flex flex-1 flex-col gap-2.5 rounded-b-3xl p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-faint">
            <span className="rounded-full bg-gold/15 px-2.5 py-1 font-semibold text-gold">
              {post.category}
            </span>
            <span>{post.readTime}</span>
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-emerald-deep">
            {post.title}
          </h3>
          <p className="line-clamp-3 text-sm leading-relaxed text-ink-soft">
            {post.excerpt}
          </p>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-xs text-ink-faint">
              {post.author} · {post.date}
            </span>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald">
              Read
              <Icon name="arrowRight" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </GlassCard>
  );
}
