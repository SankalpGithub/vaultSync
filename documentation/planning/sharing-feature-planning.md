# Resource Sharing and Access Request Planning

## 1. Purpose

Plan a sharing workflow for Organization, Project, Environment, and Secret resources. A user can share a resource and assign a role and permissions, but the recipient must first accept the invitation. Only accepted invitations become effective access grants.

This document is a design and implementation plan. It does not describe completed functionality.

## 2. Goals

- Share organizations, projects, environments, and secrets with individual users or groups where supported later.
- Assign built-in roles or permissions when creating a share.
- Require recipient approval before access is activated.
- Allow recipients to accept or reject pending shares.
- Allow authorized users to update or revoke access.
- Show clear notifications for pending invitations and access changes.
- Enforce server-side authorization on every operation.
- Preserve an audit trail of sharing, approval, rejection, role changes, and revocation.

## 3. Sharing principles

1. **No access before approval:** creating an invitation does not add the recipient to an organization's, project's, environment's, or secret's member list.
2. **Default deny:** no permission is effective unless a valid, accepted, unexpired grant exists or ownership already provides it.
3. **Least privilege:** assign the minimum role or permission required.
4. **Resource-scoped authority:** permissions apply only to the target resource and explicitly inherited descendants.
5. **Server-side enforcement:** UI visibility is never an authorization boundary.
6. **Explicit inherited access:** sharing an organization or project does not silently imply secret-value access unless inheritance is stated and permitted by policy.
7. **Auditable changes:** every invitation and access change records who performed it, when it occurred, and why when relevant.
8. **Self-consistency:** a user must not be able to grant a permission or assign a role that they cannot delegate.

## 4. Supported resources and scopes

| Resource type | Scope identifier | Default inheritance | Notes |
| --- | --- | --- | --- |
| Organization | `organization` | Projects and environments, where permitted by the assigned role | Organization access must not automatically reveal secret values by default. |
| Project | `project` | Child environments, where permitted by the role | Project access does not necessarily include production secrets. |
| Environment | `environment` | Secrets inside that environment | Treat production as requiring an explicit sensitive permission unless an authorized administrator policy states otherwise. |
| Secret | `secret` | None | Secret grants should separate metadata access from secret-value reveal. |

Resource relationships must come from server data and must not be accepted solely from client-provided IDs.

## 5. Roles and permissions

Reuse the permission catalog and built-in role model in [rbac-permissions-planning.md](rbac-permissions-planning.md). Sharing should support:

- Assigning an existing built-in role, such as Viewer, Contributor, or Admin.
- Assigning one or more explicit permissions for a more limited or custom role.
- Assigning no permissions when the purpose is only discovery, if discovery is a product requirement.
- Saving custom role assignments only when custom roles are part of the target design and are already implemented.

Recommended permission categories:

- `organization:*`, `project:*`, and `environment:*` for resource metadata and lifecycle actions.
- `organization:members:*`, `project:members:*`, and related permissions for sharing administration.
- `secret:list`, `secret:read`, and `secret:value:read` for secret metadata and values.
- `secret:create`, `secret:update`, `secret:delete`, `secret:version:*`, and rotation permissions for secret mutations.

Secret-value reveal should require a separate permission in addition to metadata read permission. Sensitive environment access, such as production, should additionally require an environment-specific grant.

### Permission precedence

Effective access is the union of:

1. Ownership or owner privileges.
2. All accepted, active, and unexpired assignments.
3. Applicable inherited grants allowed by the resource policy.

Rejected, pending, revoked, expired, deleted, and superseded assignments must not contribute permissions. Introduce no deny rule unless a later policy RFC explicitly defines precedence.

## 6. Domain model proposal

The exact Mongoose schemas must be chosen with migrations and indexes in mind. The following collections are proposed.

### 6.1 Access grants

Store the accepted, effective access relationship in an access-grant collection.

Suggested fields:

- `userId`
- `resourceType`: `organization`, `project`, `environment`, or `secret`
- `resourceId`
- `roleId`, if assigned through a role
- `permissions`, if explicit permissions are stored separately from a role
- `grantedBy`
- `status`: `active` or `revoked`
- `acceptedAt`
- `expiresAt`, optional
- `revokedAt`, optional
- `revokedBy`, optional
- timestamps

Do not store effective access by placing users only in existing `members` arrays. Accepted grants are preferable because they preserve scope, source, role, status, and revocation history. Existing `ownerId` and `members` fields may remain for backward compatibility initially, but authorization should not depend on duplicate arrays.

Recommended uniqueness constraint: active grants should be unique per user, resource, role, and source/invitation; alternatively model one grant per user/resource containing role and permission assignments. The chosen uniqueness strategy should prevent duplicate pending and active records.

### 6.2 Share invitations

An invitation is a request and is not effective access.

Suggested fields:

- `recipientId`
- `resourceType`
- `resourceId`
- `roleId`, optional
- `permissions`, optional
- `message`, optional
- `invitedBy`
- `status`: `pending`, `accepted`, `rejected`, `revoked`, `expired`, or `cancelled`
- `tokenVersion` or secure opaque invitation token, where email access is supported
- `expiresAt`
- `respondedAt`
- `respondedBy`
- `rejectionReason`, optional
- timestamps

If sharing by email to a user who does not yet exist is required, store a normalized email and account-binding state separately. The invitation must be claimed by the correct verified account and must not activate until identity binding is complete.

### 6.3 Notifications

Suggested fields:

- `recipientId`
- `type`: `share_pending`, `share_accepted`, `share_rejected`, `share_revoked`, `share_updated`, or related event
- `resourceType`
- `resourceId`
- `invitationId`, optional
- `grantId`, optional
- `actorId`
- `message`
- `readAt`, nullable
- timestamps

Notifications must be generated by the backend sharing service and must not be inferred only in the frontend.

### 6.4 Audit events

Log important lifecycle events:

- share created or resent
- invitation accepted or rejected
- invitation revoked or expired
- grant created
- role or permission changed
- grant revoked
- direct access removed from legacy member arrays
- authorization denial for sensitive actions

Audit entries should include actor, recipient, resource, action, previous and new values, invitation ID, grant ID, timestamp, correlation ID, IP address, and user agent where privacy policy permits. Never record secret values or encryption keys.

## 7. Invitation lifecycle

### 7.1 Create a share

1. Validate authentication and `share:create` or resource-specific delegation permission.
2. Validate that the resource exists and is accessible to the sharer.
3. Validate recipient existence unless email invitation is explicitly supported.
4. Prevent sharing with the resource owner where the resulting invitation has no purpose.
5. Validate the role and each permission against the resource scope.
6. Verify that the sharer can delegate every requested permission.
7. Create an invitation with `pending` status.
8. Generate a notification for the recipient.
9. Send optional email notification without using email delivery as the acceptance boundary.
10. Return the pending invitation to authorized UI clients and emit an audit event.

Creating or resending a pending share must not change the recipient's effective access.

### 7.2 Recipient approves

1. Recipient opens the pending invitation.
2. Recipient can view resource type, name, inviter, requested role, permissions, message, expiration, and current resource relationship.
3. The backend verifies ownership of the invitation and `pending` status.
4. The backend atomically changes the invitation to `accepted` and creates an active access grant.
5. Notifications are created for both recipient and inviter if desired.
6. Add the user to any legacy member array only through a synchronized compatibility migration, never directly on invitation creation.
7. Audit the acceptance.

Acceptance and grant creation should be atomic or compensated so an invitation cannot appear accepted without effective access or vice versa.

### 7.3 Recipient rejects

1. The backend verifies that the recipient owns the invitation and that it is still pending.
2. The invitation changes to `rejected`.
3. No access grant is created and no member array entry is added.
4. Notify the inviter according to configured UX.
5. Audit the rejection, with an optional free-text reason.

A rejected invitation should remain visible in invitation history for an appropriate retention period.

### 7.4 Revocation

1. An authorized owner, administrator, or eligible grant manager requests revocation.
2. The backend verifies delegation authority and records the affected user and grant.
3. The active grant changes to `revoked` and its effective authorization is disabled immediately.
4. Remove the recipient from legacy `members` arrays if that array is the only compatibility representation.
5. Notify the recipient if policy requires it.
6. Audit the revocation.
7. Invalidate relevant cached authorization decisions.

The recipient may lose access even if an invitation remains accepted historically. Accepted and revoked are separate states.

### 7.5 Cancellation, expiry, and updates

- A pending invitation may be cancelled by an authorized sharer.
- Expired pending invitations change to `expired` through a scheduled job or on first access.
- A pending share may be updated only with the recipient's new approval, unless the change is limited to metadata or expiration.
- Existing active access may be updated directly when authorized, without requiring re-approval, unless sensitive permissions are added. Sensitive permission additions should either require the user's approval again or follow a dedicated elevated access policy.
- Rejected invitations may be re-offered after a separate explicit reshare action, unless policy suppresses repeat invitations.

## 8. API planning

Use REST endpoints consistent with the existing backend. The exact route names may follow the project's convention and should be documented before implementation.

### Sharing and invitation administration

- `POST /sharing/invitations`: create a pending invitation.
- `GET /sharing/invitations/received?status=pending`: list invitations received by the caller.
- `GET /sharing/invitations/sent?status=pending`: list invitations created by the caller or organization scope.
- `POST /sharing/invitations/:id/accept`: accept and create effective grant atomically.
- `POST /sharing/invitations/:id/reject`: reject and retain the audit history.
- `POST /sharing/invitations/:id/cancel`: cancel a pending invitation.
- `POST /sharing/invitations/:id/resend`: resend a pending or expired invitation if policy permits.

### Effective grants

- `GET /sharing/grants?resourceType=&resourceId=`: list active grants; requires grant-read permission.
- `PATCH /sharing/grants/:grantId`: change role, permissions, or expiry.
- `POST /sharing/grants/:grantId/revoke`: revoke effective access.
- `GET /sharing/resources/access`: list accepted resources exposed to the caller.

### Notifications

- `GET /notifications?status=unread`
- `PATCH /notifications/:id/read`
- `POST /notifications/read-all`

All response bodies should provide machine-readable IDs, status, role, permissions, timestamps, and appropriate resource metadata. Error responses should not disclose resource existence, membership, email existence, or role details to unauthorized callers.

## 9. Authorization checks

Implement authorization as a service, rather than duplicating checks across controllers. Before a sharing action, the service must:

1. Resolve ownership and all accepted grants for the requester.
2. Check the exact resource-level permission required for the action.
3. Verify that the requested role is assignable at that scope.
4. Verify that every requested permission is delegable by the requester.
5. Re-evaluate access after environment, project, organization, and secret hierarchy resolution.
6. Prevent self-approved sharing and self-approved privilege escalation unless explicitly permitted through owner workflows.
7. Apply resource status, visibility, deletion, suspension, expiry, and production constraints.
8. Use transactions or comparison-and-update operations to prevent race conditions.

Authoritative permission decisions belong in the backend. Frontend hiding of controls is not security.

## 10. Frontend planning

### Sharing UI

Create a reusable sharing dialog containing:

- resource name and resource type
- user search or recipient selection
- role selector
- optional custom permission selection
- optional personal message
- expiration
- preview of permissions being requested
- confirmation of recipient approval requirement

Display separate views for:

- pending received invitations
- sent invitations
- accepted access
- rejected, cancelled, and revoked history

### Invitation UX

The recipient-facing invitation should show:

- inviter and organization/project context
- resource being shared
- requested role and its permission summary
- expiration or required-action date
- Accept and Reject actions
- optional rejection reason

After acceptance, add the resource only to the user's accessible-resource views and navigation. Do not pre-populate those views solely when an invitation is pending.

After rejection or revocation, remove the resource from active navigation and explain the new access state without exposing sensitive details.

### Notifications

Add notification badges or inbox entries for new invitations and status changes. Pending actions should be handled through a dedicated API and should not be represented only as frontend toast messages.

## 11. Security and privacy

- Verify recipient identity and prevent accepting another user's invitation.
- Use opaque, single-purpose invitation tokens when email links are used.
- Bind external invitations to the correct account and verified email.
- Rate-limit share creation, resend, and acceptance endpoints.
- Require confirmation for sharing production secrets and other sensitive resources.
- Add CSRF and CORS protection appropriate to the existing authentication approach.
- Revoke cached grants immediately after revocation; never trust long-lived client claims containing permissions without server verification.
- Prevent ID enumeration and avoid returning private resource names to unauthorized users.
- Encrypt sensitive invitation and message data according to existing product policies.
- Apply access checks when downloading, revealing, exporting, copying, or rotating secret values.
- Preserve audit logs and avoid logging personal messages, secret values, encryption keys, or decrypted data.

## 12. Compatibility and migration

Existing `members` arrays are currently present on organizations and projects. During implementation:

1. Introduce sharing models and services without changing existing ownership behavior.
2. Backfill only known direct members with an appropriate migration status and explicit source label.
3. Do not silently convert owner or legacy membership into broad secret-value permissions.
4. Change authorization checks to prefer active grants, while retaining a temporary, auditable compatibility path.
5. Add consistency checks that compare grants with legacy arrays.
6. Remove or deprecate duplicate member-array authorization only after all consumers are migrated and tested.
7. Provide rollback scripts or feature flags for phased deployment.

## 13. Implementation phases

### Phase 1: Foundation

- Finalize permission and scope catalog.
- Add sharing, grant, notification, and audit models.
- Add database indexes and constraints.
- Add server-side authorization service primitives.
- Add unit tests for scope and inheritance behavior.

Deliverable: invitations can be stored but no UI or effective access is yet exposed.

### Phase 2: Invitation workflow

- Implement create, list, cancel, expire, accept, and reject APIs.
- Add atomic accepted-grant creation.
- Create backend notifications.
- Add integration tests for lifecycle transitions.

Deliverable: approved invitations create access, rejected invitations do not.

### Phase 3: Resource sharing and effective access

- Add organization, project, environment, and secret sharing routes.
- Integrate all applicable resource controllers with centralized authorization.
- Add active grant listing, update, and revoke APIs.
- Enforce inherited permissions and secret-value restrictions.

Deliverable: all supported resources use effective grants consistently.

### Phase 4: User interface

- Add sharing dialogs and permission previews.
- Add received and sent invitation views.
- Add notification inbox and unread counts.
- Add accepted resource navigation behavior.
- Add revoke and role-update workflows.

Deliverable: users can share and respond without direct API use.

### Phase 5: Hardening and migration

- Add legacy member migration and consistency jobs.
- Add email delivery and invitation binding if required.
- Add cache invalidation, sensitive-action confirmation, rate limiting, and audit reports.
- Remove deprecated authorization paths.

Deliverable: production-ready rollout with monitoring and rollback support.

## 14. Testing plan

### Unit tests

- Role and permission expansion.
- Scope inheritance and deny by default.
- Permission delegation checks.
- Invitation state transition rules.
- Expiry and revocation calculations.
- Email normalization and recipient identity checks.

### Integration tests

- Pending invitation creates no access grant.
- Accepted invitation creates exactly one active grant.
- Rejected invitation creates no grant and cannot be accepted later.
- Revoked grant immediately blocks resource access.
- Updating a grant changes effective permissions without duplicating grants.
- Reshare or reuse cannot create duplicate active grants.
- Concurrent acceptance or cancellation produces one valid terminal state.
- Recipient cannot accept another user's invitation.
- Sharer cannot assign un-delegable permissions.
- Organization or project inheritance does not expose secret values without the correct permission.

### API and security tests

- Unauthorized sharing is denied.
- Sensitive resources are not disclosed in error responses.
- Endpoint authorization is checked independently of frontend state.
- Expired invitations cannot be accepted.
- Cached grants cannot survive revocation.
- Endpoint rate limits are enforced.
- Audit records contain IDs and actions but never secrets or decrypted values.

### Frontend tests

- Pending and received invitations display correctly.
- Accepted resources appear only after successful acceptance.
- Rejected, revoked, and cancelled resources disappear from active views.
- Notification count changes after read and acceptance operations.
- Share permission preview matches the role actually assigned by the server.

## 15. Acceptance criteria

The sharing feature is complete only when:

1. A pending invitation does not grant any effective access.
2. A recipient can accept or reject a pending invitation.
3. Accepting creates one effective, auditable grant.
4. Rejecting creates no grant and leaves the resource inaccessible.
5. Owners or delegated managers can update and revoke access.
6. Revocation is effective immediately across API operations.
7. Users can share each supported resource type with a role and explicit permissions.
8. All authorization decisions are enforced server-side.
9. Sensitive secret values remain protected by their own permissions.
10. Notifications and audit records are emitted for the complete lifecycle.
11. No stale member-array data or authorization cache can grant removed access.
12. Relevant unit, integration, API, security, and frontend tests pass.

## 16. Suggested implementation order

1. Centralized RBAC and resource-scope helpers.
2. Invitation and access-grant models.
3. Backend sharing service and atomic state transitions.
4. Notification and audit integration.
5. Organization and project sharing routes.
6. Environment and secret sharing routes.
7. Frontend sharing dialogs, invitation inbox, and notification UI.
8. Legacy migration, production verification, and cleanup.

This order keeps unauthorized resource access from entering the system while the workflow and UI are completed incrementally.
