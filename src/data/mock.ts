import { RANK_TIERS } from '../lib/grades'

export function todayKey(d?: Date) {
  const dt = d || new Date()
  return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0')
}

export function seedActivity(): Record<string, number> {
  const act: Record<string, number> = {}
  const today = new Date()
  for (let i = 181; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = todayKey(d)
    const wk   = Math.floor(i / 7)
    const seed = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1
    let v = seed * 60
    if (wk > 21) v *= 0.35
    else if (wk < 4) v *= 1.25
    if (d.getDay() === 0 && seed < 0.5) v *= 0.4
    act[key] = Math.round(v)
  }
  return act
}

function mk(offsetDays: number, name: string, exercises: { name: string; sr: string; weight: string }[]) {
  const d = new Date(Date.now() - offsetDays * 86400000)
  return { date: todayKey(d), name, exercises }
}

export function seedWorkouts() {
  return [
    mk(0, 'Conditioning', [{ name: 'Treadmill Sprints', sr: '10×45s', weight: 'Lv 10/5' }]),
    mk(1, 'Back Width + Forearms', [
      { name: 'Dead Hangs',       sr: '4×~30s',   weight: 'Bodyweight'   },
      { name: 'Lat Pulldowns',    sr: '4×12',     weight: '14→27 kg'     },
      { name: 'Single-Arm Rows',  sr: '4×12',     weight: '9→18 kg/h'    },
      { name: "Farmer's Carries", sr: '3×30',     weight: '10→12.5 kg/h' },
      { name: 'Wrist Curls',      sr: '3×20',     weight: '2.5→5 kg/h'   },
      { name: 'Reverse Curls',    sr: '3×20',     weight: '5 kg/h'       },
    ]),
    mk(2, 'Shoulders + Arms', [
      { name: 'DB Shoulder Press', sr: '3×12',   weight: '7.5 kg/h' },
      { name: 'Lateral Raises',    sr: '5×12',   weight: '3 kg/h'   },
      { name: 'Hammer Curls',      sr: '3×8',    weight: '7.5 kg/h' },
      { name: 'Skull Crushers',    sr: '3×8-12', weight: '7.5 kg'   },
    ]),
    mk(3, 'Legs', [
      { name: 'Squats',             sr: '4×12',   weight: '7.5 kg/h' },
      { name: 'Romanian Deadlifts', sr: '4×12',   weight: '7.5 kg/h' },
      { name: 'Walking Lunges',     sr: '3×5/leg',weight: '7.5 kg/h' },
      { name: 'Calf Raises',        sr: '4×14-26',weight: '7.5 kg/h' },
    ]),
    mk(4, 'Back Thickness + Traps', [
      { name: 'Dumbbell Rows',        sr: '4×8-12', weight: '10 kg/h'   },
      { name: 'Chest-Supported Rows', sr: '4×12',   weight: '5→10 kg/h' },
      { name: 'Shrugs',               sr: '4×12',   weight: '10 kg/h'   },
      { name: 'Face Pulls',           sr: '3×20',   weight: '18→27 kg'  },
    ]),
    mk(5, 'Chest + Shoulders', [
      { name: 'Incline Bench Press', sr: '4×10', weight: '7.5 kg/h' },
      { name: 'Flat Bench Press',    sr: '3×10', weight: '7.5 kg/h' },
      { name: 'DB Shoulder Press',   sr: '3×12', weight: '7.5 kg/h' },
      { name: 'Lateral Raises',      sr: '4×12', weight: '2.5 kg/h' },
    ]),
  ]
}

export function rankFor(v: number): string {
  for (const [lim, lab] of RANK_TIERS) if (v < lim) return lab
  return 'S'
}
