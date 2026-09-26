# Setup Secrets for Lead Capture

The unified lead capture endpoint (`functions/api/leads.js`) needs three secrets in
Cloudflare Pages. Run the commands in your terminal from the repo root.

## 1. Cloudflare Turnstile — REQUIRED (fail closed)

```bash
npx wrangler pages secret put TURNSTILE_SECRET_KEY --project-name b2b-go4ai
```
*When prompted, paste the **Secret Key** of the Turnstile widget (Cloudflare Dashboard →
Turnstile → your widget → Settings → Secret Key).*

**This one is not optional.** The intended end state is a **fail-closed** endpoint: if
`TURNSTILE_SECRET_KEY` is missing or empty it answers `503 TURNSTILE_NOT_CONFIGURED` and
**rejects the submission** — it never accepts a lead without a verified Turnstile token.

Production and Preview both have `TURNSTILE_SECRET_KEY` configured in the Pages dashboard.
The code no longer has a fallback secret. If either binding is removed, the endpoint
returns `503 TURNSTILE_NOT_CONFIGURED` without accepting the lead.

**Rotate the existing key.** An earlier revision shipped a hardcoded fallback in a public
repository, so the old Turnstile secret must be treated as compromised. Rotate the widget
secret in the Cloudflare dashboard and replace `TURNSTILE_SECRET_KEY` in both Production
and Preview. Redeploy and verify a real form submission after the replacement.

> **Never commit a secret.** Do not paste it into `.env`, `wrangler.toml`, source files, or
> a commit message. The endpoint never logs the secret or a full token; only Cloudflare's
> opaque `error-codes` (`invalid-input-secret`, `invalid-input-response`, …) are logged.

## 2. Telegram Bot Token

```bash
npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name b2b-go4ai
```
*When prompted, paste your actual Telegram Bot Token.*

## 3. Telegram Chat ID

```bash
npx wrangler pages secret put TELEGRAM_CHAT_ID --project-name b2b-go4ai
```
*When prompted, paste your Telegram Chat ID.*

---

**Note:** Never commit these secrets into `.env` or any file tracked by Git.

## Verifying the binding is live

After setting the secrets, redeploy and confirm the endpoint is no longer failing closed:

```bash
# Expect 403 TURNSTILE_REQUIRED (the secret IS configured, the token is missing).
# A 503 TURNSTILE_NOT_CONFIGURED means the binding did not take effect.
curl -s -o - -w '\nHTTP %{http_code}\n' -X POST https://b2b.go4ai.org/api/leads \
  -H 'Content-Type: application/json' \
  -d '{"leadType":"enterprise_consultation","name":"Test","email":"test@example.com","phone":"0900000000"}'
```
