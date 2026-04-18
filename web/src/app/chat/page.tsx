export default function ChatPage(): JSX.Element {
  return (
    <main className="container mx-auto max-w-3xl px-6 py-20 font-mono text-sm text-muted-foreground">
      <h1 className="mb-4 text-2xl font-semibold text-foreground">chat</h1>
      <p>
        Phase 3 will wire this up to the wallet adapter, Gemini planner, and
        live Solana subscription. The backend is already serving{" "}
        <code>/api/agent/plan</code> and <code>/api/agent/execute</code>.
      </p>
    </main>
  );
}
