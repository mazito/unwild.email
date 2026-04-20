# Auth model (stub)

> Status: **draft stub**. Spun out of `docs/EMAILS-BASE-MODEL.md` §2.1.
> Details to be fleshed out in a dedicated session.

## Scope

Authentication and session management for **app/server users** — the
humans who log into the Unwild UI. Not to be confused with email
`accounts` (IMAP/JMAP/Gmail-API/Graph credentials), which are covered in
`EMAILS-BASE-MODEL.md` §2.2.

## Core principle

App login identity ≠ email address.

A user may own 0..N email accounts (`accounts.user_uid`). Conflating the
app login with one of those email addresses would:

- Break if the user removes/rotates that email account.
- Force a chicken-and-egg on OTP-by-email (can't read mail until logged
  in, can't log in without the OTP).
- Leak which email address is "the primary" one outside the user's
  control.

So: login handle is a **username**, stored on `users.username UNIQUE`.

## Proposed fields on `users`

See `EMAILS-BASE-MODEL.md` §2.1 for the current shape. Summary:

| Column | Purpose |
|---|---|
| `username` | Login handle. `UNIQUE`, case-insensitive. |
| `display_name` | Shown in the UI. |
| `login_email` | Optional. Recovery only. Not unique, not auth. |
| `password_hash` | argon2id. |
| `totp_secret` | Optional. Base32 secret for TOTP 2FA. |

## Proposed flows

### Primary: username + password
1. User submits `(username, password)`.
2. Server verifies `password_hash` with argon2id.
3. On success, issue a session token (HTTP-only cookie, server-side
   session record).

### Optional 2FA: TOTP (RFC 6238)
1. Enabled per-user by storing `totp_secret`.
2. After password step, prompt for 6-digit TOTP code from authenticator
   app (Aegis, 1Password, Authy, Google Authenticator, …).
3. Self-hosted friendly: no external dependency, no email round-trip.

### Recovery: `login_email`
1. Optional. User may set a non-account email for recovery.
2. Email OTP used **only** for password reset, not primary auth.
3. If not set, recovery requires server-side operator action (acceptable
   for a small-office/family self-host).

## Out of scope for v1

- OAuth / OIDC federation.
- WebAuthn / passkeys (worth a follow-up — great fit for self-hosted).
- Multi-tenant org/role model beyond simple `is_admin` per user.
- Session revocation UI.

## Open questions

1. Session storage: LMDB (next to sync state) vs DuckDB table vs
   signed-cookie stateless? Lean: server-side in LMDB for revocability.
2. Rate-limiting / lockout thresholds on failed password attempts.
3. First-run bootstrap: how does the first admin user get created? CLI
   command on first `bun run dev:server`? Env var? Interactive prompt?
4. Password rotation policy (probably none — NIST 800-63B says don't
   force periodic rotation).
5. Admin role: boolean `is_admin` on `users` vs separate `roles` table?
   Small-office context suggests a boolean is enough.

## Next steps

- [ ] Decide session storage backend.
- [ ] Spec first-run bootstrap.
- [ ] Add `is_admin` decision to `users` schema.
- [ ] Flesh out argon2id parameters (memory cost, iterations).
- [ ] Decide if WebAuthn is worth v1.
