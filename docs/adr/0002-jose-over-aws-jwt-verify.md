# Verify JWTs with jose, not aws-jwt-verify

Server-side token verification uses `jose`, with the JWKS fetch and cache and every claim check (`iss`, `aud` / `client_id`, `token_use`, `exp`, `scope`) written by hand. `aws-jwt-verify` does all of this out of the box and is the obvious choice, but it would hide exactly the checks this project exists to learn.
