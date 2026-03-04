function normalize(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(text: string) {
  return new Set(normalize(text).split(" ").filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function similarityScore(
  source: { title: string; description?: string | null },
  target: { title: string; description?: string | null },
) {
  const titleScore = jaccard(tokens(source.title), tokens(target.title));
  const descScore = jaccard(tokens(source.description ?? ""), tokens(target.description ?? ""));
  return Math.round((titleScore * 0.7 + descScore * 0.3) * 100) / 100;
}
