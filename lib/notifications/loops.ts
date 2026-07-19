// Shared Loops.so transactional sender. Stubbed until LOOPS_API_KEY exists:
// events log to console and sending starts for real the moment the key
// lands in the environment. Each transactionalId must have a matching
// template created in the Loops dashboard.
export async function sendTransactional(
  transactionalId: string,
  email: string,
  dataVariables: Record<string, string | number>
): Promise<void> {
  const apiKey = process.env.LOOPS_API_KEY;
  const payload = { transactionalId, email, dataVariables };

  if (!apiKey) {
    console.log(`[loops stub — LOOPS_API_KEY not set]`, JSON.stringify(payload));
    return;
  }

  const res = await fetch("https://app.loops.so/api/v1/transactional", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    console.error(`Loops send failed (${transactionalId}, ${res.status}): ${await res.text()}`);
  }
}
