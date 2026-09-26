# Setup Telegram Secrets for Lead Capture

To enable Telegram notifications for the unified lead capture system, you must configure two secrets in Cloudflare Pages. 

Please run the following commands in your terminal:

1. **Set the Telegram Bot Token:**
   ```bash
   npx wrangler pages secret put TELEGRAM_BOT_TOKEN --project-name b2b-go4ai
   ```
   *When prompted, paste your actual Telegram Bot Token.*

2. **Set the Telegram Chat ID:**
   ```bash
   npx wrangler pages secret put TELEGRAM_CHAT_ID --project-name b2b-go4ai
   ```
   *When prompted, paste your Telegram Chat ID.*

**Note:** Never commit these secrets into `.env` or any file tracked by Git.
