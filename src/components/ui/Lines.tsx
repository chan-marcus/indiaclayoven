/** Owner-edited text: each line they typed shows as its own line on the page. */
export function Lines({ text }: { text: string }) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length <= 1) return <>{lines[0] ?? ""}</>;
  return (
    <>
      {lines.map((l, i) => (
        <span key={i} className="block">
          {l}
        </span>
      ))}
    </>
  );
}
