// Which columns of a case study's table hold figures: every cell starts with a
// number, signed or approximate, or is a dash for none. Shared by the app and
// the prerender, which set those columns right-aligned.
const FIGURE = /^(?:[−+\-≈~<>]\s?)?\d|^[—–-]$/;

export function figureColumns(head: string[], rows: string[][]): boolean[] {
  return head.map((_, column) => rows.every((row) => FIGURE.test(row[column].replace(/^\*\*/, ''))));
}
