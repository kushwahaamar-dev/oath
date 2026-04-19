import { env, features } from "@/lib/config";
import { log } from "@/lib/logger";
import { withRetry, HttpError } from "@/lib/utils";

const BASE_URL = "https://api.elevenlabs.io/v1";

/**
 * Synthesize speech via ElevenLabs. Returns an mp3 as a base64 string
 * suitable for `data:audio/mpeg;base64,…` playback. When no API key
 * is configured — or the upstream fails (quota, paid-voice, network) —
 * returns `null` so the UI renders a silent CTA instead of dying.
 */
export async function synthesize(text: string): Promise<string | null> {
  if (!features.elevenLabs) {
    log.warn("tts.mock", { chars: text.length });
    return null;
  }
  try {
    const url = `${BASE_URL}/text-to-speech/${env.ELEVENLABS_VOICE_ID}?output_format=mp3_44100_128`;
    const res = await withRetry(async () => {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": env.ELEVENLABS_API_KEY!,
          "content-type": "application/json",
          accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      });
      if (!r.ok) {
        const body = await r.text().catch(() => "");
        throw new HttpError(r.status, `elevenlabs ${r.status}`, body);
      }
      return r;
    });
    const buf = Buffer.from(await res.arrayBuffer());
    log.info("tts.ok", { bytes: buf.length });
    return buf.toString("base64");
  } catch (err) {
    // TTS is cosmetic for the demo. A 402/quota/network failure must not
    // take down the plan endpoint.
    const e = err as HttpError;
    log.warn("tts.fallback", {
      status: e.status,
      message: e.message,
    });
    return null;
  }
}
