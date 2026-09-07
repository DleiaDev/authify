# Project Plan

> One of the two planning docs you provide. Use as much detail as the project
> needs, including rationale, constraints, examples, edge cases, and explicit
> exclusions that should guide later feature work. Draft it directly, develop it
> through any AI conversation, or optionally run `/discovery` for a guided deep
> planning session. The content is always yours to direct. When it is filled in,
> run `/overview` to generate the project overview from this plus `build-plan.md`.

## 1. Problem - What problem are we solving?

The main purpose of this project is to implement UI that calls AWS Cognito API in order to get familliar with all the features Cognito offers.

## 2. Users - Who is this for?

Not intended for commercial use. But it needs to support both public and admin flows.

## 3. Features - What does the MVP need?

Sign Up & Email Verification: Build a registration form collecting standard attributes (Email, Name) and custom attributes (e.g., custom:role). Trigger Cognito’s native OTP email confirmation flow.

Sign In & Session Storage: Implement standard password login returning standard OIDC tokens (id_token, access_token, refresh_token).

Token Storage Strategy: Store tokens in httpOnly secure cookies via Next.js Middleware or Server Actions to handle SSR/CSR auth state smoothly.

Self-Service Forgot/Reset Password: Build the ForgotPassword and ConfirmForgotPassword workflow using email-delivered challenge codes.

Admin-Initiated Force Password Change: Create a test scenario handling the NEW_PASSWORD_REQUIRED challenge state (typically when an admin creates a user manually in the AWS Console).

Multi-Factor Authentication (MFA) - Time-Based One-Time Password (TOTP): Implement a profile screen feature where users can enable TOTP. Generate a QR code using Cognito's secret key output (AssociateSoftwareToken API) and verify the setup with an authenticator app code.

User Pool Groups: Create two groups in Cognito (e.g., Admins, Users).
Next.js Route Protection: Decode the JWT access_token or id_token in Next.js Middleware (middleware.ts). Restrict access to /admin routes based on the cognito:groups array inside the token payload.

Do Server-Side JWT Verification, a utility created with aws-jwt-verify or jose to download Cognito's JSON Web Key Set (JWKS) and validate the JWT signature, issuer (iss), audience (client_id), and token expiration (exp) before returning data.

Federated AWS Access (Cognito Identity Pool) - Exchange the User Pool id_token via an Identity Pool (GetCredentialsForIdentity API) to acquire temporary IAM credentials (AccessKeyId, SecretKey, SessionToken). Direct Client-to-S3 Upload: Use the temporary IAM credentials in the browser to upload an avatar or document directly to a private Amazon S3 bucket path scoped to the user's Cognito Identity ID (/s3-bucket/${cognito-identity-id}/\*).

Phase 1 Registration & Login User Pools, App Clients, OTP Verification, Tokens
Phase 2 Next.js Middleware Protection Token Decoding, Expiration Checking, Refresh Token Flow
Phase 3 MFA & Account Recovery Authentication Challenges, TOTP Setup, Password Lifecycle
Phase 4 Protected Server API JWKS Validation, Custom Claims, cognito:groups RBAC
Phase 5 S3 Profile Upload Identity Pools, Federated Identities, IAM Roles & Policies

These phases are just rough ideas, please feel free to modify anything if there are some concerns or something doesn't make sense.

## 4. Data - What are we storing?

Don't have exact entities now, you should infer it from features above.

## 5. Tech - What stack are we using?

Next.js, Shadcn UI, MongoDB for storage, Terragrunt for AWS, Docker for local development.

There should be Next.js container and mongodb container. Project containers should be runnable with docker compose.

Regarding communicaiton with Cognito's API, I don't want to use any SDK, I want to call API directly and kind of implement my own SDK so I know what Cognito clients are doing behind the scenes.

This project is using TypeScript only, types should be clearly defined, grouped and reused across the project.

## 6. Monetize - How will this make money?

Not for commercial use.

## 7. UI/UX - How should this look and feel?

I want the UI to be modern, built with Shadcn components and with the color scheme already defined in globals.css.

## 8. Deployment - Where and how will this ship?

Target host is AWS ECS but there is no plan for running this in production since it's for learning purposes only. I'll probably add prod deployment later with full CI/CD, but it's unnecessary detour for now.
