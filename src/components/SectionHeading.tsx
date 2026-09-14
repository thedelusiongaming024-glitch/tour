import { Reveal } from "@/components/Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  const alignment =
    align === "center" ? "items-center text-center" : "items-start text-left";

  return (
    <Reveal className={`flex flex-col ${alignment}`}>
      {eyebrow && (
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-gold">
          <span className="h-1.5 w-1.5 rounded-full bg-gold pulse-dot" />
          {eyebrow}
        </span>
      )}
      <h2 className="font-display text-3xl font-semibold leading-tight tracking-tight text-ink sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
          {description}
        </p>
      )}
    </Reveal>
  );
}
