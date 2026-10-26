export function PageTitle({
  eyebrow,
  linha1,
  linha2,
  children,
}: {
  eyebrow?: string;
  linha1: string;
  linha2: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-6 px-4 pt-12 pb-7 sm:px-8">
      <div className="flex flex-col gap-3">
        {eyebrow && (
          <span className="font-mono text-[13px] font-bold tracking-[0.12em] text-accent">{eyebrow}</span>
        )}
        <h1 className="font-display text-[clamp(56px,8vw,120px)] leading-[0.88] uppercase">
          {linha1}
          <br />
          <span className="text-accent">{linha2}</span>
        </h1>
      </div>
      {children && <div className="flex max-w-md flex-col gap-2 text-base text-muted">{children}</div>}
    </section>
  );
}
