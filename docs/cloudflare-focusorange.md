# FocusOrange Cloudflare Deployment

This setup keeps the authoritative data on the Mac. Cloudflare Pages hosts the iPhone/PWA shell, and Cloudflare Tunnel forwards sync API requests to the Mac process at `http://127.0.0.1:33687`.

## Local Files

- `.env.example`: environment template for the Mac sync API.
- `wrangler.toml`: Cloudflare Pages direct-upload configuration.
- `scripts/start-sync-desktop.sh`: starts the Electron app with sync environment loaded from `.env.local`.
- `scripts/start-quick-tunnel.sh`: starts a temporary `trycloudflare.com` tunnel without requiring a custom domain.
- `scripts/register-quick-tunnel.sh`: registers the latest Quick Tunnel URL with the stable Worker router.
- `docs/cloudflare/focusorange-tunnel.example.yml`: locally-managed tunnel config template.
- `workers/sync-router`: stable Worker router that forwards iPhone sync requests to the latest Quick Tunnel.

## 1. Configure Mac Sync

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Set:

- `FOCUSORANGE_SYNC_TOKEN`: a long random local access token.
- `FOCUSORANGE_SYNC_ALLOWED_ORIGIN`: the exact Pages origin, for example `https://focusorange.pages.dev`.
- `FOCUSORANGE_SYNC_PORT`: keep `33687` unless there is a conflict.
- `FOCUSORANGE_SYNC_HOST`: keep `127.0.0.1`.

Start the Mac app with sync enabled:

```bash
npm run sync:desktop
```

When `FOCUSORANGE_QUICK_TUNNEL=true` is set, the Electron main process also starts `cloudflared` in the background, detects the generated Quick Tunnel URL, and registers it with the stable Worker router automatically.

## 2. Deploy the iPhone/PWA Site to Pages

Cloudflare Pages Direct Upload accepts a build output directory. This project builds to `dist`.

```bash
npm run cloudflare:pages:deploy
```

The project name is currently fixed to `focusorange`, so the default Pages URL should be similar to:

```text
https://focusorange.pages.dev
```

If Cloudflare assigns a different URL, update `.env.local` and restart the Mac app.

## 3A. No Domain: Use a Quick Tunnel

If you do not own a Cloudflare-managed domain, use a Quick Tunnel plus the stable Worker router.

Manual debugging path: start the Quick Tunnel:

```bash
npm run sync:quick-tunnel
```

The command prints a temporary URL similar to:

```text
https://random-words.trycloudflare.com
```

Keep that terminal open if using the manual path.

Register the printed URL with the stable Worker router if you started it manually:

```bash
npm run sync:register-tunnel -- https://random-words.trycloudflare.com
```

After registration, iPhone can keep using the stable Worker URL:

```text
https://focusorange-sync-router.august20050716.workers.dev
```

Quick Tunnel trade-offs:

- No custom domain is required.
- No `cloudflared tunnel login` or `cert.pem` is required.
- The URL is temporary and changes when the tunnel restarts.
- The Worker URL is stable. With `npm run sync:desktop`, registration is automatic; with manual `sync:quick-tunnel`, re-register when the underlying Quick Tunnel URL changes.
- This is appropriate for personal testing and light personal use, not a stable public service.

## 3B. Custom Domain: Create a Named Tunnel

Authenticate `cloudflared` if needed:

```bash
cloudflared tunnel login
```

Create the tunnel:

```bash
cloudflared tunnel create focusorange-sync
```

Copy `docs/cloudflare/focusorange-tunnel.example.yml` to your Cloudflare config directory and replace placeholders:

```bash
cp docs/cloudflare/focusorange-tunnel.example.yml ~/.cloudflared/focusorange-tunnel.yml
```

Route a hostname to the tunnel:

```bash
cloudflared tunnel route dns focusorange-sync focusorange-sync.example.com
```

Run the tunnel:

```bash
cloudflared tunnel --config ~/.cloudflared/focusorange-tunnel.yml run focusorange-sync
```

## 4. Configure iPhone

Open the Pages site on iPhone and set:

- Mac API URL: `https://focusorange-sync-router.august20050716.workers.dev`
- Access Token: the same value as `FOCUSORANGE_ROUTER_CLIENT_TOKEN`

After that, new iPhone records are saved locally first and sync back to the Mac when the tunnel is reachable.

## Current Boundary

- Do not expose `127.0.0.1:33687` directly to the internet.
- Cloudflare stores the PWA shell, not the focus records.
- The tunnel hostname exposes the Mac sync API; keep the token private.
- The Mac must be awake and the app/tunnel must be running for sync to complete.
- Quick Tunnel URLs are temporary. If the app-managed tunnel restarts, the app registers the new URL automatically; if you started the tunnel manually, register the new URL with `npm run sync:register-tunnel -- <url>`.
- The Worker stores only the current Quick Tunnel URL in KV. Focus records are proxied through the Worker and remain authoritative on the Mac.
