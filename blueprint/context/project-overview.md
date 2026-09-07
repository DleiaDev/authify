# authify - Project Overview

<!-- blueprint:source-hash 9e5c673a6669b6abb038531bee3fb2eaba8457b9f86cbbe383bb09249d2bbaa7 -->

> A hands-on AWS Cognito playground: a modern Next.js UI that drives the full
> Cognito API surface through a hand-rolled HTTP client (no AWS SDK).

## Problem

The goal is to learn AWS Cognito end to end by building the UI and server code
that calls every meaningful part of its API. Rather than leaning on Amplify or
`@aws-sdk`, the project implements its own thin client so the request shapes,
challenge state machine, token handling, and signing are all visible and
understood. It is a learning project, not a commercial product.

## Users

Not for commercial use. Two roles exercised by the same app:

- **Public user** - signs up, confirms email, signs in, manages their own
  password, MFA, profile, and account.
- **Admin** - member of the `Admins` group; manages other users and groups from
  a protected `/admin` area.

## Features

In `build-plan.md` order, grouped by milestone. Headline: the **custom Cognito
HTTP client** (item 3) that every later feature calls through.

**M0 - Foundations**
1. **Local dev environment** - docker compose runs Next.js + MongoDB.
2. **Cognito core infrastructure (Terragrunt)** - user pool, confidential app
   client, `Admins`/`Users` groups, auth flows.
3. **Cognito HTTP client** - hand-rolled `cognito-idp` JSON caller with
   `SECRET_HASH`, error parsing, and request/response logging.

**M1 - Registration & login**
4. **Sign up** - `SignUp` with email + name, pending-confirmation state.
5. **Email OTP confirmation** - `ConfirmSignUp` + `ResendConfirmationCode`.
6. **Password sign in** - `InitiateAuth` (USER_PASSWORD_AUTH) -> token set.
7. **Server-side session** - tokens in httpOnly secure cookies; sign-out via
   `RevokeToken` / `GlobalSignOut`.
8. **App user record (MongoDB)** - create/link a Mongo doc keyed by Cognito
   `sub` on first sign-in.
9. **Auth-aware UI shell** - session-aware header, public vs protected layout.

**M2 - Session middleware & route protection**
10. **Middleware token check** - `middleware.ts` decodes claims, enforces `exp`.
11. **Refresh token flow** - `InitiateAuth` REFRESH_TOKEN_AUTH; failure -> sign
    out.
12. **Group-based route gating** - `/admin` gated by `cognito:groups`.

**M3 - Password lifecycle & recovery**
13. **Forgot / reset password** - `ForgotPassword` + `ConfirmForgotPassword`.
14. **Change password while signed in** - `ChangePassword`.
15. **NEW_PASSWORD_REQUIRED challenge** - first-login password set via
    `RespondToAuthChallenge`.

**M4 - MFA (TOTP)**
16. **Enable TOTP** - `AssociateSoftwareToken`, QR, `VerifySoftwareToken`,
    `SetUserMFAPreference`.
17. **TOTP login challenge** - handle `SOFTWARE_TOKEN_MFA` in sign-in.
18. **Manage / disable MFA** - status + turn-off in settings.

**M5 - Profile & account settings**
19. **Cognito attribute management** - `GetUser`, `UpdateUserAttributes`,
    `GetUserAttributeVerificationCode` + `VerifyUserAttribute`.
20. **Extended profile (MongoDB)** - nickname, age, date of birth, hobbies.
21. **Account settings (MongoDB)** - preferred auth strategy + app prefs.
22. **SRP sign-in** - SRP handshake (`SRP_A` -> `PASSWORD_VERIFIER`); used when
    the user's stored strategy is SRP, resolved by email before auth.
23. **Delete own account** - `DeleteUser` + remove Mongo record.

**M6 - Protected server API & token verification**
24. **JWKS verification utility** - verify signature, `iss`, `token_use`, `exp`,
    `aud` / `client_id`.
25. **Protected API route** - sample endpoint requiring a valid access token,
    with `cognito:groups` RBAC.
26. **Machine-to-machine (client credentials)** - Cognito domain, resource
    server + scopes, M2M client (Terragrunt); `POST /oauth2/token` then call the
    protected API; verify `scope`.

**M7 - Admin console**
27. **SigV4 request signer** - sign `Admin*` and `cognito-identity` calls;
    public `cognito-idp` calls stay unsigned.
28. **Admin: user list & detail** - `ListUsers`, `AdminGetUser`.
29. **Admin: create user** - `AdminCreateUser` (drives item 15).
30. **Admin: user lifecycle** - `AdminEnableUser` / `AdminDisableUser` /
    `AdminDeleteUser`, `AdminSetUserPassword`.
31. **Admin: group management** - `CreateGroup` / `ListGroups`,
    `AdminAddUserToGroup` / `AdminRemoveUserFromGroup`,
    `AdminListGroupsForUser`.

**M8 - Federated AWS access & S3 upload**
32. **Identity Pool infrastructure (Terragrunt)** - identity pool, authenticated
    IAM role, per-identity S3 prefix policy.
33. **Exchange tokens for IAM credentials** - `GetId` +
    `GetCredentialsForIdentity` (SigV4-signed).
34. **Direct browser-to-S3 upload** - temp credentials PUT an avatar to the
    user's `identity-id/` prefix; store object metadata in Mongo.

**M9 - Coverage sweep (optional)**
35. **Remaining API surface** - device tracking, SMS MFA variants, custom schema
    attributes, `DescribeUserPool` / `GetUserPoolMfaConfig`,
    `AdminUserGlobalSignOut`, token-revocation edge cases.

## Data model

The app stores almost nothing itself; **Cognito is the system of record** for
identity. MongoDB holds one companion document per Cognito user.

### User (MongoDB `users`)

- `_id` (ObjectId)
- `cognitoSub` (string, unique) - Cognito user pool `sub`; the join key every
  feature relies on. **Locked.**
- `email` (string) - mirrored from Cognito so the login screen can resolve
  `authStrategy` before authenticating (needed for SRP, item 22)
- `authStrategy` (`"USER_PASSWORD_AUTH"` | `"USER_SRP_AUTH"`, default
  `"USER_PASSWORD_AUTH"`) - which sign-in flow this user uses (item 21)
- `profile` (object, item 20)
  - `nickname` (string, optional)
  - `age` (number, optional)
  - `dateOfBirth` (string, ISO date, optional)
  - `hobbies` (string[], optional)
- `avatar` (object, optional, item 34)
  - `bucket` (string), `key` (string, `<identityId>/...`),
    `contentType` (string), `size` (number), `uploadedAt` (Date)
- `createdAt` (Date), `updatedAt` (Date)

> `cognitoSub` uniqueness and its role as the link key are locked; later
> features (profile, settings, avatar) all query by it.

### External state (AWS, provisioned via Terragrunt)

- **User pool user** - standard attributes (`email`, `name`, `email_verified`),
  MFA config, group membership
- **Groups** - `Admins`, `Users` (`cognito:groups` claim drives RBAC)
- **App clients** - confidential web client (secret, `SECRET_HASH`); separate M2M
  client for `client_credentials`
- **Resource server + custom scopes** - target of M2M access tokens (item 26)
- **Identity pool** - maps a user-pool token to an `identityId` and temporary IAM
  credentials (items 32-33)
- **S3 bucket** - private, objects under `<identityId>/` prefixes (item 34)
- **Cognito API call log** - every request/response from the custom client;
  persistence medium not yet decided (`> TODO`: MongoDB collection vs in-memory
  vs server logs)

## Tech stack

- **Next.js** (App Router, RSC, `middleware.ts`) - UI, server-side Cognito calls,
  cookie session
- **TypeScript** - the only language; types clearly defined, grouped, and reused
  across the project
- **shadcn/ui + Tailwind v4** - components and styling; violet-forward theme with
  light/dark already defined in `app/globals.css`
- **MongoDB** - the `users` companion collection (profile, auth settings, avatar
  metadata); runs as a container
- **Custom Cognito client** - hand-rolled calls to `cognito-idp`,
  `cognito-identity`, and the OAuth2 token endpoint, plus a SigV4 signer and
  `SECRET_HASH` helper; **no AWS SDK / Amplify**
- **Terragrunt** - provisions all AWS resources listed under External state
- **Docker + Docker Compose** - local dev: Next.js container + MongoDB container,
  `docker compose up`
- **JWT verification library** - `jose` or `aws-jwt-verify` (`> TODO`: pick one)

## Monetization

Not applicable. Learning project, not for commercial use.

## UI/UX

Modern, built from shadcn/ui components, using the existing `globals.css` theme
(violet primary, neutral surfaces, light + dark). Indicative routes (firmed up
per `/feature`):

- `/` - auth-aware landing
- `/signup`, `/confirm` - registration and email OTP
- `/login` - password or SRP sign-in, plus challenge screens
  (`NEW_PASSWORD_REQUIRED`, `SOFTWARE_TOKEN_MFA`)
- `/forgot-password` - request and confirm a reset
- `/profile` - Cognito attributes, extended profile, avatar upload
- `/settings` - change password, MFA management, auth-strategy toggle, delete
  account
- `/admin` - group-gated console: user list/detail, create, lifecycle, groups
- `/api-log` - inspector for logged Cognito requests/responses
- `/api/protected` - sample protected route handler (user token and M2M token)

## Deployment

Eventual target is **AWS ECS** (container image), but there is **no production
deployment in this phase** and no CI/CD yet - explicitly deferred.

- **Local**: `docker compose up` (Next.js + MongoDB)
- **Runtime needs**: MongoDB connection; AWS credentials or task role for
  `Admin*` and `cognito-identity` SigV4 calls
- **Env vars (by name, indicative)**: `AWS_REGION`, `COGNITO_USER_POOL_ID`,
  `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET`, `COGNITO_M2M_CLIENT_ID`,
  `COGNITO_M2M_CLIENT_SECRET`, `COGNITO_DOMAIN`, `COGNITO_IDENTITY_POOL_ID`,
  `S3_BUCKET`, `MONGODB_URI`
- `> TODO`: exact ECS service shape, build/start commands for the image, health
  check path, domain

## Open questions

Contradictions and gaps between `project-plan.md` and `build-plan.md` - resolve
in the plans, then re-run `/overview`:

1. **`custom:role` custom attribute** - `project-plan.md` §3 still says sign-up
   collects `custom:role`. The build plan dropped custom attributes from sign-up;
   RBAC is `cognito:groups` only, and custom schema attributes are now just an
   optional item (35). Update §3 or re-add a custom-attribute feature.
2. **Data section is unspecified** - `project-plan.md` §4 says "infer from
   features". The `User` model above is derived from build items 8, 20, 21, 34;
   fold it back into §4 if you want it authoritative.
3. **JWT verification library** - `project-plan.md` §5 lists "aws-jwt-verify or
   jose"; not chosen. Item 24 needs one.
4. **SRP and machine-to-machine scope** - build items 21-22 (SRP toggle) and 26
   (client credentials) came from the discovery conversation and are not in
   `project-plan.md` §3. Add them to §3 so the plan matches the roadmap.
5. **API call log persistence** - the custom client logs every call (item 3),
   but where it is stored is undecided (MongoDB collection vs memory vs logs).
6. **Foundational items 1-3** are setup-flavored rather than user-visible, but
   kept because they are substantive deliverables central to the learning goal.
