# DevMitra API Documentation

Base URL: `http://localhost:5000`

## Table of Contents
- [Authentication](#authentication)
- [Users](#users)
- [Projects](#projects)
- [Project Members](#project-members)
- [Access Requests](#access-requests)
- [Activities](#activities)
- [Statistics](#statistics)

---

## Authentication

### GitHub Login
Initiates GitHub OAuth flow.
```
GET /auth/github
```

### GitHub Callback
Handles GitHub OAuth callback (automatically called by GitHub).
```
GET /auth/github/callback?code={code}
```
**Response:** Sets HTTP-only cookie with JWT token.

### Get Current User
Returns the authenticated user's profile.
```
GET /auth/me
Headers: Cookie: token={jwt}
```
**Response:**
```json
{
  "id": "clxxx",
  "username": "john_doe",
  "email": "john@example.com",
  "avatarUrl": "https://...",
  "githubUsername": "johndoe",
  "githubProfileUrl": "https://github.com/johndoe",
  "createdAt": "2026-06-16T..."
}
```

### Logout
Clears authentication cookie.
```
POST /auth/logout
```

---

## Users

### Get All Users
Returns list of all users (public).
```
GET /users
```

### Get User By ID
Returns a specific user's profile with stats.
```
GET /users/:id
```
**Response:**
```json
{
  "id": "clxxx",
  "username": "john_doe",
  "email": "john@example.com",
  "avatarUrl": "https://...",
  "githubUsername": "johndoe",
  "githubProfileUrl": "https://github.com/johndoe",
  "createdAt": "2026-06-16T...",
  "_count": {
    "projects": 5,
    "projectMemberships": 12
  }
}
```

### Get User's Projects
Returns all projects owned by a user.
```
GET /users/:id/projects
```

### Get User's Memberships
Returns all projects where the user is a member.
```
GET /users/:id/memberships
```

### Update User Profile
Update own profile (auth required).
```
PUT /users/:id
Headers: Cookie: token={jwt}
Body:
{
  "username": "new_username",
  "email": "newemail@example.com"
}
```

### Delete User Account
Delete own account (auth required).
```
DELETE /users/:id
Headers: Cookie: token={jwt}
```

---

## Projects

### Get All Projects
Returns all projects with pagination, search, and filtering.
```
GET /projects?search={query}&owner={username}&limit=50&offset=0
```
**Query Parameters:**
- `search` - Search in title and description
- `owner` - Filter by owner username
- `limit` - Results per page (max 100, default 50)
- `offset` - Skip N results

**Response:**
```json
{
  "projects": [
    {
      "id": "clxxx",
      "title": "DevMitra",
      "description": "Collaboration platform",
      "tags": ["React", "Node.js", "PostgreSQL"],
      "deployedUrl": "https://devmitra.com",
      "githubRepoUrl": "https://github.com/user/devmitra",
      "isRepoPrivate": true,
      "ownerId": "clxxx",
      "owner": {
        "id": "clxxx",
        "username": "john_doe",
        "avatarUrl": "https://...",
        "githubUsername": "johndoe"
      },
      "_count": {
        "members": 5
      },
      "createdAt": "2026-06-16T..."
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get My Projects
Returns projects owned by the authenticated user.
```
GET /projects/my
Headers: Cookie: token={jwt}
```

### Get Project By ID
Returns detailed project information.
```
GET /projects/:id
```
**Response includes:** owner, all members, access request count

### Get Project Statistics
Returns project statistics.
```
GET /projects/:id/stats
```
**Response:**
```json
{
  "projectId": "clxxx",
  "members": 5,
  "accessRequests": {
    "pending": 3,
    "approved": 10,
    "rejected": 2,
    "total": 15
  },
  "activities": 45
}
```

### Create Project
Create a new project (auth required).
```
POST /projects
Headers: Cookie: token={jwt}
Body:
{
  "title": "My Project",
  "description": "A cool project",
  "deployedUrl": "https://myproject.com",
  "githubRepoUrl": "https://github.com/user/project",
  "tags": ["React", "TypeScript"]
}
```

### Update Project
Update own project (auth required, owner only).
```
PUT /projects/:id
Headers: Cookie: token={jwt}
Body: (any fields to update)
{
  "title": "Updated Title",
  "tags": ["React", "Next.js"]
}
```

### Delete Project
Delete own project (auth required, owner only).
```
DELETE /projects/:id
Headers: Cookie: token={jwt}
```

---

## Project Members

### Get Project Members
Returns all members of a project (public).
```
GET /projects/:projectId/members
```
**Response:**
```json
[
  {
    "id": "clxxx",
    "projectId": "clxxx",
    "userId": "clxxx",
    "role": "OWNER",
    "joinedAt": "2026-06-16T...",
    "user": {
      "id": "clxxx",
      "username": "john_doe",
      "email": "john@example.com",
      "avatarUrl": "https://...",
      "githubUsername": "johndoe",
      "githubProfileUrl": "https://github.com/johndoe"
    }
  }
]
```

### Check Membership Status
Check if current user is a member (auth required).
```
GET /projects/:projectId/membership
Headers: Cookie: token={jwt}
```
**Response:**
```json
{
  "isMember": true,
  "role": "CONTRIBUTOR",
  "joinedAt": "2026-06-16T..."
}
```

### Remove Member
Remove a member from project (auth required, owner only).
```
DELETE /projects/:projectId/members/:userId
Headers: Cookie: token={jwt}
```

---

## Access Requests

### Get My Access Requests
Returns access requests submitted by current user (auth required).
```
GET /access-requests/mine?status=PENDING
Headers: Cookie: token={jwt}
```
**Query Parameters:**
- `status` - Filter by status: PENDING, APPROVED, REJECTED

### Get Incoming Access Requests
Returns requests to projects owned by current user (auth required).
```
GET /access-requests/incoming?status=PENDING
Headers: Cookie: token={jwt}
```

### Create Access Request
Request access to a project (auth required).
```
POST /access-requests
Headers: Cookie: token={jwt}
Body:
{
  "projectId": "clxxx",
  "reason": "I want to contribute",
  "suggestion": "I can help with frontend development"
}
```

### Approve Access Request
Approve a request (auth required, project owner only).
```
PUT /access-requests/:id/approve
Headers: Cookie: token={jwt}
```

### Reject Access Request
Reject a request (auth required, project owner only).
```
PUT /access-requests/:id/reject
Headers: Cookie: token={jwt}
```

---

## Activities

### Get Project Activities
Returns activity log for a project.
```
GET /projects/:projectId/activities?limit=20&offset=0
```
**Response:**
```json
{
  "activities": [
    {
      "id": "clxxx",
      "action": "PROJECT_CREATED",
      "description": "john_doe created project \"DevMitra\"",
      "projectId": "clxxx",
      "userId": "clxxx",
      "metadata": {
        "title": "DevMitra",
        "tags": ["React", "Node.js"]
      },
      "createdAt": "2026-06-16T...",
      "user": {
        "id": "clxxx",
        "username": "john_doe",
        "avatarUrl": "https://...",
        "githubUsername": "johndoe"
      }
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Activity Types:**
- `PROJECT_CREATED`
- `PROJECT_UPDATED`
- `PROJECT_DELETED`
- `MEMBER_JOINED`
- `MEMBER_LEFT`
- `ACCESS_REQUEST_CREATED`
- `ACCESS_REQUEST_APPROVED`
- `ACCESS_REQUEST_REJECTED`

### Get User Activities
Returns activity log for a user.
```
GET /users/:userId/activities?limit=20&offset=0
```

---

## Statistics

### Get Platform Statistics
Returns global platform statistics (public).
```
GET /stats
```
**Response:**
```json
{
  "users": 1250,
  "projects": 450,
  "memberships": 2100,
  "accessRequests": {
    "total": 890,
    "pending": 45,
    "processed": 845
  },
  "activities": 5600
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "message": "Error description"
}
```

**Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in or invalid token)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `409` - Conflict (duplicate entry)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

---

## Rate Limiting

- **General API:** 100 requests per 15 minutes per IP
- **Auth endpoints:** 10 requests per 15 minutes per IP
- **Create endpoints:** 50 requests per hour per IP

When rate limited, you'll receive a `429` status with:
```json
{
  "message": "Too many requests from this IP, please try again later"
}
```

---

## Authentication Flow

1. Frontend redirects to `GET /auth/github`
2. User authorizes on GitHub
3. GitHub redirects to `GET /auth/github/callback`
4. Backend sets HTTP-only cookie with JWT
5. Frontend receives user data
6. All subsequent requests include cookie automatically
7. Use `POST /auth/logout` to clear cookie

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- HTTP-only cookies are used for security
- Cookie name: `token`
- Cookie expiry: 7 days
- All list endpoints support pagination
- Search is case-insensitive
- Tags are stored as string arrays
- Activity metadata is stored as JSON
