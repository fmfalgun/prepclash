import { useEffect } from 'react'
import { useStore } from './store/useStore'
import { PALETTES } from './data/palettes'
import { TopBar } from './components/TopBar'
import { Toast } from './components/Toast'
import { Home } from './screens/Home'
import { Village } from './screens/Village'
import { Arena } from './screens/Arena'
import { Clan } from './screens/Clan'
import { Ladder } from './screens/Ladder'
import { StudyModal } from './components/modals/StudyModal'
import { WorkoutModal } from './components/modals/WorkoutModal'
import { ReadingModal } from './components/modals/ReadingModal'
import { NodeModal } from './components/modals/NodeModal'
import { QuestionModal } from './components/modals/QuestionModal'
import { ConnectModal } from './components/modals/ConnectModal'

export default function App() {
  const tab     = useStore(s => s.tab)
  const modal   = useStore(s => s.modal)
  const palette = useStore(s => s.data.palette)
  const P       = PALETTES[palette] || PALETTES.toxic

  // Inject CSS custom props on root for the active palette
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--a',     P.a)
    root.style.setProperty('--a2',    P.a2)
    root.style.setProperty('--rgb',   P.rgb)
    root.style.setProperty('--a2rgb', P.a2rgb)
  }, [P.a, P.a2, P.rgb, P.a2rgb])

  return (
    <div className={'rtt pal-' + palette} style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <TopBar />

      <main>
        {tab === 'home'    && <Home />}
        {tab === 'village' && <Village />}
        {tab === 'arena'   && <Arena />}
        {tab === 'clan'    && <Clan />}
        {tab === 'ladder'  && <Ladder />}
      </main>

      {modal === 'study'    && <StudyModal />}
      {modal === 'workout'  && <WorkoutModal />}
      {modal === 'reading'  && <ReadingModal />}
      {modal === 'node'     && <NodeModal />}
      {modal === 'question' && <QuestionModal />}
      {modal === 'connect'  && <ConnectModal />}

      <Toast />
    </div>
  )
}
