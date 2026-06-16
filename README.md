# DevMitra

A developer collaboration platform where developers can create projects, discover opportunities, request access to contribute, and collaborate with teams.

## 🚀 Features

### Core Features
- **GitHub OAuth Authentication** - Secure login with GitHub
- **Project Management** - Create, update, and delete projects
- **Access Control** - Request-based contributor approval system
- **Role-Based Permissions** - OWNER and CONTRIBUTOR roles
- **Activity Tracking** - Comprehensive activity logs for all actions
- **Search & Filter** - Find projects by title, description, or owner
- **Pagination** - Efficient data loading for large datasets

### Advanced Features
- **Project Tags** - Categorize projects by tech stack
- **User Profiles** - View user stats, projects, and memberships
- **Project Statistics** - Track members, requests, and activities
- **Platform Statistics** - Global analytics dashboard
- **Rate Limiting** - API protection against abuse
- **Error Handling** - Consistent error responses

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Prisma ORM** - Database toolkit
- **JWT** - Authentication
- **GitHub OAuth** - Social login

### Security
- HTTP-only cookies for JWT storage
- Rate limiting (express-rate-limit)
- Input validation
- Authorization checks
- Database-level constraints

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- GitHub OAuth App credentials
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/riturajarvind149/DevMitra.git
cd DevMitra
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Set up environment variables**

Create a `.env` file in the `backend` directory:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/devmitra"
JWT_SECRET="your-super-secret-jwt-key-here"
GITHUB_CLIENT_ID="your-github-oauth-client-id"
GITHUB_CLIENT_SECRET="your-github-oauth-client-secret"
PORT=5000
```

4. **Set up GitHub OAuth App**
- Go to GitHub Settings > Developer settings > OAuth Apps
- Create a new OAuth App
- Set Authorization callback URL to: `http://localhost:5000/auth/github/callback`
- Copy Client ID and Client Secret to `.env`

5. **Run database migrations**
```bash
npx prisma migrate dev
```

6. **Generate Prisma Client**
```bash
npx prisma generate
```

7. **Start the server**
```bash
npm run dev
```

The API will be running at `http://localhost:5000`

## 📚 API Documentation

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for complete API reference.

### Quick Example

**Get all projects:**
```bash
GET http://localhost:5000/projects
```

**Create a project:**
```bash
POST http://localhost:5000/projects
Cookie: token=your_jwt_token
Content-Type: application/json

{
  "title": "My Awesome Project",
  "description": "A revolutionary app",
  "deployedUrl": "https://myapp.com",
  "tags": ["React", "Node.js"]
}
```

## 🗄️ Database Schema

### Models
- **User** - User accounts with GitHub integration
- **Project** - Projects with tags and metadata
- **ProjectMember** - Team membership with roles
- **ProjectAccessRequest** - Access request workflow
- **ActivityLog** - System-wide activity tracking

### Relationships
- User → Projects (one-to-many, as owner)
- User → ProjectMembers (one-to-many)
- User → AccessRequests (one-to-many)
- Project → ProjectMembers (one-to-many)
- Project → AccessRequests (one-to-many)
- Project → ActivityLogs (one-to-many)

## 🔐 Authentication Flow

1. User clicks "Login with GitHub"
2. Redirected to GitHub OAuth
3. User authorizes the app
4. GitHub redirects back with code
5. Backend exchanges code for access token
6. Backend creates/updates user in database
7. Backend generates JWT and sets HTTP-only cookie
8. Frontend stores user data
9. All subsequent requests include cookie automatically

## 🚦 Rate Limits

- General API: 100 requests / 15 minutes
- Auth endpoints: 10 requests / 15 minutes
- Create operations: 50 requests / hour

## 📁 Project Structure

```
DevMitra/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── accessRequestController.js
│   │   │   ├── activityController.js
│   │   │   ├── authController.js
│   │   │   ├── projectController.js
│   │   │   ├── projectMemberController.js
│   │   │   ├── statsController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── rateLimiter.js
│   │   ├── routes/
│   │   │   ├── accessRequestRoutes.js
│   │   │   ├── activityRoutes.js
│   │   │   ├── authRoutes.js
│   │   │   ├── projectMemberRoutes.js
│   │   │   ├── projectRoutes.js
│   │   │   └── userRoutes.js
│   │   ├── utils/
│   │   │   ├── activityLogger.js
│   │   │   └── generateToken.js
│   │   └── app.js
│   ├── server.js
│   └── package.json
├── frontend/ (coming soon)
├── API_DOCUMENTATION.md
└── README.md
```

## 🧪 Testing

Use Postman, Insomnia, or Thunder Client to test the API.

**Import the Postman collection** (coming soon)

Or test manually:
1. Start the server
2. Visit `http://localhost:5000/auth/github` in browser
3. Authorize with GitHub
4. Copy the JWT token from response
5. Use the token in Cookie header for authenticated requests

## 🚀 Deployment

### Backend Deployment (Render, Railway, or similar)

1. Set environment variables
2. Ensure DATABASE_URL points to production PostgreSQL
3. Run migrations: `npx prisma migrate deploy`
4. Start server: `npm start`

### Database Deployment (Railway, Supabase, etc.)

1. Create PostgreSQL database
2. Copy connection string
3. Update DATABASE_URL in environment

## 🤝 Contributing

Contributions are welcome! This is currently a work in progress.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👤 Author

**Rituraj Arvind**
- GitHub: [@riturajarvind149](https://github.com/riturajarvind149)

## 🗺️ Roadmap

### Phase 1: Core Platform ✅
- [x] Authentication system
- [x] Project CRUD
- [x] Access request workflow
- [x] Member management
- [x] Activity logs

### Phase 2: Enhanced Features ✅
- [x] Search and filtering
- [x] Pagination
- [x] Project tags
- [x] Statistics endpoints
- [x] Rate limiting
- [x] Error handling

### Phase 3: Frontend (In Progress)
- [ ] React/Next.js frontend
- [ ] Responsive UI
- [ ] Dashboard
- [ ] Project browser
- [ ] Request management

### Phase 4: Collaboration Features (Planned)
- [ ] Real-time chat
- [ ] Task management
- [ ] Issue tracking
- [ ] Code review integration
- [ ] Notifications system

### Phase 5: Advanced Features (Future)
- [ ] GitHub integration (auto-sync repos)
- [ ] CI/CD pipeline integration
- [ ] Project analytics
- [ ] Team permissions
- [ ] Public API with API keys

## 📞 Support

For support, email riturajarvind149@gmail.com or open an issue.

---

Made with ❤️ by Rituraj Arvind

Developers Helping Developers

A platform where developers can showcase projects, receive feedback, collaborate through GitHub, and improve products together.