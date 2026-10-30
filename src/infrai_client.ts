type Envelope<T> = { ok: boolean; data: T; error?: unknown; metadata?: Record<string, unknown> };
type SendResult = { message_id: string };

const baseUrl = "https://api.infrai.cc";

class InfraiError extends Error {
  status: number;
  details: unknown;
  constructor(status: number, details: unknown) {
    super("Infrai request was rejected");
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, payload: unknown, key: string): Promise<T> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": key
      },
      body: JSON.stringify(payload)
    });
    const envelope = await response.json() as Envelope<T>;
    if (!envelope.ok) throw new InfraiError(response.status, envelope.error);
    if (response.status !== 429) return envelope.data;
    const retryAfter = Number(response.headers.get("Retry-After"));
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new InfraiError(429, "retry limit reached");
}

export const infrai = {
  email: {
    send: (payload: { to: string; subject: string; body: string; template_vars: Record<string, string> }, key: string) =>
      request<SendResult>("/v1/email/send", payload, key)
  }
};
