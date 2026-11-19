'use client'

// Parts imported one by one so only their CSS ships with the page.
import { Stage } from './kit/stage'
import { Bar, Caret, Prompt, Window } from './kit/window'
import { Spinner } from './kit/parts/Spinner'
import { States } from './kit/motion/States'
import { Badge } from './kit/controls/Badge'
import { Icon } from './kit/parts/Icon'
import type { Act } from './kit/act'
import './build-day.css'

// Build day, the last hour: a student deploys from the terminal, and their
// product (a Bangla market-price tracker) comes up live in the browser.
// Beats: the command is typed, the build runs, Ready prints the live URL,
// the page resolves top to bottom and holds. The loop resets with `clear`.
//
// Real strings: the command, the build lines, the URL, the page title and
// four price rows. Everything else is filler.

type Build = 'idle' | 'building' | 'done'
type S = { cmd: string; build: Build; ready: boolean; clear: string }

const initial: S = { cmd: '', build: 'idle', ready: false, clear: '' }
const POSTER: S = { cmd: 'vercel --prod', build: 'done', ready: true, clear: '' }
const URL = 'bazardor.vercel.app'

const ROWS = [
  { name: 'চাল (মিনিকেট)', price: '৳৭২', unit: '/কেজি', change: '+৳২', tone: 'danger' as const },
  { name: 'ডিম', price: '৳১৪৫', unit: '/ডজন', change: '−৳৫', tone: 'success' as const },
  { name: 'পেঁয়াজ', price: '৳৯০', unit: '/কেজি', change: 'একই', tone: 'neutral' as const },
  { name: 'আলু', price: '৳৫৫', unit: '/কেজি', change: '−৳৩', tone: 'success' as const },
]
// Each skeleton bar is about its words' width
const NAME_W = [78, 30, 46, 30]

async function script(a: Act<S>) {
  await a.wait(700)
  await a.type('cmd', 'vercel --prod', { interval: 55 })
  await a.wait(300)
  a.put({ build: 'building' })
  await a.wait(1700)
  a.put({ build: 'done' })
  await a.wait(350)
  a.mark('live')
  a.put({ ready: true })
  await a.wait(3800)
  await a.type('clear', 'clear', { interval: 70 })
  await a.wait(300)
  a.put({ ...initial })
  await a.wait(500)
}

export default function BuildDayDemo() {
  return (
    <Stage<S>
      width={600}
      height={440}
      compact={{ below: 560, width: 358, height: 356 }}
      initial={initial}
      poster={POSTER}
      script={script}
      accent="#2f5bea"
      tokens={{ '--ss-font': 'var(--font-body), system-ui, sans-serif' }}
      className="bd"
    >
      {(s, _rect, layout) => (
        <>
          {/* On a phone there is no room for the terminal, so the address bar
              carries the load: a spinner while the page loads, then the lock */}
          <Window
            url={
              layout === 'compact' ? (
                <span className="bd-addr">
                  <States value={s.ready ? 'lock' : 'load'} className="bd-addr__icon" states={{ load: <Spinner size={10} />, lock: <Icon name="lock" size={10} filled /> }} />
                  {URL}
                </span>
              ) : (
                URL
              )
            }
            urlShape="pill"
            className="bd-browser"
          >
            <div className="bd-page">
              {layout === 'wide' && (
                <aside className="bd-side" aria-hidden>
                  {[64, 48, 56, 40].map((w, i) => (
                    <Bar key={i} w={w} h={7} r={3.5} tone={i === 0 ? 3 : 2} />
                  ))}
                </aside>
              )}
              <div className="bd-main">
                <div className="bd-head">
                  <div className="bd-title">আজকের বাজারদর</div>
                  <div className="bd-sub">কারওয়ান বাজার · ঢাকা</div>
                </div>
                {ROWS.map((r, i) => (
                  <div key={r.name} className="bd-row" data-ready={s.ready || undefined} style={{ ['--i' as string]: i }}>
                    <span className="bd-slot">
                      <Bar w={NAME_W[i]!} h={8} r={4} tone={2} className="bd-sk" />
                      <span className="bd-real bd-name">{r.name}</span>
                    </span>
                    <span className="bd-slot bd-num">
                      <Bar w={44} h={8} r={4} tone={2} className="bd-sk" />
                      <span className="bd-real">
                        {r.price}
                        <span className="bd-unit">{r.unit}</span>
                      </span>
                    </span>
                    <span className="bd-slot bd-end">
                      <Bar w={40} h={20} r={10} tone={2} className="bd-sk" />
                      <span className="bd-real">
                        <Badge tone={r.tone}>{r.change}</Badge>
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Window>

          {layout === 'wide' && (
          <Window chrome="terminal" lights="grey" title="bazardor — zsh" className="bd-term">
            <div className="ss-term bd-term__body" data-snap>
              <Prompt path="~/bazardor">
                {s.cmd}
                {s.build === 'idle' && <Caret />}
              </Prompt>
              <div className="bd-out bd-out--status" data-show={s.build !== 'idle' || undefined}>
                <States
                  value={s.build === 'done' ? 'done' : 'run'}
                  align="start"
                  className="bd-cell"
                  states={{ run: <Spinner size={11} />, done: <span className="ok">✓</span> }}
                />
                <States
                  value={s.build === 'done' ? 'done' : 'run'}
                  align="start"
                  states={{ run: <span className="dim">Building…</span>, done: <span>Build completed <span className="dim">in 41s</span></span> }}
                />
              </div>
              <div className="bd-out" data-show={s.ready || undefined}>
                <span className="bd-cell ok">✓</span>
                <span>Ready</span>
                <span className="bd-url">{URL}</span>
              </div>
              <Prompt path="~/bazardor" className="bd-out" data-show={s.ready || undefined}>
                {s.clear}
                <Caret />
              </Prompt>
            </div>
          </Window>
          )}
        </>
      )}
    </Stage>
  )
}
