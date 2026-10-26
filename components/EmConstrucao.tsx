/** Bloco usado nas seções que ainda serão implementadas nas próximas fases. */
export function EmConstrucao({ fase, children }: { fase: number; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 border-2 border-dashed border-line-strong p-6">
      <span className="font-mono text-xs font-bold tracking-wider text-accent">EM CONSTRUÇÃO · FASE {fase}</span>
      <p className="max-w-2xl text-muted">{children}</p>
    </div>
  );
}
