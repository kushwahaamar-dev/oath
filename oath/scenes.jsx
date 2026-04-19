// scenes.jsx — cinematic retelling faithful to oa-th.wiki actual site (dark mode)
// Design tokens lifted directly from web/src/app/globals.css (dark mode)

// --- Design tokens (dark mode, from globals.css) ---
const BG        = 'hsl(240 10% 5%)';          // --background
const FG        = 'hsl(0 0% 98%)';             // --foreground
const CARD      = 'hsl(240 10% 8%)';           // --card
const PRIMARY   = 'hsl(250 90% 68%)';          // --primary (violet)
const MUTED_FG  = 'hsl(240 5% 60%)';           // --muted-foreground
const BORDER    = 'hsl(240 6% 18%)';           // --border
const BORDER_60 = 'hsl(240 6% 18% / 0.6)';
const OATH_OK   = 'hsl(150 65% 50%)';          // green status dot
const OATH_SLASH= 'hsl(0 85% 62%)';            // slash red
const OATH_WARN = 'hsl(38 92% 60%)';
const DISPLAY   = '"Bodoni Moda", "Times New Roman", serif';
const UI        = '"Manrope", "Inter", system-ui, sans-serif';
const MONO      = '"JetBrains Mono", ui-monospace, monospace';

// ── Top site header — matches site-header.tsx ───────────────────────────────
function SiteHeader() {
  const time = useTime();
  const { duration } = useTimeline();
  const op = clamp(time / 1.0, 0, 1) * (1 - clamp((time - (duration - 0.8)) / 0.8, 0, 1));
  return (
    <div style={{
      position: 'absolute', top: 60, left: '50%', transform: 'translateX(-50%)',
      width: 1152, height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', borderBottom: `1px solid ${BORDER_60}`,
      opacity: op, zIndex: 49, pointerEvents: 'none',
      background: 'rgba(13,13,16,0.7)', backdropFilter: 'blur(12px)',
      whiteSpace: 'nowrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, letterSpacing: '0.24em', textTransform: 'uppercase' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: OATH_OK, boxShadow: `0 0 10px ${OATH_OK}` }} />
          <span style={{ fontFamily: UI, fontWeight: 600, color: FG }}>oath</span>
          <span style={{ fontFamily: MONO, color: MUTED_FG }}>/ devnet</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {[['home', true], ['demo', false], ['dashboard', false]].map(([lbl, active]) => (
            <div key={lbl} style={{
              fontFamily: UI, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase',
              padding: '6px 12px', borderRadius: 9999,
              background: active ? 'hsl(240 10% 8% / 0.8)' : 'transparent',
              color: active ? FG : MUTED_FG,
            }}>{lbl}</div>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: MUTED_FG, textTransform: 'uppercase' }}>
          2Uvq…kPmy
        </div>
        <div style={{
          background: PRIMARY, color: '#fff',
          borderRadius: 9999, height: 36, padding: '0 16px',
          display: 'flex', alignItems: 'center',
          fontFamily: UI, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase',
          boxShadow: `0 0 30px ${PRIMARY.replace(')', ' / 0.3)')}`,
          whiteSpace: 'nowrap',
        }}>
          Select wallet
        </div>
      </div>
    </div>
  );
}

function Vignette() {
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 48, pointerEvents: 'none',
      background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
    }} />
  );
}

// ── Scene shell (right side of hero + final chamber) — monolith mockup ──────
function SceneShellCard({ title, badge, description }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 32,
      background: `linear-gradient(180deg, hsl(240 10% 8% / 0.76), hsl(240 10% 6% / 0.52))`,
      border: `1px solid ${BORDER_60}`,
      backdropFilter: 'blur(28px)',
      boxShadow: `inset 0 1px 0 hsl(0 0% 98% / 0.06), 0 24px 90px -52px hsl(0 0% 98% / 0.85)`,
      width: '100%', height: '100%',
    }}>
      {/* halo noise */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.6, mixBlendMode: 'screen',
        background: `
          radial-gradient(circle at 50% 18%, hsl(0 0% 98% / 0.12), transparent 20%),
          radial-gradient(circle at 50% 50%, hsl(0 0% 98% / 0.06), transparent 38%),
          radial-gradient(circle at 50% 82%, hsl(0 0% 98% / 0.08), transparent 24%)
        `,
      }} />
      {/* header */}
      <div style={{
        position: 'relative', zIndex: 2, padding: 24,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', gap: 16,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: UI, fontSize: 11, letterSpacing: '0.34em', color: MUTED_FG, textTransform: 'uppercase' }}>
            Live oath state
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 30, color: FG, letterSpacing: '-0.05em', lineHeight: 1.1, marginTop: 8, fontWeight: 500 }}>
            {title}
          </div>
          <div style={{ fontFamily: UI, fontSize: 12.5, color: MUTED_FG, lineHeight: 1.5, marginTop: 8, maxWidth: '40ch' }}>
            {description}
          </div>
        </div>
        <div style={{
          flexShrink: 0, borderRadius: 9999, border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.4)', padding: '4px 12px',
          fontFamily: MONO, fontSize: 11, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase',
          height: 'fit-content', alignSelf: 'flex-start',
        }}>
          {badge}
        </div>
      </div>
      {/* viz: rings + slab */}
      <div style={{ position: 'relative', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'relative', width: 160, height: 160, borderRadius: 80,
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(255,255,255,0.02)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ position: 'absolute', width: 128, height: 128, borderRadius: 64, border: '1px solid rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', width: 96, height: 96, borderRadius: 48, border: '1px solid rgba(255,255,255,0.05)' }} />
          <div style={{
            height: 96, width: 32, borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.15)',
            background: 'rgba(255,255,255,0.1)',
            boxShadow: '0 0 40px rgba(255,255,255,0.08)',
          }} />
        </div>
      </div>
      {/* footer 3-col */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: MUTED_FG, textTransform: 'uppercase',
      }}>
        {[['Ring', 'scope boundary'], ['Slab', 'signed oath'], ['Fracture', 'slash event']].map(([a, b], i) => (
          <div key={i} style={{ padding: '12px 20px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ color: 'rgba(255,255,255,0.8)' }}>{a}</div>
            <div>{b}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Scene 01: Hero — exact site layout ──────────────────────────────────────
function SceneHero() {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.5)) / 0.5, 0, 1);
  const eyebrow = Easing.easeOutCubic(clamp(t / 0.4, 0, 1)) * out;
  const line1 = Easing.easeOutCubic(clamp((t - 0.4) / 0.8, 0, 1)) * out;
  const sub = Easing.easeOutCubic(clamp((t - 1.2) / 0.7, 0, 1)) * out;
  const buttons = Easing.easeOutCubic(clamp((t - 1.9) / 0.6, 0, 1)) * out;
  const card = Easing.easeOutCubic(clamp((t - 0.8) / 1.0, 0, 1)) * out;

  // container: max-w-6xl (1152px), grid lg:grid-cols-[1fr_30rem]
  return (
    <>
      <div style={{
        position: 'absolute', left: '50%', top: 220, transform: 'translateX(-50%)',
        width: 1152, display: 'grid', gridTemplateColumns: '1fr 480px', gap: 40, alignItems: 'center',
      }}>
        <div>
          <div style={{ fontFamily: UI, fontSize: 11, letterSpacing: '0.32em', color: MUTED_FG, textTransform: 'uppercase', opacity: eyebrow }}>
            Protocol chamber
          </div>
          <div style={{
            display: 'flex', gap: 12, alignItems: 'center', marginTop: 16, flexWrap: 'wrap',
            fontSize: 11, letterSpacing: '0.28em', color: MUTED_FG, textTransform: 'uppercase', opacity: eyebrow,
          }}>
            <span style={{ fontFamily: UI }}>Solana · Devnet</span>
            <span style={{ width: 4, height: 4, borderRadius: 2, background: BORDER }} />
            <span style={{ fontFamily: MONO, wordBreak: 'break-all' }}>Program / 2Uvqbnt6kiaB7Y3AHhtS2FLWRFrJweRebtErSQE2kPmy</span>
          </div>
          <div style={{
            fontFamily: DISPLAY, fontSize: 112, color: FG, letterSpacing: '-0.05em', lineHeight: 0.98,
            marginTop: 32, fontWeight: 600,
            opacity: line1, transform: `translateY(${(1 - line1) * 16}px)`,
          }}>
            Bind intent before action.
          </div>
          <div style={{
            fontFamily: UI, fontSize: 18, color: MUTED_FG, lineHeight: 1.5,
            marginTop: 24, maxWidth: 620,
            opacity: sub, transform: `translateY(${(1 - sub) * 10}px)`,
          }}>
            Halo records scope, consent, and enforcement before an agent can touch the outside world. Every consequential action begins inside the protocol.
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 40, opacity: buttons }}>
            <div style={{
              background: PRIMARY, color: '#fff',
              borderRadius: 9999, padding: '12px 28px',
              fontFamily: UI, fontSize: 14, fontWeight: 500,
              boxShadow: `0 0 40px ${PRIMARY.replace(')', ' / 0.3)')}`,
              whiteSpace: 'nowrap',
            }}>
              Launch demo
            </div>
            <div style={{
              border: `1px solid ${BORDER}`, background: 'hsl(240 10% 8% / 0.4)',
              color: FG, borderRadius: 9999, padding: '12px 28px',
              fontFamily: UI, fontSize: 14, fontWeight: 500,
              whiteSpace: 'nowrap',
            }}>
              Open dashboard
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', width: 480, height: 560, opacity: card, transform: `scale(${0.96 + 0.04 * card})`, transformOrigin: 'center' }}>
          <SceneShellCard
            title="Loading scene"
            badge="loading"
            description="WebGL fallback loaded."
          />
        </div>
      </div>
    </>
  );
}

// ── Scene 02: Section header ────────────────────────────────────────────────
function SceneSectionHed() {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.4)) / 0.4, 0, 1);
  const eb = Easing.easeOutCubic(clamp(t / 0.4, 0, 1)) * out;
  const h = Easing.easeOutCubic(clamp((t - 0.3) / 0.9, 0, 1)) * out;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: 360, transform: 'translateX(-50%)',
      width: 1152, padding: '0 24px',
    }}>
      <div style={{ fontFamily: UI, fontSize: 11, letterSpacing: '0.32em', color: MUTED_FG, textTransform: 'uppercase', opacity: eb }}>
        Proof sequence
      </div>
      <div style={{
        fontFamily: DISPLAY, fontSize: 72, color: FG, letterSpacing: '-0.05em', lineHeight: 1.02,
        marginTop: 20, maxWidth: 720, fontWeight: 600,
        opacity: h, transform: `translateY(${(1 - h) * 16}px)`,
      }}>
        A restrained path from intent to consequence.
      </div>
    </div>
  );
}

// ── Scene 03: Proof sequence card (all 4 steps) ─────────────────────────────
function SceneProofSequence() {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.4)) / 0.4, 0, 1);
  const eb = Easing.easeOutCubic(clamp(t / 0.3, 0, 1)) * out;
  const hed = Easing.easeOutCubic(clamp((t - 0.2) / 0.6, 0, 1)) * out;

  const steps = [
    ['01', 'Propose', 'The agent proposes scope before it acts.'],
    ['02', 'Sign', 'The user signs a narrow mandate with explicit bounds, spend limits, and expiry.'],
    ['03', 'Gate', 'Halo records the mandate before execution, so action only proceeds through the protocol path.'],
    ['04', 'Slash', 'A verified breach slashes stake back to the user without arbitration.'],
  ];

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%', top: 180, transform: 'translateX(-50%)',
        width: 1152, padding: '0 24px',
      }}>
        <div style={{ fontFamily: UI, fontSize: 11, letterSpacing: '0.32em', color: MUTED_FG, textTransform: 'uppercase', opacity: eb }}>
          Proof sequence
        </div>
        <div style={{
          fontFamily: DISPLAY, fontSize: 48, color: FG, letterSpacing: '-0.05em', lineHeight: 1.05,
          marginTop: 16, maxWidth: 720, fontWeight: 600,
          opacity: hed,
        }}>
          A restrained path from intent to consequence.
        </div>

        <div style={{
          marginTop: 48, borderRadius: 32, border: `1px solid ${BORDER_60}`,
          background: 'hsl(240 10% 8% / 0.2)', overflow: 'hidden',
        }}>
          {steps.map(([id, label, body], i) => {
            const start = 0.8 + i * 0.5;
            const rT = Easing.easeOutCubic(clamp((t - start) / 0.6, 0, 1)) * out;
            return (
              <div key={id} style={{
                display: 'grid', gridTemplateColumns: '128px 1fr', gap: 16,
                padding: '32px 32px',
                borderTop: i > 0 ? `1px solid ${BORDER_60}` : 'none',
                opacity: rT, transform: `translateY(${(1 - rT) * 10}px)`,
              }}>
                <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.32em', color: MUTED_FG, textTransform: 'uppercase' }}>
                  {id} / {label}
                </div>
                <div style={{ fontFamily: UI, fontSize: 20, lineHeight: 1.5, color: 'hsl(0 0% 98% / 0.9)' }}>
                  {body}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Scene 04: Comparison — Policy text is not enforcement ───────────────────
function SceneComparison() {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.4)) / 0.4, 0, 1);
  const eb = Easing.easeOutCubic(clamp(t / 0.3, 0, 1)) * out;
  const hed = Easing.easeOutCubic(clamp((t - 0.2) / 0.6, 0, 1)) * out;
  const sub = Easing.easeOutCubic(clamp((t - 0.7) / 0.6, 0, 1)) * out;

  const cols = [
    { title: 'Without Oath', points: [
      'Policy lives in docs, but execution can drift the moment pressure arrives.',
      'Operators ask for trust because the system itself has no binding record of intent.',
      'When something breaks, enforcement starts after the damage instead of at the gate.',
    ]},
    { title: 'With Oath', points: [
      'Intent is proposed, signed, and recorded before any external capability opens.',
      'The protocol keeps a shared record of scope, consent, and consequence as the action unfolds.',
      'A verified breach resolves inside the same path that authorized the work in the first place.',
    ]},
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: 180, transform: 'translateX(-50%)',
      width: 1152, padding: '0 24px',
    }}>
      <div style={{ fontFamily: UI, fontSize: 11, letterSpacing: '0.32em', color: MUTED_FG, textTransform: 'uppercase', opacity: eb }}>
        Editorial comparison
      </div>
      <div style={{
        fontFamily: DISPLAY, fontSize: 60, color: FG, letterSpacing: '-0.05em', lineHeight: 1.02,
        marginTop: 16, maxWidth: 720, fontWeight: 600, opacity: hed,
      }}>
        Policy text is not enforcement.
      </div>
      <div style={{
        fontFamily: UI, fontSize: 18, color: MUTED_FG, lineHeight: 1.5,
        marginTop: 20, maxWidth: 560, opacity: sub,
      }}>
        The difference is not tone or documentation. It is whether the system can bind a promise to the moment action becomes possible.
      </div>
      <div style={{
        marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1,
        background: BORDER_60, borderRadius: 32, overflow: 'hidden', border: `1px solid ${BORDER_60}`,
      }}>
        {cols.map((col, ci) => {
          const colT = Easing.easeOutCubic(clamp((t - 1.0 - ci * 0.2) / 0.6, 0, 1)) * out;
          return (
            <div key={col.title} style={{
              background: 'hsl(240 10% 5% / 0.95)', padding: 40,
              opacity: colT,
            }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.32em', color: ci === 1 ? PRIMARY : MUTED_FG, textTransform: 'uppercase' }}>
                {col.title}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {col.points.map((p, i) => {
                  const pT = Easing.easeOutCubic(clamp((t - 1.4 - ci * 0.2 - i * 0.15) / 0.5, 0, 1)) * out;
                  return (
                    <li key={p} style={{
                      fontFamily: UI, fontSize: 16, lineHeight: 1.55, color: 'hsl(0 0% 98% / 0.9)',
                      opacity: pT,
                    }}>{p}</li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Scene 05: Metric rail — Build snapshot ──────────────────────────────────
function SceneMetricRail() {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.4)) / 0.4, 0, 1);
  const eb = Easing.easeOutCubic(clamp(t / 0.3, 0, 1)) * out;
  const hed = Easing.easeOutCubic(clamp((t - 0.2) / 0.6, 0, 1)) * out;
  const sub = Easing.easeOutCubic(clamp((t - 0.7) / 0.6, 0, 1)) * out;

  const metrics = [
    { label: 'Instructions', value: '6',    detail: 'create, record, slash, revoke, close, fulfill' },
    { label: 'Tests',        value: '14',   detail: 'happy path and adversarial coverage' },
    { label: 'Demo scenes',  value: '3',    detail: 'happy path, attack, revoke' },
    { label: 'Runtime',      value: '<15s', detail: 'proposal to confirmation' },
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: 200, transform: 'translateX(-50%)',
      width: 1152, padding: '0 24px',
    }}>
      <div style={{ fontFamily: UI, fontSize: 11, letterSpacing: '0.32em', color: MUTED_FG, textTransform: 'uppercase', opacity: eb }}>
        Proof dossier
      </div>
      <div style={{
        fontFamily: DISPLAY, fontSize: 48, color: FG, letterSpacing: '-0.05em', lineHeight: 1.05,
        marginTop: 16, fontWeight: 600, opacity: hed,
      }}>
        Build snapshot
      </div>
      <div style={{
        fontFamily: UI, fontSize: 18, color: MUTED_FG, lineHeight: 1.5,
        marginTop: 20, maxWidth: 560, opacity: sub,
      }}>
        A fixed dossier from the current monolith build. These figures frame the proof surface on this page rather than acting as a permanently live counter.
      </div>
      <div style={{
        marginTop: 48, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
        background: BORDER_60, borderRadius: 32, overflow: 'hidden', border: `1px solid ${BORDER_60}`,
      }}>
        {metrics.map((m, i) => {
          const mT = Easing.easeOutCubic(clamp((t - 1.0 - i * 0.2) / 0.6, 0, 1)) * out;
          return (
            <div key={m.label} style={{
              background: 'hsl(240 10% 8% / 0.2)', padding: '32px 28px',
              opacity: mT, transform: `translateY(${(1 - mT) * 8}px)`,
            }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.32em', color: MUTED_FG, textTransform: 'uppercase' }}>
                {m.label}
              </div>
              <div style={{ fontFamily: DISPLAY, fontSize: 56, color: FG, letterSpacing: '-0.05em', marginTop: 16, fontWeight: 600 }}>
                {m.value}
              </div>
              <div style={{ fontFamily: UI, fontSize: 14, color: MUTED_FG, lineHeight: 1.5, marginTop: 12 }}>
                {m.detail}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Scene 06: Final chamber ─────────────────────────────────────────────────
function SceneFinalChamber() {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.5)) / 0.5, 0, 1);
  const eb = Easing.easeOutCubic(clamp(t / 0.3, 0, 1)) * out;
  const hed = Easing.easeOutCubic(clamp((t - 0.2) / 0.8, 0, 1)) * out;
  const sub = Easing.easeOutCubic(clamp((t - 0.9) / 0.6, 0, 1)) * out;
  const btn = Easing.easeOutCubic(clamp((t - 1.4) / 0.6, 0, 1)) * out;
  const reprise = Easing.easeOutCubic(clamp((t - 0.7) / 0.9, 0, 1)) * out;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: 220, transform: 'translateX(-50%)',
      width: 1152, padding: '0 24px',
    }}>
      <div style={{
        position: 'relative', borderRadius: 32, border: `1px solid ${BORDER_60}`,
        background: 'hsl(240 10% 8% / 0.2)', overflow: 'hidden', padding: 56,
        display: 'grid', gridTemplateColumns: '1fr 384px', gap: 40, alignItems: 'center',
      }}>
        {/* glow at top */}
        <div style={{
          position: 'absolute', top: 0, left: 80, right: 80, height: 160, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at top, hsl(0 0% 98% / 0.12), transparent 70%)',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: UI, fontSize: 11, letterSpacing: '0.32em', color: MUTED_FG, textTransform: 'uppercase', opacity: eb }}>
            Final chamber
          </div>
          <div style={{
            fontFamily: DISPLAY, fontSize: 56, color: FG, letterSpacing: '-0.05em', lineHeight: 1.02,
            marginTop: 16, fontWeight: 600, opacity: hed,
          }}>
            See the protocol hold under pressure.
          </div>
          <div style={{
            fontFamily: UI, fontSize: 18, color: MUTED_FG, lineHeight: 1.5,
            marginTop: 24, maxWidth: 560, opacity: sub,
          }}>
            Run the clean path, the attack path, and the revoke path through the same chamber. The point is not a promise of safety. It is a visible protocol with consequences.
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 40, opacity: btn }}>
            <div style={{
              background: PRIMARY, color: '#fff',
              borderRadius: 9999, padding: '12px 28px',
              fontFamily: UI, fontSize: 14, fontWeight: 500,
              boxShadow: `0 0 40px ${PRIMARY.replace(')', ' / 0.3)')}`,
              whiteSpace: 'nowrap',
            }}>
              Enter demo chamber
            </div>
            <div style={{
              border: `1px solid ${BORDER}`, background: BG,
              color: FG, borderRadius: 9999, padding: '12px 28px',
              fontFamily: UI, fontSize: 14, fontWeight: 500,
              whiteSpace: 'nowrap',
            }}>
              Review dashboard
            </div>
          </div>
        </div>

        {/* reprise monolith */}
        <div style={{
          position: 'relative', width: 320, aspectRatio: '4/5',
          borderRadius: 32, border: `1px solid ${BORDER_60}`,
          background: 'hsl(240 10% 5% / 0.7)', overflow: 'hidden',
          opacity: reprise, transform: `scale(${0.96 + 0.04 * reprise})`,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 28%, hsl(0 0% 98% / 0.16), transparent 34%)' }} />
          <div style={{ position: 'absolute', left: '50%', top: '18%', width: 160, height: 160, borderRadius: 80, transform: 'translateX(-50%)', border: `1px solid ${BORDER_60}`, opacity: 0.7 }} />
          <div style={{ position: 'absolute', left: '50%', top: '22%', width: 208, height: 208, borderRadius: 104, transform: 'translateX(-50%)', border: '1px solid hsl(240 6% 18% / 0.25)', opacity: 0.6 }} />
          <div style={{
            position: 'absolute', left: '50%', top: '50%', width: 96, height: 176,
            transform: 'translate(-50%, -50%)', borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'linear-gradient(180deg, hsl(0 0% 98% / 0.2), hsl(0 0% 98% / 0.06) 38%, transparent 100%)',
            boxShadow: '0 18px 80px hsl(0 0% 98% / 0.12)',
          }} />
          <div style={{ position: 'absolute', inset: '0 0 0 0', bottom: 0, top: 'auto', height: 96, background: `linear-gradient(180deg, transparent, ${BG})` }} />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  SiteHeader, Vignette,
  SceneHero, SceneSectionHed, SceneProofSequence,
  SceneComparison, SceneMetricRail, SceneFinalChamber,
  BG, FG, CARD, PRIMARY, MUTED_FG, BORDER,
  DISPLAY, UI, MONO,
});
