# Secret Sharing Planning Docs

This doc will guide through how sharing secrets from sharer to recepient works.

## Definitions

1. **Sharer :** The person who shares a secret with others.
2. **Recepient :** The person who receives access to a shared secret.
3. **Scope :** Access levels for sharing secrets ex. (Global, Org, Project, Env, Secret)
4. **Inviation :** A request created by sharer to recepient containing sharing access information

## Features

1. Share secrets
2. Assign Roles and Permissions
3. Authorize users Permission for action
4. Modify users Permissions
5. Sync changes
6. Revoke access

## Working

### Sharer Steps

- Sharer select the scope of the Access
- Add the Recepients
- Add roles and permissions
- send invitation to recepients

### Recepient Steps

- Recepient will receive the Invitation
- Review the Inviation
- Take Decision (Accept, Reject)
- Access the secrets

## Concepts

- **Scope :** Main Aim to set a scope is to give permissions inside the scope only and deny access outside the scope

```mermaid
flowchart TB
    subgraph Organization["Organization"]
        subgraph Project["Project"]
            A[Environment]
            B[Secrets]
        end
    end
```

## Sharer Steps Low Level Design

Sharer Send Request from frontend client to backend server endpoint for sharing resources to recipients with scope, role, permissions/

### endpoint

/v1/api/share/invitation

### request payload

```typescript
ISendShareEnvironment {
  envId: string;
  permissions: string[];
}
SendShareInvitation {
  sharerId: string;
  recipientEmails: string[];
  orgId: string;
  orgPermissions: string[];
  projectId: string[];
  projectPermissions: string[];
  environment: ISendShareEnvironment[];
  secretId: string[];
  secretPermission: string[];
  role: string;
}
```

### Validations

- Authorize sharer as a valid user
- Authorize sharer has permission and access to share the resource
- Validated org id, projectIds, environment in the project and SecretId

### Get Data

Get names for every object Ids like org, projects, envs, secrets to send info in user email. perfrom this while validation because we are going to look in db to validate ids

### Create DB document entry

after authorize create a entry in shareInvitation db collection model

```Typescript
export interface ICreateSendShareInvitation {
  sharerId: Types.ObjectId;
  recipientEmails: string[];
  orgId: Types.ObjectId;
  orgPermissions: string[];
  projectId: Types.ObjectId[];
  projectPermissions: string[];
  environment: ISendShareEnvironment[];
  secretId: Types.ObjectId[];
  secretPermission: string[];
  role: string;
}
```

### Send Invitation

For each recipient send email showing all the details about request and gave them option for accept or reject the invitation

- send email in parallel in promisses so required less time

### Diagrams

```drawio
<mxfile>
  <diagram id="C5RBs43oDa-KdzZeNtuy" name="Page-1">
    <mxGraphModel dx="1223" dy="898" grid="1" gridSize="10" guides="1" tooltips="0" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="827" pageHeight="1169" math="0" shadow="0">
      <root>
        <mxCell id="WIyWlLk6GJQsqaUBKTNV-0" />
        <mxCell id="WIyWlLk6GJQsqaUBKTNV-1" parent="WIyWlLk6GJQsqaUBKTNV-0" />
        <mxCell id="bAeC0lEcmsPaWs3vJtyD-0" edge="1" parent="WIyWlLk6GJQsqaUBKTNV-1" style="endArrow=none;html=1;" value="">
          <mxGeometry height="50" relative="1" width="50" as="geometry">
            <mxPoint x="160" y="520" as="sourcePoint" />
            <mxPoint x="160" y="120" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="bAeC0lEcmsPaWs3vJtyD-1" parent="WIyWlLk6GJQsqaUBKTNV-1" style="text;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;rounded=0;" value="client" vertex="1">
          <mxGeometry height="30" width="60" x="130" y="50" as="geometry" />
        </mxCell>
        <mxCell id="bAeC0lEcmsPaWs3vJtyD-3" parent="WIyWlLk6GJQsqaUBKTNV-1" style="text;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;rounded=0;" value="server" vertex="1">
          <mxGeometry height="30" width="60" x="460" y="50" as="geometry" />
        </mxCell>
        <mxCell id="bAeC0lEcmsPaWs3vJtyD-5" edge="1" parent="WIyWlLk6GJQsqaUBKTNV-1" style="endArrow=none;html=1;" value="">
          <mxGeometry height="50" relative="1" width="50" as="geometry">
            <mxPoint x="320" y="520" as="sourcePoint" />
            <mxPoint x="320" y="120" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="bAeC0lEcmsPaWs3vJtyD-6" parent="WIyWlLk6GJQsqaUBKTNV-1" style="text;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;rounded=0;" value="route" vertex="1">
          <mxGeometry height="30" width="60" x="290" y="90" as="geometry" />
        </mxCell>
        <mxCell id="bAeC0lEcmsPaWs3vJtyD-9" edge="1" parent="WIyWlLk6GJQsqaUBKTNV-1" style="endArrow=none;html=1;" value="">
          <mxGeometry height="50" relative="1" width="50" as="geometry">
            <mxPoint x="440" y="520" as="sourcePoint" />
            <mxPoint x="440" y="120" as="targetPoint" />
          </mxGeometry>
        </mxCell>
        <mxCell id="bAeC0lEcmsPaWs3vJtyD-10" parent="WIyWlLk6GJQsqaUBKTNV-1" style="text;html=1;whiteSpace=wrap;strokeColor=none;fillColor=none;align=center;verticalAlign=middle;rounded=0;" value="middleware" vertex="1">
          <mxGeometry height="30" width="60" x="410" y="90" as="geometry" />
        </mxCell>
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>

```

## Recipients Steps Low Level Design

- Check the invitation in mail with information
- option for Accept or Reject
