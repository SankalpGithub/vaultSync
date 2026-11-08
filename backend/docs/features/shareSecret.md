# Resource Sharing

## Lifecycle

1. `POST /api/v1/share` creates a pending invitation for every registered recipient and emails a secure link.
2. `GET /api/v1/share/invitations/received` lists invitations for the current user.
3. `POST /api/v1/share/invitations/:id/accept` validates recipient ownership and expiry, then creates effective grants.
4. `POST /api/v1/share/invitations/:id/reject` rejects an invitation without creating grants.
5. `POST /api/v1/share/invitations/:id/cancel` lets the sender cancel a pending invitation.
6. `GET /api/v1/share/grants` lists incoming and outgoing grants.
7. `PATCH /api/v1/share/grants/:id` changes role, permissions, or expiry.
8. `POST /api/v1/share/grants/:id/revoke` immediately revokes access.

## Supported scopes

Invitations support organization, project, environment, and secret targets. A grant is created for each selected target. Secret metadata does not imply secret-value access; `secret:value:read` is required to reveal a value. Pending, rejected, cancelled, expired, and revoked records never grant access.

## Authorization rules

- Organization, project, environment, and secret relationships are validated against the database.
- Roles must be built-in RBAC roles and permissions must belong to the permission catalog.
- Recipient identity is verified when an invitation is created and accepted.
- Grants must be active and unexpired.
- Sharers can update only grants they issued.
- Revocation updates every related grant and is enforced immediately by resource and secret services.

## Security

Invitation links contain random tokens that are stored only as SHA-256 hashes. Email recipients must already have VaultSync accounts. Acceptance is restricted to the recipient user ID. No access is effective before acceptance. Sensitive state transitions are audited in MongoDB timestamps.

## Frontend

The Sharing page provides invitation creation, received and sent inboxes, acceptance and rejection actions, active access management, and revoke controls. The workspace navigation contains a direct link to `/share`.
