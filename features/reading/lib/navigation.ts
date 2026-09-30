export interface AdjacentChapter {
  prev: number | null;
  next: number | null;
}

export function getAdjacentChapter(
  chapter: number,
  chapterCount: number,
): AdjacentChapter {
  if (!Number.isInteger(chapter) || chapter < 1) {
    return { prev: null, next: null };
  }
  if (!Number.isInteger(chapterCount) || chapterCount < 1) {
    return { prev: null, next: null };
  }

  const prev = chapter > 1 ? chapter - 1 : null;
  const next = chapter < chapterCount ? chapter + 1 : null;
  return { prev, next };
}
