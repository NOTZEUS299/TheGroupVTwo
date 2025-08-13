# Business Group Teamspace

A full-stack internal communication and management tool for business groups, built with React, TypeScript, and Supabase.

## Features

### 🔐 Authentication & User Management
- **Supabase Auth** with email/password authentication
- **Role-based access control**: Core Members (full access) and Agency Members (agency-specific access)
- **User profiles** with customizable settings

### 💬 Real-time Communication
- **Group Chat**: All core members can communicate in real-time
- **Agency Chats**: Private communication channels for each agency
- **File attachments** support via Supabase Storage
- **Unread message indicators** and timestamps

### 📚 Knowledge Management
- **Journal Book**: Core members can create and edit decision logs and notes
- **Log Book**: System-generated activity logs for major events
- **Search functionality** across all content

### 💰 Financial Management
- **Group Accounting**: Group-level financial transactions and reporting
- **Agency Accounting**: Separate financial tracking per agency
- **Summary views** with income, expense, and balance calculations
- **Transaction history** with filtering and search

### 📢 Notifications & Task Management
- **Public Notices**: Announcements visible to all users
- **To-Do Lists**: Personal and shared agency tasks
- **Drag-and-drop** status management (pending/completed)
- **Due date tracking** with overdue highlighting

### ⚙️ Account Management
- **Profile settings** (name, email updates)
- **Password management** with secure change functionality
- **Account deletion** with confirmation
- **Role and agency information** display

## Tech Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router v6** for client-side routing
- **React Hook Form** with Zod validation
- **Zustand** for state management
- **React Query** for data fetching and caching

### Backend & Infrastructure
- **Supabase** for:
  - PostgreSQL database
  - Real-time subscriptions
  - Authentication
  - File storage
  - Row Level Security (RLS)

### UI Components
- **Headless UI** for accessible components
- **Heroicons** for consistent iconography
- **DND Kit** for drag-and-drop functionality

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account and project

### Environment Setup
Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd business-teamspace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

## Database Schema

### Core Tables

#### `users`
- `id` (UUID, primary key)
- `email` (text, unique)
- `name` (text)
- `role` (enum: 'core_member', 'agency_member')
- `agency_id` (UUID, foreign key to agency.id, nullable)
- `created_at` (timestamp)

#### `agency`
- `id` (UUID, primary key)
- `name` (text)
- `description` (text, nullable)
- `created_at` (timestamp)

#### `channels`
- `id` (UUID, primary key)
- `name` (text)
- `type` (enum: 'group', 'agency')
- `agency_id` (UUID, foreign key, nullable)
- `created_at` (timestamp)

#### `messages`
- `id` (UUID, primary key)
- `channel_id` (UUID, foreign key)
- `user_id` (UUID, foreign key)
- `content` (text)
- `file_url` (text, nullable)
- `created_at` (timestamp)

#### `journal_entries`
- `id` (UUID, primary key)
- `title` (text)
- `content` (text)
- `author_id` (UUID, foreign key)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `log_book`
- `id` (UUID, primary key)
- `event_type` (text)
- `description` (text)
- `metadata` (jsonb, nullable)
- `created_at` (timestamp)

#### `group_accounting`
- `id` (UUID, primary key)
- `type` (enum: 'income', 'expense')
- `amount` (decimal)
- `description` (text)
- `date` (date)
- `added_by` (UUID, foreign key)
- `created_at` (timestamp)

#### `agency_accounting`
- `id` (UUID, primary key)
- `agency_id` (UUID, foreign key)
- `type` (enum: 'income', 'expense')
- `amount` (decimal)
- `description` (text)
- `date` (date)
- `added_by` (UUID, foreign key)
- `created_at` (timestamp)

#### `notices`
- `id` (UUID, primary key)
- `title` (text)
- `content` (text)
- `posted_by` (UUID, foreign key)
- `created_at` (timestamp)
- `updated_at` (timestamp)

#### `todos`
- `id` (UUID, primary key)
- `title` (text)
- `description` (text, nullable)
- `status` (enum: 'pending', 'completed')
- `assigned_to` (UUID, foreign key)
- `due_date` (date, nullable)
- `agency_id` (UUID, foreign key, nullable)
- `created_by` (UUID, foreign key)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   └── Layout.tsx      # Main layout with sidebar and topbar
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Login.tsx       # Authentication
│   ├── Register.tsx    # User registration
│   ├── GroupChat.tsx   # Group communication
│   ├── AgencyChat.tsx  # Agency-specific chat
│   ├── Journal.tsx     # Decision logs
│   ├── LogBook.tsx     # System logs
│   ├── GroupAccounting.tsx    # Group finances
│   ├── AgencyAccounting.tsx   # Agency finances
│   ├── Notices.tsx     # Announcements
│   ├── Todos.tsx       # Task management
│   └── Settings.tsx    # User preferences
├── stores/             # State management
│   └── authStore.ts    # Authentication state
├── lib/                # Utilities and configurations
│   └── supabase.ts     # Supabase client and types
├── App.tsx             # Main application component
└── main.tsx            # Application entry point
```

## Key Features Implementation

### Real-time Updates
- **Supabase Realtime** subscriptions for instant message updates
- **Live notifications** for new content
- **Automatic UI updates** without manual refresh

### Role-based Access Control
- **Conditional rendering** based on user roles
- **Data filtering** by agency membership
- **Protected routes** for sensitive operations

### Form Management
- **React Hook Form** for efficient form handling
- **Zod validation** for type-safe form validation
- **Error handling** with user-friendly messages

### Responsive Design
- **Mobile-first approach** with Tailwind CSS
- **Responsive sidebar** with mobile overlay
- **Touch-friendly** interactions

## Security Features

- **Row Level Security (RLS)** in Supabase
- **JWT-based authentication**
- **Role-based permissions**
- **Input validation** and sanitization
- **Secure file uploads** with access controls

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Backend (Supabase)
1. Database migrations run automatically
2. RLS policies enforce security
3. Real-time subscriptions enabled

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository or contact the development team.

---

**Built with ❤️ using modern web technologies**
