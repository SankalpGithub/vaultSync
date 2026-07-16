# Request Validator Middleware - Usage Guide

## Overview

The `reqValidator` middleware provides a general-purpose request validation system using Zod. It validates incoming request data (body, params, query, headers) and attaches validated data to the request object for use in controllers.

## Files

- **`src/middlewares/reqValidator.middleware.ts`** - Core middleware with `validate` function
- **`src/validation/schemas.validation.ts`** - Reusable common field validators
- **`src/validation/examples.validation.ts`** - Pre-built validation schemas for common endpoints
- **`src/routes/auth.routes.ts`** - Example implementation

## Features

✅ Validates body, params, query, and headers  
✅ Detailed error messages with field paths  
✅ Type-safe validation with TypeScript support  
✅ Flexible schema composition  
✅ Backwards compatible with existing single-schema format  
✅ Integrated error handling

## Basic Usage

### 1. Import Required Modules

```typescript
import { Router } from "express";
import { validate } from "../middlewares/reqValidator.middleware";
import { asyncHandler } from "../middlewares/asycHandler.middleware";
import * as ValidationSchemas from "../validation/examples.validation";
```

### 2. Apply Validator to Routes

```typescript
const router = Router();

// Single validator for body
router.post(
  "/signup",
  validate(ValidationSchemas.signupValidationSchema),
  asyncHandler(signupController),
);

// Multiple validators
router.put(
  "/users/:userId",
  validate(ValidationSchemas.updateProfileValidationSchema),
  asyncHandler(updateController),
);
```

### 3. Access Validated Data in Controller

```typescript
export const signupController = (
  req: ValidatedRequest,
  res: Response,
  next: NextFunction,
) => {
  // Access validated data
  const { name, email, password, username } = req.validated?.body || {};

  // Your business logic here
};
```

## Creating Custom Validation Schemas

### Option 1: Using Pre-built Common Validators

```typescript
import { z } from "zod";
import {
  emailValidator,
  passwordValidator,
  nameValidator,
  uuidValidator,
  paginationValidator,
} from "../validation/schemas.validation";
import { ValidateSchemas } from "../middlewares/reqValidator.middleware";

export const customValidationSchema: ValidateSchemas = {
  body: z.object({
    email: emailValidator,
    password: passwordValidator,
    name: nameValidator,
  }),
  params: z.object({
    userId: uuidValidator,
  }),
  query: paginationValidator,
};
```

### Option 2: Creating Custom Validators from Scratch

```typescript
import { z } from "zod";
import { ValidateSchemas } from "../middlewares/reqValidator.middleware";

export const customValidationSchema: ValidateSchemas = {
  body: z.object({
    title: z
      .string("Title is required")
      .min(1, "Title cannot be empty")
      .max(200, "Title must not exceed 200 characters"),
    content: z
      .string("Content is required")
      .min(10, "Content must be at least 10 characters"),
    tags: z.array(z.string()).min(1, "At least one tag is required").optional(),
  }),
  params: z.object({
    postId: z.string().uuid("Invalid post ID format"),
  }),
};
```

## Validation Levels

### Validate Only Body

```typescript
const bodyOnlySchema: ValidateSchemas = {
  body: z.object({
    email: emailValidator,
    password: passwordValidator,
  }),
};

router.post("/login", validate(bodyOnlySchema), asyncHandler(loginController));
```

### Validate Body and Params

```typescript
const bodyAndParamsSchema: ValidateSchemas = {
  body: z.object({
    status: z.enum(["active", "inactive"]),
  }),
  params: z.object({
    userId: uuidValidator,
  }),
};

router.put(
  "/users/:userId/status",
  validate(bodyAndParamsSchema),
  asyncHandler(updateStatusController),
);
```

### Validate Query Parameters

```typescript
const querySchema: ValidateSchemas = {
  query: z.object({
    page: z.string().transform(Number).pipe(z.number().positive()),
    limit: z.string().transform(Number).pipe(z.number().min(1).max(100)),
    sort: z.enum(["asc", "desc"]).optional(),
  }),
};

router.get("/items", validate(querySchema), asyncHandler(getItemsController));
```

### Validate Headers

```typescript
const headersSchema: ValidateSchemas = {
  headers: z.object({
    authorization: z.string("Authorization header is required"),
    "x-api-key": z.string("API key header is required").optional(),
  }),
};

router.post(
  "/protected",
  validate(headersSchema),
  asyncHandler(protectedController),
);
```

## Available Common Validators

Located in `src/validation/schemas.validation.ts`:

- **`emailValidator`** - Valid email format
- **`passwordValidator`** - Minimum 8 characters
- **`nameValidator`** - 2-100 characters
- **`usernameValidator`** - 3-50 chars, alphanumeric with hyphens/underscores
- **`uuidValidator`** - Valid UUID format
- **`slugValidator`** - Lowercase letters, numbers, hyphens
- **`tokenValidator`** - Minimum 10 characters
- **`paginationValidator`** - Page and limit with defaults

## Error Response Format

When validation fails, the middleware automatically returns a structured error:

```json
{
  "success": false,
  "message": "email: Invalid email; password: String must contain at least 8 character(s)",
  "statusCode": 400,
  "validationErrors": [
    {
      "path": "email",
      "message": "Invalid email",
      "code": "invalid_string"
    },
    {
      "path": "password",
      "message": "String must contain at least 8 character(s)",
      "code": "too_small"
    }
  ]
}
```

## TypeScript Types

### ValidateSchemas

```typescript
interface ValidateSchemas {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
  headers?: z.ZodType;
}
```

### ValidatedRequest

```typescript
interface ValidatedRequest extends Request {
  validated?: {
    body?: any;
    params?: any;
    query?: any;
    headers?: any;
  };
}
```

## Best Practices

1. **Reuse Common Validators** - Use pre-built validators from `schemas.validation.ts`
2. **Group Related Schemas** - Organize schemas by feature (e.g., user schemas, project schemas)
3. **Add JSDoc Comments** - Document what each schema validates
4. **Use .optional()** for Non-Required Fields\*\* - Make optional fields explicit
5. **Provide Custom Error Messages** - Help users understand what went wrong
6. **Test Your Schemas** - Validate schemas work as expected before deployment

## Example: Complete Endpoint

```typescript
import { Router } from "express";
import { validate } from "../middlewares/reqValidator.middleware";
import { asyncHandler } from "../middlewares/asycHandler.middleware";
import { z } from "zod";
import { ValidateSchemas } from "../middlewares/reqValidator.middleware";
import {
  uuidValidator,
  emailValidator,
} from "../validation/schemas.validation";

const router = Router();

// Define validation schema
const updateUserSchema: ValidateSchemas = {
  params: z.object({
    userId: uuidValidator,
  }),
  body: z.object({
    email: emailValidator.optional(),
    name: z.string().min(1).max(100).optional(),
    bio: z.string().max(500).optional(),
  }),
};

// Apply validator middleware
router.put(
  "/users/:userId",
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req.validated?.params || {};
    const { email, name, bio } = req.validated?.body || {};

    // Your controller logic here
    res.json({
      success: true,
      message: "User updated successfully",
      data: { userId, email, name, bio },
    });
  }),
);

export default router;
```

## Backwards Compatibility

The middleware still supports the old single-schema format:

```typescript
// Old format (still works)
const oldSchema = z.object({
  body: z.object({ email: z.string() }),
  params: z.object({ id: z.string() }),
  query: z.object({ page: z.string() }),
});

router.post("/legacy", validate(oldSchema), controller);
```

## Troubleshooting

### Issue: Validation errors not showing detailed messages

**Solution:** Ensure your Zod schema includes appropriate error messages:

```typescript
z.string("Field is required").email("Invalid email format");
```

### Issue: Cannot access validated data in controller

**Solution:** Make sure to type the request parameter as `ValidatedRequest`:

```typescript
import { ValidatedRequest } from "../middlewares/reqValidator.middleware";

export const myController = (req: ValidatedRequest, res: Response) => {
  const data = req.validated?.body; // Now properly typed
};
```

### Issue: Optional fields causing validation to fail

**Solution:** Use `.optional()` on optional Zod schemas:

```typescript
const schema: ValidateSchemas = {
  body: z.object({
    required: z.string(),
    optional: z.string().optional(),
  }),
};
```

## Next Steps

1. Update your existing routes to use the new validator middleware
2. Define custom validation schemas for your specific endpoints
3. Add validators to all public API endpoints
4. Monitor error logs to ensure validation is catching unexpected data
