# Web3Forms Integration Guide

This document explains how to use [Web3Forms](https://web3forms.com) to receive contact form submissions via email — no backend required.

## Overview

Web3Forms is a free form backend service that forwards form submissions to your email. It works with static and SSR sites (Astro, Vite/React, etc.) because it uses a third-party API endpoint instead of your own server.

The Windy City Gym site uses Web3Forms for the Contact form. The previous nodemailer + Gmail SMTP setup (`/api/email`) is kept as a fallback server route.

---

## Quick Start

### 1. Get an Access Key

1. Go to [web3forms.com](https://web3forms.com/#start)
2. Enter the email address where you want to receive submissions (e.g., `windycitygymcardston@gmail.com`)
3. Submit the form — you'll receive your **Access Key** by email
4. Copy the key (it looks like: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 2. Configure the Project

1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` and replace the placeholder with your actual key:
   ```
   VITE_WEB3FORMS_ACCESS_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```
3. _(Optional — PRO)_ Add a Cloudflare Turnstile site key for enhanced bot detection:
   ```
   VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA_your_site_key_here
   ```
4. **Important:** `.env` is in `.gitignore` — never commit your access key.

> **Note:** The `VITE_` prefix is required. Astro uses Vite, and only environment variables prefixed with `VITE_` are exposed to client-side code. Without this prefix, the access key would be `undefined` in the browser.

### 3. Deploy (Vercel, Netlify, etc.)

Add the environment variable in your hosting dashboard:

- **Vercel:** Project → Settings → Environment Variables → Add `VITE_WEB3FORMS_ACCESS_KEY`
- **Netlify:** Site settings → Environment variables → Add `VITE_WEB3FORMS_ACCESS_KEY`

### 4. Test

Submit the contact form on your site. You should receive an email with the submitted data.

---

## Reserved Fields (Optional)

These field names have special behavior. Use them as needed:

| Field        | Type   | Description                                                               |
| ------------ | ------ | ------------------------------------------------------------------------- |
| `access_key` | string | **Required.** Your Web3Forms access key.                                  |
| `email`      | string | User email. Used as the Reply-To address in your notification email.      |
| `subject`    | string | Email subject. Can be user-filled or a hidden default.                    |
| `from_name`  | string | Name shown as sender (default: "Notifications").                          |
| `redirect`   | string | URL to redirect to after success (for non-JavaScript submissions).        |
| `botcheck`   | hidden | Honeypot for spam protection. Add as hidden checkbox with `display:none`. |
| `replyto`    | string | Override Reply-To if you don't want to use the `email` field.             |
| `ccemail`    | string | _(PRO)_ CC another email address.                                         |
| `webhook`    | string | _(PRO)_ Webhook URL for integrations (Zapier, Notion, etc.).              |

Any other field names are sent through as custom data and appear in your email.

---

## Project Integration

### Helper: `src/lib/web3forms.ts`

The `submitToWeb3Forms()` function handles the API call:

- POSTs to `https://api.web3forms.com/submit` with `Content-Type: application/json`
- Sets `access_key` from `import.meta.env.VITE_WEB3FORMS_ACCESS_KEY`
- Returns `{ success, message }` for UI feedback
- Skips submission if `botcheck` is filled (honeypot anti-spam)
- Returns an error message if the access key is missing or still the placeholder

### Contact Form (`ContactForm.astro`)

The contact form sends these fields:

- **User-visible:** `firstName`, `lastName`, `email`, `message`
- **Computed (client script):** `name` (firstName + lastName), `subject` (fixed: "New contact — Windy City Gym website"), `from_name` (same as `name`)
- **Honeypot:** `botcheck` (hidden checkbox)

### Spam Protection

The form includes a honeypot `botcheck` checkbox that is hidden via CSS (`display: none`). Bots tend to fill all form fields, so if `botcheck` has a value, the submission is silently skipped without being sent to Web3Forms.

The previous "day of month" quiz question has been replaced by this honeypot approach.

### Fallback: `/api/email` (Server Route)

The original nodemailer + Gmail SMTP route at `src/pages/api/email.ts` is preserved as a fallback. If Web3Forms is down or misconfigured, you can switch the form back to posting to `/api/email` by changing the `fetch` call in `ContactForm.astro`. It requires these env vars:

- `GMAIL_ACCOUNT` — Gmail address for SMTP auth
- `GMAIL_APP_PW` — Gmail app password
- `GMAIL_TO` — Recipient email address

### Cloudflare Turnstile (Optional — PRO Feature)

[Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) is an invisible bot-detection challenge. It is a **Web3Forms PRO** feature — the free tier only supports the honeypot.

**Setup:**
1. Get a Turnstile site key at [dash.cloudflare.com](https://dash.cloudflare.com/?to=/:account/turnstile) (free, unlimited verifications)
2. Add to `.env`:
   ```
   VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA_your_site_key_here
   ```
3. Upgrade to Web3Forms PRO to enable server-side Turnstile verification

**Important:** A Turnstile site key is public (used client-side) and is safe to commit. The secret key stays in Cloudflare/W3F dashboard — never in your code.

---

## Optional Enhancements

### Custom Subject Line

Add a hidden field to override the default subject:

```html
<input type="hidden" name="subject" value="New Contact from Windy City Gym" />
```

### Success Redirect (No JavaScript)

For plain HTML form posts (no JS):

```html
<input type="hidden" name="redirect" value="https://windycitygym.com/thank-you" />
```

### Custom From Name

```html
<input type="hidden" name="from_name" value="Windy City Gym Website" />
```

---

## API Reference

- **Endpoint:** `POST https://api.web3forms.com/submit`
- **Alternative:** `POST https://api.web3forms.com/submit/YOUR_ACCESS_KEY` (access key in URL, no hidden field needed)

### Response Codes

| Code | Meaning                                  |
| ---- | ---------------------------------------- |
| 200  | Success (JSON response)                  |
| 303  | Success with redirect                    |
| 400  | Client error (invalid data, missing key) |
| 429  | Too many requests (rate limit)           |
| 500  | Server error                             |

### Success Response (200)

```json
{
  "success": true,
  "body": {
    "data": {
      "name": "...",
      "email": "...",
      "message": "..."
    },
    "message": "Email sent successfully!"
  }
}
```

---

## Troubleshooting

| Issue                    | Possible cause / fix                                         |
| ------------------------ | ------------------------------------------------------------ |
| No email received        | Check spam folder; verify access key and recipient email.    |
| 400 error                | Ensure `access_key` is present and valid.                    |
| 429 error                | Rate limit hit; wait and retry.                              |
| Form submits but no JSON | Form may be doing a full-page POST; check `action`/`method`. |
| "Form is not configured" | The `VITE_WEB3FORMS_ACCESS_KEY` env var is missing or still set to the placeholder. |
| VITE_ prefix missing     | Without `VITE_`, Vite won't expose the env var to client-side code. |

---

## Resources

- [Web3Forms](https://web3forms.com)
- [Documentation](https://docs.web3forms.com)
- [API Reference](https://docs.web3forms.com/getting-started/api-reference)