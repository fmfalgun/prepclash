export const A2OJ_DEFS = [
  { id: 'r1300', name: 'Rating ≤ 1300', total: 100 },
  { id: 'r1400', name: 'Rating ≤ 1400', total: 100 },
  { id: 'div2b',  name: 'Div 2 · B',    total: 76  },
] as const

export type A2ojId = typeof A2OJ_DEFS[number]['id']
