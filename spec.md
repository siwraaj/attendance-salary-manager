# Attendance & Salary Manager

## Current State

Full-stack app with:
- Contracts, Labours, Attendance, Advances, Payments, Settled tabs
- Admin/Guest login via Internet Identity
- Single admin locked to first II principal that registered with CAFFEINE_ADMIN_TOKEN
- Backend uses authorization mixin with `_initializeAccessControlWithSecret` for first-time admin setup
- All write operations gated to admin role

## Requested Changes (Diff)

### Add
- `resetAdmin(token)` backend function: accepts the CAFFEINE_ADMIN_TOKEN, clears the existing admin principal, and assigns the caller as the new admin. This allows recovery when the original admin Internet Identity is lost.
- Frontend "Reset Admin" option on the login/sign-in screen: a collapsible "Lost admin access?" link that reveals a text field for the admin token and a "Claim Admin" button. When submitted, calls `resetAdmin` after the user has signed in with Internet Identity.

### Modify
- `access-control.mo`: add resetAdmin logic that removes all existing #admin role entries and assigns the new caller as admin, validating against CAFFEINE_ADMIN_TOKEN.
- `MixinAuthorization.mo`: expose `resetAdmin` as a public shared function.
- Login screen: add "Lost admin access?" recovery section below the normal sign-in button.

### Remove
- Nothing removed.

## Implementation Plan

1. In `access-control.mo`, add `resetAdmin(state, caller, adminToken, userProvidedToken)` that:
   - Traps if caller is anonymous
   - Traps if userProvidedToken != adminToken
   - Iterates userRoles map, removes all entries with role #admin
   - Adds caller with role #admin
   - Sets adminAssigned = true
2. In `MixinAuthorization.mo`, expose `public shared ({ caller }) func resetAdmin(userSecret : Text) : async ()` that reads CAFFEINE_ADMIN_TOKEN from env and calls AccessControl.resetAdmin.
3. Update frontend login screen to add a "Lost admin access?" collapsible section:
   - User must first sign in with their new Internet Identity
   - Then enter the admin token in a text field
   - Click "Claim Admin" which calls resetAdmin(token)
   - On success, reload role and enter the app as admin
