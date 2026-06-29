export const RANK_TIERS: [number, string][] = [[35,'E'],[48,'D'],[60,'C'],[70,'B'],[80,'B+'],[90,'A'],[200,'S']]
export const GRADE_TIERS: [number, string][] = [[20,'G'],[35,'F'],[48,'E'],[60,'D'],[70,'C'],[80,'B'],[90,'A'],[200,'S']]

export function rankFor(v: number): string {
  for (const [lim, lab] of RANK_TIERS) if (v < lim) return lab
  return 'S'
}

export function gradeFor(v: number): string {
  for (const [lim, lab] of GRADE_TIERS) if (v < lim) return lab
  return 'S'
}

export function gradeColor(g: string): string {
  const m: Record<string, string> = {
    S: '#9bff39', A: '#39ff88', B: '#39ff88', C: '#7fae8e',
    D: '#caa24a', E: '#c98a3e', F: '#c0746f', G: '#a85f5f',
  }
  return m[g] || 'var(--mut)'
}
