// demo-scenes.jsx — the actual product walkthrough (chat, proposal, sign, timeline, slash, dossier, dashboard)
// All copy & structure lifted from web/src/app/chat/page.tsx, oath-proposal-card.tsx,
// action-timeline.tsx, slash-banner.tsx, oath/[id]/page.tsx, dashboard/page.tsx

// Reuse tokens from scenes.jsx: BG, FG, CARD, PRIMARY, MUTED_FG, BORDER, DISPLAY, UI, MONO

const WARN   = 'hsl(38 92% 60%)';
const SLASH  = 'hsl(0 85% 62%)';
const OK     = 'hsl(150 65% 50%)';

// Small helpers
function Eyebrow({ children, color = MUTED_FG, size = 11, track = '0.28em' }) {
  return (
    <div style={{
      fontFamily: MONO, fontSize: size, letterSpacing: track,
      color, textTransform: 'uppercase',
    }}>{children}</div>
  );
}

function BadgePill({ children, variant = 'neutral' }) {
  const styles = {
    neutral: { bg: 'hsl(240 6% 15%)', fg: FG, br: BORDER },
    success: { bg: 'hsl(150 65% 50% / 0.12)', fg: OK, br: 'hsl(150 65% 50% / 0.4)' },
    danger:  { bg: 'hsl(0 85% 62% / 0.12)', fg: SLASH, br: 'hsl(0 85% 62% / 0.5)' },
    warn:    { bg: 'hsl(38 92% 60% / 0.10)', fg: WARN, br: 'hsl(38 92% 60% / 0.4)' },
    outline: { bg: 'transparent', fg: 'hsl(0 0% 98% / 0.85)', br: 'hsl(240 6% 22%)' },
  }[variant];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 10px', borderRadius: 9999,
      background: styles.bg, color: styles.fg, border: `1px solid ${styles.br}`,
      fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em',
      whiteSpace: 'nowrap',
    }}>{children}</span>
  );
}

// ── Scene: Chat — compose request ────────────────────────────────────────────
function SceneChatCompose() {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.4)) / 0.4, 0, 1);
  const hd = Easing.easeOutCubic(clamp(t / 0.5, 0, 1)) * out;
  const lbl = Easing.easeOutCubic(clamp((t - 0.4) / 0.4, 0, 1)) * out;
  const ta = Easing.easeOutCubic(clamp((t - 0.7) / 0.5, 0, 1)) * out;
  const chips = Easing.easeOutCubic(clamp((t - 1.1) / 0.5, 0, 1)) * out;
  const cta = Easing.easeOutCubic(clamp((t - 1.4) / 0.5, 0, 1)) * out;

  // Typing animation for textarea
  const fullText = "Book dinner for 4 tonight in downtown Austin under $200, avoiding seafood.";
  const typedChars = Math.floor(clamp((t - 0.9) / 1.4, 0, 1) * fullText.length);
  const typed = fullText.slice(0, typedChars);
  const showCaret = Math.floor(t * 3) % 2 === 0 && typedChars < fullText.length;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: 160, transform: 'translateX(-50%)',
      width: 1152, padding: '0 24px',
    }}>
      {/* header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, opacity: hd }}>
        <div>
          <Eyebrow track="0.24em">Demo · Scene 1</Eyebrow>
          <div style={{
            fontFamily: DISPLAY, fontSize: 72, color: FG, letterSpacing: '-0.05em', lineHeight: 0.98,
            marginTop: 12, fontWeight: 600,
          }}>
            Agent concierge
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: MONO, fontSize: 11, color: MUTED_FG, letterSpacing: '0.22em', textTransform: 'uppercase' }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 4, background: OK, boxShadow: `0 0 10px ${OK}` }} />
          wallet · 7k4f…qP2n
        </div>
      </div>

      {/* Two-column layout (composer left, chat stage right — but we'll use wider composer) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 448px', gap: 32, alignItems: 'start' }}>
        <div>
          <div style={{ opacity: lbl, marginBottom: 16 }}>
            <Eyebrow size={12} track="0.18em">Your request</Eyebrow>
          </div>
          <div style={{
            opacity: ta,
            border: `1px solid ${BORDER}`, borderRadius: 16,
            background: 'hsl(240 10% 8% / 0.4)', padding: 24,
            minHeight: 140, fontFamily: UI, fontSize: 18, color: FG, lineHeight: 1.5,
          }}>
            {typed}{showCaret && <span style={{ borderLeft: `2px solid ${FG}`, marginLeft: 2 }} />}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 20, opacity: chips }}>
            {[
              'Book dinner for 4 tonight in downtown Austin under $200…',
              'Research competitors for our startup and summarize findin…',
              'Reserve a car for Friday evening in SF, pickup before 6pm…',
            ].map((ex) => (
              <span key={ex} style={{
                fontFamily: UI, fontSize: 13, color: MUTED_FG,
                border: `1px solid ${BORDER}`, background: 'hsl(240 10% 8% / 0.4)',
                padding: '6px 12px', borderRadius: 9999,
              }}>{ex}</span>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, opacity: cta }}>
            <div style={{
              background: PRIMARY, color: '#fff',
              borderRadius: 9999, padding: '14px 28px',
              fontFamily: UI, fontSize: 15, fontWeight: 500,
              display: 'inline-flex', alignItems: 'center', gap: 10,
              boxShadow: `0 0 40px hsl(250 90% 68% / 0.35)`, whiteSpace: 'nowrap',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l1.9 5.8L20 10.5l-5.4 2.7L13 19l-1.9-5.8L5 11l5.4-2.7z"/></svg>
              Propose oath
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
            </div>
          </div>
        </div>

        {/* Chat stage on the right — "Oath Chamber" */}
        <div style={{ opacity: ta }}>
          <MiniChamberCard state="Idle" sub="Awaiting a request." />
        </div>
      </div>
    </div>
  );
}

function MiniChamberCard({ state, sub }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 28,
      background: `linear-gradient(180deg, hsl(240 10% 8% / 0.76), hsl(240 10% 6% / 0.52))`,
      border: `1px solid hsl(240 6% 18% / 0.6)`,
      backdropFilter: 'blur(28px)',
      boxShadow: `inset 0 1px 0 hsl(0 0% 98% / 0.06), 0 24px 90px -52px hsl(0 0% 98% / 0.85)`,
      width: '100%', height: 520,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: 20, borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
      }}>
        <div>
          <Eyebrow track="0.34em">Live oath state</Eyebrow>
          <div style={{ fontFamily: DISPLAY, fontSize: 22, color: FG, letterSpacing: '-0.03em', marginTop: 6, fontWeight: 500 }}>
            Oath Chamber
          </div>
          <div style={{ fontFamily: UI, fontSize: 12.5, color: MUTED_FG, marginTop: 6, lineHeight: 1.5 }}>
            {sub}
          </div>
        </div>
        <BadgePill variant="outline">{state}</BadgePill>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ position: 'relative', width: 140, height: 140, borderRadius: 70, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: 55, border: '1px solid rgba(255,255,255,0.08)' }} />
          <div style={{ width: 22, height: 84, borderRadius: 4, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(255,255,255,0.08)', boxShadow: '0 0 30px rgba(255,255,255,0.06)' }} />
        </div>
      </div>
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: MUTED_FG, textTransform: 'uppercase',
      }}>
        {[['Ring', 'scope boundary'], ['Slab', 'signed oath'], ['Fracture', 'slash event']].map(([a, b], i) => (
          <div key={i} style={{ padding: '12px 16px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
            <div style={{ color: 'rgba(255,255,255,0.8)' }}>{a}</div>
            <div>{b}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Scene: Planning spinner ─────────────────────────────────────────────────
function ScenePlanning() {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.4)) / 0.4, 0, 1);
  const op = Easing.easeOutCubic(clamp(t / 0.4, 0, 1)) * out;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: 160, transform: 'translateX(-50%)',
      width: 1152, padding: '0 24px', opacity: op,
    }}>
      <div style={{ marginBottom: 32 }}>
        <Eyebrow track="0.24em">Demo · Scene 1</Eyebrow>
        <div style={{ fontFamily: DISPLAY, fontSize: 72, color: FG, letterSpacing: '-0.05em', lineHeight: 0.98, marginTop: 12, fontWeight: 600 }}>
          Agent concierge
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 448px', gap: 32 }}>
        <div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            border: `1px dashed ${BORDER}`, borderRadius: 24,
            background: 'hsl(240 10% 5% / 0.4)', padding: '24px 28px',
            fontFamily: UI, fontSize: 16, color: MUTED_FG, lineHeight: 1.5,
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: 11,
              border: `2.5px solid ${PRIMARY}`, borderRightColor: 'transparent',
              animation: 'spin 1.4s linear infinite', flexShrink: 0,
            }} />
            Gemini is composing an on-chain oath from your request…
          </div>
        </div>
        <div>
          <MiniChamberCard state="Planning" sub="Halo listening. Composing mandate." />
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Scene: OathProposalCard ─────────────────────────────────────────────────
function SceneProposal({ signing = false }) {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.5)) / 0.5, 0, 1);
  const card = Easing.easeOutCubic(clamp(t / 0.7, 0, 1)) * out;
  const meta = Easing.easeOutCubic(clamp((t - 0.4) / 0.6, 0, 1)) * out;
  const scope = Easing.easeOutCubic(clamp((t - 0.8) / 0.6, 0, 1)) * out;
  const footer = Easing.easeOutCubic(clamp((t - 1.1) / 0.6, 0, 1)) * out;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: 150, transform: 'translateX(-50%)',
      width: 920, opacity: card, transform: `translateX(-50%) translateY(${(1 - card) * 24}px)`,
    }}>
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 28,
        background: `linear-gradient(180deg, hsl(240 10% 8% / 0.8), hsl(240 10% 6% / 0.56))`,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: `inset 0 1px 0 hsl(0 0% 98% / 0.06), 0 40px 120px -40px hsl(250 90% 68% / 0.2)`,
      }}>
        {/* Kicker */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 10, letterSpacing: '0.28em', color: MUTED_FG, textTransform: 'uppercase' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>
            Unsigned covenant · Solana devnet
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.22em', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>
            oath · 9Xq4…kM7p
          </div>
        </div>

        {/* Hero: purpose */}
        <div style={{ padding: '40px 28px 28px' }}>
          <Eyebrow size={10} track="0.32em">I, the agent, swear to</Eyebrow>
          <div style={{
            fontFamily: DISPLAY, fontSize: 44, color: FG, letterSpacing: '-0.04em',
            lineHeight: 1.06, marginTop: 20, fontWeight: 500,
          }}>
            Book dinner for 4 tonight in downtown Austin under $200, avoiding seafood.
          </div>
          <div style={{
            fontFamily: UI, fontSize: 14, color: 'hsl(240 5% 65%)',
            lineHeight: 1.7, marginTop: 20, maxWidth: 640,
          }}>
            The user requested a dinner booking with a spend ceiling and a dietary exclusion. I'll bind my authority to OpenTable-surface recipients only, capped per-booking, expiring after the evening.
          </div>
        </div>

        {/* Metadata rail */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)',
          opacity: meta,
        }}>
          {[
            { label: 'Stake',     value: '0.5',  unit: 'SOL',  hint: 'slashable' },
            { label: 'Spend cap', value: '$200', unit: 'USDC', hint: 'cumulative' },
            { label: 'Per-tx',    value: '$60',  unit: 'USDC', hint: 'max single' },
            { label: 'Expiry',    value: '4.0 hr', unit: '',   hint: 'auto-fulfill' },
          ].map((c, i) => (
            <div key={c.label} style={{
              padding: '20px 22px',
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <Eyebrow size={10} track="0.28em">{c.label}</Eyebrow>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 10 }}>
                <span style={{ fontFamily: DISPLAY, fontSize: 28, color: FG, letterSpacing: '-0.03em', fontWeight: 600 }}>{c.value}</span>
                {c.unit && <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED_FG }}>{c.unit}</span>}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: 'hsl(240 5% 48%)', textTransform: 'uppercase', marginTop: 6 }}>
                {c.hint}
              </div>
            </div>
          ))}
        </div>

        {/* Scope */}
        <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: 24, opacity: scope }}>
          <div>
            <Eyebrow size={10} track="0.28em">Allowed action types</Eyebrow>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              <BadgePill variant="outline">search_places</BadgePill>
              <BadgePill variant="outline">book_restaurant</BadgePill>
              <BadgePill variant="outline">complete</BadgePill>
            </div>
          </div>
          <div>
            <Eyebrow size={10} track="0.28em">Whitelisted recipients · 3</Eyebrow>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
              {[
                ['OpenTable · Uchi Austin',     'Aq3h…7f2P'],
                ['OpenTable · Jeffrey\'s',      'Bk1p…9m4R'],
                ['OpenTable · Barley Swine',    'Cx8v…3n6T'],
              ].map(([name, pk]) => (
                <div key={name} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.05)',
                  background: 'hsl(240 10% 5% / 0.3)',
                  fontFamily: UI, fontSize: 14, color: FG,
                }}>
                  <span>{name}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED_FG }}>{pk}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.4)',
          padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          opacity: footer,
        }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            border: '1px solid rgba(255,255,255,0.1)', background: 'hsl(240 10% 5% / 0.4)',
            borderRadius: 9999, padding: '8px 16px',
            fontFamily: UI, fontSize: 12, color: MUTED_FG,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            Hear the oath
          </div>
          <div style={{
            background: signing ? 'hsl(250 90% 68% / 0.5)' : PRIMARY,
            color: '#fff', borderRadius: 10, padding: '14px 24px',
            fontFamily: UI, fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em',
            boxShadow: `0 0 40px hsl(250 90% 68% / 0.4)`, whiteSpace: 'nowrap',
          }}>
            {signing ? 'Awaiting Phantom…' : 'Approve & sign on-chain'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Phantom modal overlay ───────────────────────────────────────────────────
function ScenePhantomSign() {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.4)) / 0.4, 0, 1);
  const op = Easing.easeOutCubic(clamp(t / 0.3, 0, 1)) * out;

  return (
    <>
      {/* Dim backdrop */}
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)', opacity: op,
      }} />
      <div style={{
        position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, -50%) scale(${0.95 + 0.05 * op})`,
        width: 420, borderRadius: 24, overflow: 'hidden',
        background: 'hsl(265 30% 12%)',
        border: '1px solid hsl(265 40% 28%)',
        boxShadow: '0 60px 140px -40px hsl(265 90% 50% / 0.5)',
        opacity: op,
      }}>
        <div style={{ padding: '24px 28px 20px', borderBottom: '1px solid hsl(265 30% 20%)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, hsl(265 90% 65%), hsl(280 80% 55%))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: DISPLAY, fontWeight: 700, color: '#fff', fontSize: 18,
          }}>👻</div>
          <div>
            <div style={{ fontFamily: UI, fontSize: 14, fontWeight: 600, color: '#fff' }}>Phantom</div>
            <div style={{ fontFamily: MONO, fontSize: 10, color: 'hsl(265 20% 60%)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>oa-th.wiki · devnet</div>
          </div>
        </div>
        <div style={{ padding: '24px 28px' }}>
          <div style={{ fontFamily: UI, fontSize: 18, color: '#fff', marginBottom: 16, fontWeight: 600 }}>Approve transaction</div>
          <div style={{ fontFamily: UI, fontSize: 13, color: 'hsl(265 20% 75%)', lineHeight: 1.6, marginBottom: 20 }}>
            Sign to create on-chain oath. Stake: <span style={{ color: '#fff', fontFamily: MONO }}>0.5 SOL</span> will be locked until fulfilment, slash, or expiry.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{
              padding: '12px 0', borderRadius: 10,
              background: 'hsl(265 30% 18%)', color: 'hsl(265 20% 75%)',
              fontFamily: UI, fontSize: 14, fontWeight: 500, textAlign: 'center',
            }}>Cancel</div>
            <div style={{
              padding: '12px 0', borderRadius: 10,
              background: 'linear-gradient(135deg, hsl(265 90% 65%), hsl(280 80% 55%))',
              color: '#fff', fontFamily: UI, fontSize: 14, fontWeight: 600, textAlign: 'center',
              boxShadow: '0 0 20px hsl(265 90% 65% / 0.4)',
            }}>Confirm</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Scene: CompactProposal + ActionTimeline (happy path) ────────────────────
function SceneActionTimeline({ attack = false }) {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.5)) / 0.5, 0, 1);
  const compact = Easing.easeOutCubic(clamp(t / 0.4, 0, 1)) * out;
  const hed = Easing.easeOutCubic(clamp((t - 0.3) / 0.4, 0, 1)) * out;

  const steps = attack ? [
    { seq: 1, kind: 'search_places', rationale: 'Scanning whitelisted restaurant recipients in downtown Austin.', status: 'success', tx: '4kLm…n8P2', candidates: [
      { name: 'Uchi Austin', price: 180, addr: 'Aq3h…7f2P' },
      { name: 'Jeffrey\'s', price: 220, addr: 'Bk1p…9m4R' },
    ]},
    { seq: 2, kind: 'wire_transfer', rationale: 'Agent attempted a direct wire to a non-whitelisted address — outside authorized action types.', status: 'reverted_scope', error: 'ScopeViolation', tx: null, amount: '$2400 → 9zXq…wY4v' },
  ] : [
    { seq: 1, kind: 'search_places', rationale: 'Scanning whitelisted restaurant recipients in downtown Austin.', status: 'success', tx: '4kLm…n8P2', candidates: [
      { name: 'Uchi Austin', price: 180, addr: 'Aq3h…7f2P' },
      { name: 'Jeffrey\'s', price: 220, addr: 'Bk1p…9m4R' },
      { name: 'Barley Swine', price: 165, addr: 'Cx8v…3n6T' },
    ]},
    { seq: 2, kind: 'book_restaurant', rationale: 'Booking Uchi Austin for 4 at 7:30pm. Amount within per-tx cap.', status: 'success', tx: '7pQn…r3Y1', amount: '$48 → Aq3h…7f2P' },
    { seq: 3, kind: 'complete', rationale: 'Reservation confirmed. Oath remains open for follow-up actions until expiry.', status: 'success', tx: null },
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: 140, transform: 'translateX(-50%)',
      width: 920,
    }}>
      {/* Slash banner overlay */}
      {attack && (
        <SlashBannerInline t={t} out={out} />
      )}

      {/* Compact proposal row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
        border: `1px solid ${BORDER}`, background: 'hsl(240 10% 8% / 0.4)',
        borderRadius: 16, padding: 16, opacity: compact,
        marginTop: attack ? 16 : 0,
      }}>
        <BadgePill variant="success">signed</BadgePill>
        <div style={{ fontFamily: UI, fontSize: 14, color: FG, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Book dinner for 4 tonight in downtown Austin under $200, avoiding seafood.
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 11, color: MUTED_FG }}>
          <span>cap</span><span>$200</span><span>·</span><span>stake</span><span>0.5 SOL</span><span>·</span>
          <span style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>tx 2Xc4…</span>
        </div>
      </div>

      {/* Section header */}
      <div style={{
        marginTop: 28, marginBottom: 16,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        opacity: hed,
      }}>
        <Eyebrow size={11} track="0.22em">Agent execution</Eyebrow>
        <BadgePill variant={attack ? 'danger' : 'success'}>{attack ? 'slashed' : 'completed'}</BadgePill>
      </div>

      {/* Timeline */}
      <div style={{
        borderRadius: 24, border: `1px solid ${BORDER}`, overflow: 'hidden',
        background: 'hsl(240 10% 8% / 0.2)',
      }}>
        {steps.map((s, i) => {
          const stepStart = 0.7 + i * 0.6;
          const sT = Easing.easeOutCubic(clamp((t - stepStart) / 0.5, 0, 1)) * out;
          const violation = s.status.startsWith('reverted');
          const bg = violation ? 'hsl(0 85% 62% / 0.06)' : 'hsl(240 10% 5% / 0.4)';
          return (
            <div key={s.seq} style={{
              display: 'grid', gridTemplateColumns: '100px 1fr auto', gap: 16,
              padding: '18px 22px',
              borderBottom: i < steps.length - 1 ? `1px solid ${BORDER}` : 'none',
              background: bg, opacity: sT, transform: `translateY(${(1 - sT) * 8}px)`,
            }}>
              <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: MUTED_FG, textTransform: 'uppercase' }}>
                {String(s.seq).padStart(2, '0')}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 14,
                    border: `1px solid ${BORDER}`, background: 'hsl(240 10% 5% / 0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED_FG,
                  }}>
                    {iconForStep(s.kind)}
                  </div>
                  <div style={{ fontFamily: UI, fontSize: 14, fontWeight: 500, color: FG }}>
                    {humanKind(s.kind)}
                  </div>
                  {s.tx && (
                    <span style={{
                      fontFamily: MONO, fontSize: 11, color: MUTED_FG,
                      border: `1px solid ${BORDER}`, padding: '2px 10px', borderRadius: 9999,
                    }}>
                      {s.tx} ↗
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: UI, fontSize: 13.5, color: MUTED_FG, marginTop: 6, lineHeight: 1.5 }}>
                  {s.rationale}
                </div>
                {s.candidates && (
                  <div style={{
                    marginTop: 10, borderRadius: 8,
                    border: `1px solid ${BORDER}`, background: 'hsl(240 10% 5% / 0.3)',
                    overflow: 'hidden',
                  }}>
                    {s.candidates.map((c, ci) => (
                      <div key={ci} style={{
                        display: 'flex', justifyContent: 'space-between',
                        padding: '8px 14px', fontFamily: UI, fontSize: 12,
                        borderTop: ci > 0 ? `1px solid ${BORDER}` : 'none',
                      }}>
                        <span style={{ color: FG }}>› <b style={{ fontWeight: 500 }}>{c.name}</b> <span style={{ color: MUTED_FG, marginLeft: 8, fontFamily: MONO, fontSize: 11 }}>{c.addr}</span></span>
                        <span style={{ fontFamily: MONO, color: MUTED_FG }}>~${c.price}</span>
                      </div>
                    ))}
                  </div>
                )}
                {s.amount && (
                  <div style={{ fontFamily: MONO, fontSize: 12, color: MUTED_FG, marginTop: 8 }}>
                    {s.amount}
                  </div>
                )}
              </div>
              <div>
                <BadgePill variant={violation ? 'danger' : 'success'}>
                  {violation ? s.error : s.status}
                </BadgePill>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer controls (happy path only) */}
      {!attack && (
        <div style={{
          marginTop: 16, padding: 16, borderRadius: 16,
          border: `1px solid ${BORDER}`, background: 'hsl(240 10% 8% / 0.4)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
          opacity: Easing.easeOutCubic(clamp((t - 2.5) / 0.5, 0, 1)) * out,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: UI, fontSize: 13, color: MUTED_FG }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2"><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z"/></svg>
            Same oath still active? Run the jailbreak attack.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{
              background: SLASH, color: '#fff',
              borderRadius: 9999, padding: '8px 18px',
              fontFamily: UI, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
            }}>Run attack</div>
            <div style={{
              border: `1px solid ${BORDER}`, color: FG,
              borderRadius: 9999, padding: '8px 18px',
              fontFamily: UI, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
            }}>New request</div>
          </div>
        </div>
      )}
    </div>
  );
}

function SlashBannerInline({ t, out }) {
  const op = Easing.easeOutCubic(clamp((t - 0.1) / 0.5, 0, 1)) * out;
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      borderRadius: 16, padding: 20,
      border: `1px solid hsl(0 85% 62% / 0.55)`,
      background: 'hsl(0 85% 62% / 0.08)',
      boxShadow: '0 0 60px -10px hsl(0 85% 62% / 0.55)',
      opacity: op, transform: `translateY(${(1 - op) * -16}px) scale(${0.96 + 0.04 * op})`,
    }}>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at top right, hsl(0 85% 62% / 0.25), transparent 60%)',
      }} />
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 20,
            background: 'hsl(0 85% 62% / 0.2)', color: SLASH,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v4m0 4h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          </div>
          <div>
            <div style={{ fontFamily: UI, fontSize: 11, letterSpacing: '0.16em', color: SLASH, textTransform: 'uppercase', fontWeight: 600 }}>
              Oath violated — stake slashed
            </div>
            <div style={{ fontFamily: UI, fontSize: 16, color: FG, fontWeight: 500, marginTop: 4, maxWidth: 560, lineHeight: 1.4 }}>
              The agent attempted an out-of-scope action. The on-chain program reverted and transferred the stake to the user's wallet.
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED_FG, marginTop: 4 }}>
              ScopeViolation
            </div>
          </div>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          border: `1px solid hsl(0 85% 62% / 0.55)`, background: 'hsl(0 85% 62% / 0.15)',
          borderRadius: 9999, padding: '8px 16px',
          fontFamily: MONO, fontSize: 11, color: FG, whiteSpace: 'nowrap',
        }}>
          slash tx 9mNx…z4Qr ↗
        </div>
      </div>
    </div>
  );
}

function iconForStep(kind) {
  const stroke = MUTED_FG;
  if (kind === 'search_places') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
  if (kind === 'book_restaurant') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2"><path d="M3 2v20M8 2v9a3 3 0 01-3 3M16 2v20M20 2c1 0 2 1 2 3v5c0 1-1 2-2 2v10"/></svg>;
  if (kind === 'complete') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>;
  if (kind === 'wire_transfer') return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={SLASH} strokeWidth="2"><path d="M12 9v4m0 4h.01M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>;
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2"><path d="M8 5v14l11-7z"/></svg>;
}

function humanKind(kind) {
  return {
    search_places: 'Scanning recipients',
    book_restaurant: 'Recording payment',
    complete: 'Task complete',
    wire_transfer: 'Unauthorized wire',
    abort: 'Agent aborted',
  }[kind] || kind;
}

// ── Scene: Oath dossier page ────────────────────────────────────────────────
function SceneOathDossier() {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.4)) / 0.4, 0, 1);
  const card = Easing.easeOutCubic(clamp(t / 0.6, 0, 1)) * out;
  const rail = Easing.easeOutCubic(clamp((t - 0.4) / 0.6, 0, 1)) * out;
  const parties = Easing.easeOutCubic(clamp((t - 0.8) / 0.6, 0, 1)) * out;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: 140, transform: 'translateX(-50%)',
      width: 840,
    }}>
      <div style={{
        marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: MONO, fontSize: 11, letterSpacing: '0.24em', color: MUTED_FG, textTransform: 'uppercase',
        opacity: card,
      }}>
        <span>← dashboard</span><span>·</span><span>oath #47</span>
      </div>

      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 28,
        background: `linear-gradient(180deg, hsl(240 10% 8% / 0.8), hsl(240 10% 6% / 0.56))`,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: `inset 0 1px 0 hsl(0 0% 98% / 0.06)`,
        opacity: card,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          padding: '16px 28px', fontFamily: MONO, fontSize: 10, letterSpacing: '0.28em', color: MUTED_FG, textTransform: 'uppercase',
        }}>
          <span>Oath dossier · Solana devnet</span>
          <BadgePill variant="success">Active</BadgePill>
        </div>

        <div style={{ padding: '32px 28px 28px' }}>
          <Eyebrow size={10} track="0.32em">Sworn purpose</Eyebrow>
          <div style={{
            fontFamily: DISPLAY, fontSize: 44, color: FG, letterSpacing: '-0.04em',
            lineHeight: 1.06, marginTop: 16, fontWeight: 500,
          }}>
            Book dinner for 4 tonight in downtown Austin under $200, avoiding seafood.
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            marginTop: 24, padding: '6px 14px', borderRadius: 9999,
            border: '1px solid rgba(255,255,255,0.1)', background: 'hsl(240 10% 5% / 0.4)',
            fontFamily: MONO, fontSize: 11, color: MUTED_FG,
          }}>
            9Xq4B2mPk7nRvL3tFjC1yH8dN5aZwT6sU9eM4oKpX2bV ↗
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          borderTop: '1px solid rgba(255,255,255,0.1)', borderBottom: '1px solid rgba(255,255,255,0.1)',
          opacity: rail,
        }}>
          {[
            { label: 'Spent',       value: '$48',     hint: 'of $200 cap', bar: 24 },
            { label: 'Per-tx cap',  value: '$60',     hint: 'USDC max' },
            { label: 'Stake',       value: '0.50',    hint: 'SOL locked' },
            { label: 'Window',      value: '3.8 h left', hint: 'Nov 14' },
          ].map((c, i) => (
            <div key={c.label} style={{ padding: '20px 22px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <Eyebrow size={10} track="0.28em">{c.label}</Eyebrow>
              <div style={{ fontFamily: DISPLAY, fontSize: 26, color: FG, letterSpacing: '-0.03em', marginTop: 10, fontWeight: 600 }}>{c.value}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.18em', color: 'hsl(240 5% 48%)', textTransform: 'uppercase', marginTop: 6 }}>{c.hint}</div>
              {typeof c.bar === 'number' && (
                <div style={{ marginTop: 12, height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}>
                  <div style={{ width: `${c.bar}%`, height: '100%', background: 'rgba(255,255,255,0.8)' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          opacity: parties,
        }}>
          {[
            { role: 'User · beneficiary',   pk: '7k4FqP2n…R9mT' },
            { role: 'Agent · bound party',  pk: 'Ag3ntHa1o…K8x' },
          ].map((p, i) => (
            <div key={p.role} style={{
              padding: '16px 22px', display: 'flex', flexDirection: 'column', gap: 8,
              borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none',
            }}>
              <Eyebrow size={10} track="0.28em">{p.role}</Eyebrow>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: MONO, fontSize: 13, color: 'hsl(0 0% 98% / 0.9)' }}>
                <span>{p.pk}</span>
                <span style={{ color: MUTED_FG }}>↗</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20, opacity: parties }}>
          <div>
            <Eyebrow size={10} track="0.28em">Authorized action types</Eyebrow>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
              <BadgePill variant="outline">search_places</BadgePill>
              <BadgePill variant="outline">book_restaurant</BadgePill>
              <BadgePill variant="outline">complete</BadgePill>
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', textAlign: 'center',
          borderTop: '1px solid rgba(255,255,255,0.1)',
          opacity: parties,
        }}>
          {[
            ['Created', 'Nov 13, 7:42 PM', false],
            ['Vault', 'Vlt4…kQ2', true],
            ['Actions', '3', true],
          ].map(([l, v, mono], i) => (
            <div key={l} style={{ padding: '14px 16px', borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
              <Eyebrow size={10} track="0.22em">{l}</Eyebrow>
              <div style={{ fontFamily: mono ? MONO : UI, fontSize: 13, color: FG, marginTop: 4 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Scene: Dashboard ledger ─────────────────────────────────────────────────
function SceneDashboard() {
  const { localTime, duration } = useSprite();
  const t = localTime;
  const out = 1 - clamp((t - (duration - 0.4)) / 0.4, 0, 1);
  const hd = Easing.easeOutCubic(clamp(t / 0.4, 0, 1)) * out;

  const rows = [
    { status: 'Active',   purpose: 'Book dinner for 4 tonight in downtown Austin under $200, avoiding seafood.', pk: '9Xq4…kM7p', when: 'Nov 13, 7:42 PM', cap: 200, stake: 0.5 },
    { status: 'Slashed',  purpose: 'Research competitors and summarize findings. No purchases.', pk: '2Bv1…nF8q', when: 'Nov 13, 4:18 PM', cap: 100, stake: 0.3 },
    { status: 'Fulfilled',purpose: 'Reserve a car for Friday evening in SF, pickup before 6pm.', pk: '7Rm3…tX4c', when: 'Nov 12, 11:02 AM', cap: 150, stake: 0.4 },
    { status: 'Expired',  purpose: 'Schedule a meeting with the founders next week.', pk: '5Jd8…wP1h', when: 'Nov 11, 9:30 AM', cap: 50, stake: 0.1 },
    { status: 'Active',   purpose: 'Draft a two-paragraph email to the design team.', pk: '3Nq7…mR2v', when: 'Nov 11, 2:14 PM', cap: 25, stake: 0.1 },
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: 140, transform: 'translateX(-50%)',
      width: 1152, padding: '0 24px',
    }}>
      <div style={{ opacity: hd }}>
        <Eyebrow size={11} track="0.22em">Evidence ledger</Eyebrow>
        <div style={{
          fontFamily: DISPLAY, fontSize: 48, color: FG, letterSpacing: '-0.04em', lineHeight: 1.05,
          marginTop: 12, fontWeight: 600,
        }}>
          Recorded mandates
        </div>
        <div style={{
          fontFamily: UI, fontSize: 15, color: MUTED_FG, lineHeight: 1.5,
          marginTop: 10, maxWidth: 560,
        }}>
          Every row below is fetched directly from the Oath program on Solana devnet — the protocol itself is the database.
        </div>
      </div>

      <div style={{
        marginTop: 28, borderRadius: 24, overflow: 'hidden',
        border: `1px solid ${BORDER}`, background: 'hsl(240 10% 8% / 0.2)',
      }}>
        {rows.map((r, i) => {
          const rT = Easing.easeOutCubic(clamp((t - 0.6 - i * 0.15) / 0.4, 0, 1)) * out;
          const variant = r.status === 'Slashed' ? 'danger' : r.status === 'Active' ? 'success' : 'neutral';
          return (
            <div key={r.pk} style={{
              display: 'grid', gridTemplateColumns: '120px 1fr auto', gap: 16,
              padding: '18px 22px',
              borderBottom: i < rows.length - 1 ? `1px solid ${BORDER}` : 'none',
              opacity: rT, transform: `translateY(${(1 - rT) * 8}px)`,
            }}>
              <div><BadgePill variant={variant}>{r.status}</BadgePill></div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: UI, fontSize: 14.5, fontWeight: 500, color: FG, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.purpose}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED_FG, marginTop: 4 }}>
                  {r.pk}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontFamily: MONO, fontSize: 11, color: MUTED_FG, whiteSpace: 'nowrap' }}>
                <span>{r.when}</span>
                <span>cap ${r.cap}</span>
                <span>stake {r.stake.toFixed(2)} SOL</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, {
  SceneChatCompose, ScenePlanning, SceneProposal, ScenePhantomSign,
  SceneActionTimeline, SceneOathDossier, SceneDashboard,
});
