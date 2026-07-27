const RESEND_API_URL = 'https://api.resend.com/emails';

// No RESEND_API_KEY configured (e.g. local dev) — log instead of sending,
// so the reset flow is still testable without real email delivery.
export async function sendPasswordResetEmail(to: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || 'HealthTrack <onboarding@resend.dev>';

  if (!apiKey) {
    console.log(`[dev] password reset code for ${to}: ${code}`);
    return;
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject: 'HealthTrack — сырсөздү калыбына келтирүү коду',
      text: `Сырсөздү калыбына келтирүү коду: ${code}\n\nБул код 1 саат ичинде жарактуу. Эгер бул сурамды сиз жасабасаңыз, бул катты этибарга албаңыз.`,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Resend API error: ${response.status} ${body}`);
  }
}
