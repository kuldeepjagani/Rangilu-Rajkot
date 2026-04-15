# RajkotLive Backend API

Hyperlocal news and events platform for Rajkot, Gujarat.

## Tech Stack

- **Runtime**: Node.js + Express.js (TypeScript)
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: JWT (access + refresh tokens), bcryptjs
- **Validation**: Zod
- **File Uploads**: Multer + AWS S3
- **Security**: helmet, cors, express-rate-limit

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy .env.example to .env and update values
cp .env.example .env

# 3. Run database migration
npx prisma migrate dev

# 4. Seed the database
npx prisma db seed

# 5. Start development server
npm run dev
```

Server runs at `http://localhost:8080`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Server port (default: 8080) |
| `JWT_ACCESS_SECRET` | JWT access token secret |
| `JWT_REFRESH_SECRET` | JWT refresh token secret |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiry (e.g. 15m) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiry (e.g. 7d) |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key |
| `AWS_REGION` | AWS S3 region |
| `AWS_S3_BUCKET_NAME` | AWS S3 bucket name |
| `CORS_ORIGIN` | Allowed CORS origin |

## API Routes (27 endpoints)

### Health & Meta
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/health` | Health check | No |
| GET | `/api/genders` | Get gender options list | No |

### Auth
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | Logout | Yes |
| GET | `/api/auth/me` | Get current user profile | Yes |

### Upload (S3)
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/upload` | Upload images (max 4, 5MB each) | Yes |
| POST | `/api/upload/avatar` | Upload single avatar image | Yes |

### Posts
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/posts` | List posts (filter, search, sort, paginate) | Optional |
| GET | `/api/posts/:id` | Get post with comments | Optional |
| POST | `/api/posts` | Create post (JSON body with S3 image URLs) | Yes |
| PUT | `/api/posts/:id` | Update own post | Yes |
| DELETE | `/api/posts/:id` | Delete own post | Yes |
| POST | `/api/posts/:id/like` | Toggle like | Yes |
| POST | `/api/posts/:id/save` | Toggle save/bookmark | Yes |
| POST | `/api/posts/:id/report` | Report a post | Yes |
| POST | `/api/posts/:id/comments` | Add comment | Yes |

### Comments
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/comments/:id/reply` | Reply to comment (max 2 levels) | Yes |
| DELETE | `/api/comments/:id` | Delete own comment | Yes |

### Users
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/users/:username` | Public profile | No |
| PUT | `/api/users/me` | Update profile (supports avatar upload) | Yes |
| GET | `/api/users/me/saved` | Get saved/bookmarked posts | Yes |
| GET | `/api/users/me/posts` | Get own posts | Yes |

### Admin (ADMIN role required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/posts` | All posts with filters (search, category, status, reported) |
| PUT | `/api/admin/posts/:id/status` | Update post status (ACTIVE/REMOVED) |
| DELETE | `/api/admin/posts/:id` | Permanently delete post |
| GET | `/api/admin/reports` | Get reported posts with reporter details |
| DELETE | `/api/admin/reports/:id/dismiss` | Dismiss all reports on a post |
| GET | `/api/admin/users` | All users with filters + report count |
| PUT | `/api/admin/users/:id/role` | Change user role (USER/ADMIN) |
| PUT | `/api/admin/users/:id/ban` | Toggle ban/unban user (ACTIVE/INACTIVE) |
| DELETE | `/api/admin/users/:id` | Delete user + cascade all data |

## Key Features

- **Image Upload Flow**: Upload images to S3 via `/api/upload` first, get URLs, then pass URLs in create/update post body
- **Ban System**: Banned users (INACTIVE status) are blocked from all protected routes via middleware
- **Report System**: Users can report posts (one per user per post), admins can view and dismiss reports
- **Cascade Delete**: Deleting a user removes all their posts, comments, likes, saved posts, and reports
- **Nested Comments**: Supports 2-level deep comment threading
- **Pagination**: All list endpoints support `page` and `limit` query params with meta response

## Seed Data

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@rajkotlive.in | Admin@123 |
| User | rajesh@example.com | User@123 |
| User | priya@example.com | User@123 |
| User | kiran@example.com | User@123 |

- **10 sample posts** across EVENT, FOOD, SPORTS, DAYRO, OTHER categories
- **4 sample reports**, **5 likes**, **4 comments**

## Enums

| Enum | Values |
|------|--------|
| Role | `USER`, `ADMIN` |
| Gender | `MALE`, `FEMALE`, `OTHER` |
| UserStatus | `ACTIVE`, `INACTIVE` |
| PostCategory | `EVENT`, `FOOD`, `SPORTS`, `DAYRO`, `OTHER` |
| PostStatus | `ACTIVE`, `REMOVED` |

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma      # Database models & enums
│   ├── seed.ts             # Seed data script
│   └── migrations/         # Database migrations
├── src/
│   ├── config/             # Environment config
│   ├── controllers/        # Request handlers
│   ├── lib/                # Prisma client instance
│   ├── middlewares/         # Auth, upload, rate limiter, error handler
│   ├── routes/             # Route definitions
│   ├── services/           # Business logic
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # JWT, ApiError, ApiResponse, S3 upload
│   ├── validations/        # Zod request validation schemas
│   ├── app.ts              # Express app setup
│   └── server.ts           # Server entry point
├── api-schema.json         # Full API schema (for frontend code gen)
└── .env                    # Environment variables
```
