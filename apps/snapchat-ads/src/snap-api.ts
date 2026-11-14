export const SNAP_API = 'https://adsapi.snapchat.com/v1';

export interface SnapEnvelope {
  request_status?: string;
  request_id?: string;
  [key: string]: unknown;
}

export type SnapResult =
  | { ok: true; body: SnapEnvelope }
  | { ok: false; error: string };

/**
 * One place for Snap's request envelope, so a path or auth change is a
 * one-line fix rather than a sweep through every tool.
 *
 * Every endpoint answers with `{ request_status, request_id, <entity>: [...] }`.
 * Tools hand the body to the model as-is instead of re-shaping it, which keeps
 * us from guessing field names Snap may change.
 */
export async function snapGet(token: string, path: string): Promise<SnapResult> {
  let response: Response;
  try {
    response = await fetch(`${SNAP_API}${path}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
  } catch (error) {
    return { ok: false, error: `Could not reach Snap: ${error instanceof Error ? error.message : 'unknown'}` };
  }

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    return {
      ok: false,
      error: `Snap returned HTTP ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ''}`,
    };
  }

  return { ok: true, body: (await response.json()) as SnapEnvelope };
}

export function toToolResult(result: SnapResult) {
  return result.ok
    ? { status: 'success' as const, result: JSON.stringify(result.body, null, 2) }
    : { status: 'error' as const, error: result.error };
}
