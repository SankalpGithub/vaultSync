# Role-Based Access Control (RBAC) Planning

## Purpose and status

This document proposes a permission system for assigning capabilities to
individual users through built-in or custom roles. It is a planning document,
not a description of fully implemented authorization.

The current code has organization and project `ownerId`, `members`, and
`visibility` fields, and secret routes use access-token authentication. The
backend now has a typed permission catalog, built-in role bundles, and
scope-aware authorization helpers in `backend/src/authz/rbac.ts`. Persisted
role assignments, custom-role storage, and complete RBAC enforcement across
routes are not yet implemented. Treat every permission below as a candidate
until its behavior is implemented and tested.

## Design principles

1. **Default deny:** a user receives access only through an explicit owner
   grant, role assignment, or documented visibility rule.
2. **Scope grants:** a role is assigned at a defined scope:
   `organization`, `project`, or (where needed) `environment`. Permissions
   apply to that scope and its descendants only when explicitly marked
   inheritable.
3. **Least privilege:** separate viewing metadata from revealing secret
   values; separate editing from deleting; separate role management from
   resource administration.
4. **No implicit privilege escalation:** a user cannot grant permissions they
   do not hold or assign a role with more privilege than their own delegation
   authority.
5. **Server-side enforcement:** check permissions on every API request and
   background operation. Hiding a button in the frontend is not authorization.
6. **Auditable sensitive operations:** log role changes, member changes,
   secret reveal, secret edits, deletion, restore, and production access without
   logging secret values or encryption keys.
7. **Explicit production controls:** production secret access and destructive
   actions can require dedicated permissions, even when the same user has
   broader development or staging access.

## Permission naming and scope

Use stable machine-readable names in the form `resource:action`, for example
`project:create` or `secret:value:read`. Store these identifiers in policy and
code rather than relying on display names such as "Editor".

Suggested scopes:

- **Global:** platform operators only; not normally assignable by customers.
- **Organization:** applies to one organization and, where indicated, its
  projects.
- **Project:** applies to one project.
- **Environment:** applies only to one project environment.

An assignment should record `userId`, `roleId`, `scopeType`, `scopeId`,
granting user, creation time, and optional expiry. A user may have multiple
assignments. Effective permissions are the union of valid grants, restricted
to their scopes. Do not implement deny overrides until their precedence and
administration UX are explicitly designed.

## Permission catalog

The following catalog is intentionally granular. Keep only capabilities that
the product exposes, but avoid combining unrelated high-impact actions.

### Platform and account administration

| Permission | Scope | Capability |
| --- | --- | --- |
| `platform:users:read` | Global | View platform user accounts for support and operations. |
| `platform:users:suspend` | Global | Suspend or reactivate an account. |
| `platform:organizations:read` | Global | View organizations for platform support. |
| `platform:organizations:manage` | Global | Perform exceptional platform-level organization administration. |
| `platform:audit:read` | Global | Read platform-wide audit events. |
| `platform:settings:manage` | Global | Change global platform configuration. |

Global permissions should be reserved for a separately governed operator
function. They are not part of ordinary organization roles.

### Organization lifecycle and configuration

| Permission | Scope | Capability |
| --- | --- | --- |
| `organization:create` | User/global | Create an organization. |
| `organization:read` | Organization | View organization details and settings. |
| `organization:update` | Organization | Change name, description, and ordinary settings. |
| `organization:delete` | Organization | Delete or archive the organization. |
| `organization:restore` | Organization | Restore a deleted organization during its retention period. |
| `organization:transfer_owner` | Organization | Transfer the organization owner. |
| `organization:visibility:manage` | Organization | Change private/internal visibility. |
| `organization:projects:list` | Organization | List projects in the organization. |
| `organization:projects:create` | Organization | Create projects in the organization. |
| `organization:members:list` | Organization | List organization members and their access. |
| `organization:members:invite` | Organization | Invite users to the organization. |
| `organization:members:remove` | Organization | Remove members from the organization. |
| `organization:members:role:read` | Organization | View member role assignments. |
| `organization:members:role:assign` | Organization | Assign or change organization roles. |
| `organization:members:role:revoke` | Organization | Revoke organization role assignments. |
| `organization:roles:list` | Organization | List available built-in and custom roles. |
| `organization:roles:create` | Organization | Create a custom role. |
| `organization:roles:update` | Organization | Change a custom role's name, description, or permissions. |
| `organization:roles:delete` | Organization | Delete a custom role that is no longer assigned. |
| `organization:audit:read` | Organization | Read organization audit events. |

### Project lifecycle and configuration

| Permission | Scope | Capability |
| --- | --- | --- |
| `project:create` | Organization | Create a project in the organization. |
| `project:list` | Organization | List projects the caller is allowed to discover. |
| `project:list_all` | Organization | List every project in the organization, including private projects. |
| `project:read` | Project | View project metadata and settings. |
| `project:update` | Project | Change project name, description, or ordinary settings. |
| `project:delete` | Project | Delete or archive a project. |
| `project:restore` | Project | Restore a deleted project during its retention period. |
| `project:transfer_owner` | Project | Transfer the project owner. |
| `project:visibility:manage` | Project | Change project visibility. |
| `project:members:list` | Project | List project members and their access. |
| `project:members:invite` | Project | Invite a user directly to the project. |
| `project:members:remove` | Project | Remove a direct project member. |
| `project:members:role:read` | Project | View project role assignments. |
| `project:members:role:assign` | Project | Assign a project role. |
| `project:members:role:revoke` | Project | Revoke a project role assignment. |
| `project:audit:read` | Project | Read project audit events. |

`project:list` should return only discoverable projects. `project:list_all` is
an administrative capability and must not silently imply read access to each
project's secrets.

### Environment management

| Permission | Scope | Capability |
| --- | --- | --- |
| `environment:list` | Project | List project environments. |
| `environment:read` | Environment | View environment metadata. |
| `environment:create` | Project | Add a project environment. |
| `environment:rename` | Environment | Rename an environment. |
| `environment:delete` | Environment | Delete an environment, subject to safeguards for non-empty environments. |
| `environment:access:grant` | Project | Grant a user or role access to an environment. |
| `environment:access:revoke` | Project | Revoke an environment-scoped grant. |

Treat environment membership as an additional scope constraint: a project
grant alone need not grant production access.

### Secret metadata and values

| Permission | Scope | Capability |
| --- | --- | --- |
| `secret:list` | Project/environment | List secret metadata the caller can access. |
| `secret:metadata:read` | Project/environment | Read keys, descriptions, environment, and version metadata. |
| `secret:create` | Project/environment | Create a secret. |
| `secret:key:update` | Project/environment | Rename a secret key. |
| `secret:value:update` | Project/environment | Replace a secret value. |
| `secret:metadata:update` | Project/environment | Update descriptions or other non-value metadata. |
| `secret:delete` | Project/environment | Delete a secret. |
| `secret:restore` | Project/environment | Restore a deleted secret during its retention period. |
| `secret:value:read` | Project/environment | Decrypt and reveal a secret value through the API/UI. |
| `secret:value:read:production` | Environment | Decrypt/reveal a value specifically in production. |
| `secret:export` | Project/environment | Bulk export secret values in a controlled format. |
| `secret:share` | Project/environment | Create a time-limited or recipient-limited secret share, if sharing is supported. |
| `secret:version:list` | Project/environment | List secret version metadata. |
| `secret:version:read` | Project/environment | Read a previous secret version's value. |
| `secret:version:restore` | Project/environment | Restore a previous version as the current value. |

`secret:value:read` must be distinct from `secret:metadata:read`. A role that
can list secret names should not automatically be able to decrypt values.
Production access should require the production permission or an equivalent
explicit environment-scoped grant.

### Integration, deployment, and automation

| Permission | Scope | Capability |
| --- | --- | --- |
| `integration:list` | Project | List configured integrations. |
| `integration:read` | Project | View integration configuration, excluding credentials. |
| `integration:create` | Project | Add an integration. |
| `integration:update` | Project | Change integration configuration. |
| `integration:delete` | Project | Remove an integration. |
| `integration:credential:read` | Project/environment | Reveal integration credentials, if supported. |
| `deployment:trigger` | Project/environment | Trigger a deployment or secret sync. |
| `deployment:status:read` | Project/environment | View deployment/sync status. |
| `automation:token:create` | Project | Create an automation token. |
| `automation:token:list` | Project | List automation token metadata. |
| `automation:token:revoke` | Project | Revoke an automation token. |

Do not return integration credentials or automation token material as part of
ordinary read permissions.

### Audit, policy, and billing

| Permission | Scope | Capability |
| --- | --- | --- |
| `audit:read` | Organization/project | Read audit history within scope. |
| `audit:export` | Organization/project | Export audit history. |
| `policy:read` | Organization | View access/security policies. |
| `policy:update` | Organization | Change organization access policies. |
| `billing:read` | Organization | View subscription and usage information. |
| `billing:update` | Organization | Change plan or payment configuration. |

## Proposed built-in roles

Roles are named bundles of permissions. The table below describes recommended
defaults, not restrictions on custom roles. Assign a role at organization,
project, or environment scope; effective permission remains limited to the
assignment scope.

| Role | Intended use | Recommended permissions |
| --- | --- | --- |
| **Owner** | One accountable organization owner. | All organization and descendant project permissions, including member/role administration, deletion, ownership transfer, policy, audit, and billing. Keep platform permissions excluded. Restrict or require confirmation for ownership transfer and destructive actions. |
| **Organization Admin** | Administer organization members, roles, settings, and projects. | Organization read/update, visibility, project list/list-all/create, member list/invite/remove/role read/assign/revoke, custom role management, organization audit read, and project administration. Exclude billing and ownership transfer by default. Secret value access is not automatic; it depends on the project role. |
| **Project Admin** | Full administration of one project and its environments. | Project read/update/delete/restore, project member and role management, environment management, all secret metadata/value operations, versions, integrations, deployment, project audit. Production secret access can be withheld or separately approved. |
| **Secret Manager** | Maintain secrets without managing project membership or project lifecycle. | Project read, environment list/read, secret list/metadata read/create/key update/value update/metadata update/delete/restore, and version list/read/restore. Grant production reveal and production updates only when necessary. |
| **Developer** | Work with project configuration in non-production environments. | Project read, environment list/read, secret list/metadata read/create/key update/value update/metadata update/delete in explicitly granted non-production environments. No project/org administration, production value read, export, or role management by default. |
| **Deployer** | Deploy or sync approved configuration without general browsing of secret values. | Project read, environment list/read, deployment trigger/status read, and narrowly scoped secret access required by the deployment mechanism. Prefer workload identity/automation tokens over granting a human broad secret reveal. |
| **Viewer** | Read-only project visibility. | Project read, environment list/read, secret list and metadata read. No secret value reveal, edits, deletion, deployment, member management, or exports. |
| **Auditor** | Review activity and configuration for compliance. | Project/organization metadata read, secret metadata read, audit read/export, and role-assignment read. No secret value reveal or mutation by default. |
| **Billing Admin** | Manage organization subscription and payment settings. | Billing read/update only, with organization metadata read as needed. No project secret or member administration by default. |

### Permission bundle examples

These are suggested bundles to make the role definitions concrete:

- **Read project metadata:** `project:read`, `environment:list`,
  `environment:read`.
- **Read secret names only:** `secret:list`, `secret:metadata:read`.
- **Reveal secret values:** `secret:value:read`, granted only in the required
  environments. For production, also require
  `secret:value:read:production`.
- **Manage a secret:** `secret:create`, `secret:key:update`,
  `secret:value:update`, `secret:metadata:update`, `secret:delete`.
- **Administer project access:** `project:members:list`,
  `project:members:invite`, `project:members:remove`,
  `project:members:role:read`, `project:members:role:assign`, and
  `project:members:role:revoke`.
- **List all projects without opening them:** `project:list_all`; this does not
  grant `project:read` or any secret permission.

## Assignment and inheritance rules

Recommended initial behavior:

1. The organization creator becomes the organization `Owner`.
2. An organization role applies to organization actions. It does **not**
   automatically grant access to every project's secrets unless the role
   explicitly includes descendant project permissions and inheritance is
   enabled for that permission.
3. Project roles apply only to their project. Environment-scoped grants narrow
   sensitive permissions to selected environments.
4. A direct user assignment and a group/team assignment can coexist; effective
   permissions are combined, but all grants retain scope boundaries.
5. On organization or project removal, descendant assignments become
   ineffective. Preserve audit history rather than silently erasing grant
   records.
6. Revoking a role should take effect on the next authorization check. Avoid
   embedding long-lived permission snapshots in JWTs; if caching is added, use
   short expiry or reliable invalidation.
7. Prevent assigning, editing, or deleting a role that would give the actor
   permissions they are not allowed to delegate. Protect the final owner from
   removal or demotion without a successful ownership transfer.
8. Consider time-limited elevation for production reveal, export, and
   destructive actions, with a reason and audit record.

## Suggested authorization decision

For every protected operation, the API should:

1. Authenticate the caller and resolve the active user/session.
2. Load the target resource and its organization/project/environment ancestry.
3. Resolve applicable owner, role, direct-user, and group grants for that
   resource scope.
4. Check the exact permission required for the operation and environment.
5. Return `403 Forbidden` when the resource exists but permission is absent;
   return `404 Not Found` when resource existence must be concealed.
6. Record a structured audit event for sensitive reads and mutations.

Do not trust a `userId`, role, permission list, organization ID, or project ID
supplied by the client as proof of access. Resolve authorization from trusted
database records on the server.

## API-to-permission mapping

| Operation | Required permission |
| --- | --- |
| Create organization | `organization:create` |
| List organizations | `organization:read` for each returned organization |
| Delete organization | `organization:delete` |
| List discoverable projects | `project:list`; filter results by project access |
| List all organization projects | `project:list_all` |
| Create project | `project:create` |
| Read project details | `project:read` |
| Delete project | `project:delete` |
| Create/rename/delete environment | `environment:create`, `environment:rename`, `environment:delete` respectively |
| List secret metadata | `secret:list` and `secret:metadata:read` |
| Create secret | `secret:create` |
| Rename secret key | `secret:key:update` |
| Change secret value | `secret:value:update` |
| Reveal secret value | `secret:value:read`, plus production permission where applicable |
| Delete/restore secret | `secret:delete` / `secret:restore` |
| Invite/remove member | Scope-specific member invite/remove permission |
| Assign/revoke a role | Scope-specific role assign/revoke permission plus delegation check |

## Rollout checklist

- [ ] Decide whether organizations and projects can have multiple owners.
- [ ] Decide whether organization roles inherit into projects, and per permission.
- [ ] Approve the built-in roles and their default permission bundles.
- [ ] Add role, permission, and scoped assignment persistence with migrations.
- [ ] Define direct-user and team/group assignment behavior.
- [ ] Build a shared server-side authorization service and middleware.
- [ ] Apply resource ownership and permission checks consistently to list, read,
  reveal, create, update, delete, invite, and environment endpoints.
- [ ] Add tests for allowed/denied access, scope boundaries, revocation,
  production access, and role escalation.
- [ ] Add audit events for membership/role changes and sensitive secret
  operations; confirm values and credentials never enter logs.
- [ ] Add role-management UI and clearly show effective permissions before
  saving assignments.
- [ ] Document migration and compatibility behavior for current owners and
  `members` arrays.
