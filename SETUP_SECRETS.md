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

> **Current state — one step left.** `functions/api/_security.js` still carries a
> `LEGACY_TURNSTILE_SECRET` constant. It exists only so that shipping the frontend fix
> cannot take lead capture down on an environment that has not bound this variable yet;
> a fail-closed deploy without the binding returns 503 for every visitor. Retire it:
>
> 1. rotate the widget's secret key in the Cloudflare dashboard (Turnstile → widget →
>    *Rotate secret key*);
> 2. bind the new value here as `TURNSTILE_SECRET_KEY` (Production **and** Preview);
> 3. delete the `LEGACY_TURNSTILE_SECRET` constant from `functions/api/_security.js`.
>
> After step 3 the endpoint fails closed exactly as described above, and the 503 branch in
> `functions/api/leads.js` becomes the active guard it was written to be.

> **Rotate, don't reuse.** An earlier revision of this codebase shipped a hardcoded
> fallback secret inside `_security.js`, in a public repository, so that value must be
> treated as compromised. Rotate the widget secret in the Cloudflare dashboard, then put
> the **new** value into `TURNSTILE_SECRET_KEY` **before** deleting the constant.

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
