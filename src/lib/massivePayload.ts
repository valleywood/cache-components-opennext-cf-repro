/**
 * Builds a large string to inflate HTML / cache entries (stress OpenNext + Workers).
 * Set `REPRO_RESPONSE_KB` (kilobytes) before `yarn preview` / deploy. Capped at 16 MiB.
 */
const LINE =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\n';

const MAX_BYTES = 16 * 1024 * 1024;

export function getTargetPayloadBytes(): number {
  const raw = process.env.REPRO_RESPONSE_KB;
  const kb = raw === undefined || raw === '' ? 512 : Number(raw);
  if (!Number.isFinite(kb) || kb <= 0) {
    return 512 * 1024;
  }
  return Math.min(Math.floor(kb * 1024), MAX_BYTES);
}

export function buildMassivePayloadString(targetBytes: number): string {
  const lineLen = LINE.length;
  const lines = Math.max(1, Math.ceil(targetBytes / lineLen));
  const out = LINE.repeat(lines);
  return out.length > targetBytes ? out.slice(0, targetBytes) : out;
}
