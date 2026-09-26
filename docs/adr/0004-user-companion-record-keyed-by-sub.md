# Cognito is the system of record; MongoDB holds a User Companion Record keyed by sub

Identity (credentials, standard attributes, MFA, groups) lives only in Cognito. Everything Cognito does not store (extended profile, Auth Strategy, avatar metadata) lives in one MongoDB User Companion Record per User, created on first sign-in and linked by the User's `sub`, which is unique and never changes. Email is mirrored onto the record only so it can be looked up before authentication (see ADR 0005). Every feature that reads or writes the record queries by `sub`.
