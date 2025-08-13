# 🚀 Business Teamspace Setup Guide

This guide will help you set up the Business Teamspace application with all APIs working correctly.

## 📋 Prerequisites
sf
- Node.js 18+ installed
- A Supabase account and project
- Git (optional)

## 🔧 Step 1: Environment Setup

### 1.1 Create Environment File

Create a `.env.local` file in your project root with your Supabase credentials:

```bash
# Copy the template
cp env-template.txt .env.local
```

Then edit `.env.local` and add your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 1.2 Get Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Go to **Settings** → **API**
4. Copy the **Project URL** and **anon public key**

## 🗄️ Step 2: Database Setup

### 2.1 Run Database Script

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `database-setup.sql`
3. Paste and run the script
4. You should see: "Database setup completed successfully! 🎉"

### 2.2 Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **Create bucket**
3. Name: `chat-attachments`
4. Make it **Public**
5. Click **Create bucket**

## 📦 Step 3: Install Dependencies

```bash
npm install
```

## 🚀 Step 4: Start Development Server

```bash
npm run dev
```

The app should now be running at `http://localhost:5173` (or another port if 5173 is busy).

## ✅ Step 5: Test the Application

### 5.1 Test Authentication

1. Go to `/register` and create a new account
2. Try signing in with your credentials
3. You should be redirected to the dashboard

### 5.2 Test Core Features

- **Group Chat**: Send and receive messages
- **Journal**: Create, edit, and delete entries
- **Todos**: Create and manage tasks
- **Dashboard**: View statistics and quick actions

## 🔍 Troubleshooting

### Issue: "Missing Supabase environment variables"

**Solution**: Make sure your `.env.local` file exists and has the correct credentials.

### Issue: "Could not find the table 'public.users'"

**Solution**: Run the database setup script in Supabase SQL Editor.

### Issue: "API calls failing"

**Solution**: Check the browser console for specific error messages and verify your Supabase credentials.

### Issue: "Authentication not working"

**Solution**: 
1. Verify your Supabase project has Authentication enabled
2. Check that Email auth is enabled in Authentication → Providers
3. Ensure your environment variables are correct

### Issue: "File uploads not working"

**Solution**: Make sure you've created the `chat-attachments` storage bucket in Supabase.

## 🧪 Testing API Endpoints

### Authentication APIs
- ✅ User registration
- ✅ User login
- ✅ User logout
- ✅ Session management

### Chat APIs
- ✅ Channel creation
- ✅ Message sending
- ✅ Message retrieval
- ✅ Real-time updates

### Journal APIs
- ✅ Entry creation
- ✅ Entry editing
- ✅ Entry deletion
- ✅ Entry listing

### Todo APIs
- ✅ Task creation
- ✅ Task management
- ✅ Status updates
- ✅ Drag and drop

### Accounting APIs
- ✅ Group accounting
- ✅ Agency accounting
- ✅ Income/expense tracking

## 🔒 Security Features

- Row Level Security (RLS) enabled on all tables
- User authentication required for all operations
- Role-based access control (core_member vs agency_member)
- Secure file uploads with proper permissions

## 📱 Features Working

- ✅ User authentication and authorization
- ✅ Real-time chat with file attachments
- ✅ Journal management
- ✅ Task management with drag & drop
- ✅ Accounting tracking
- ✅ Notice system
- ✅ Responsive design
- ✅ Error handling and user feedback

## 🚨 Common Issues & Solutions

### Issue: Build errors
**Solution**: Make sure all dependencies are installed and environment variables are set.

### Issue: Database connection errors
**Solution**: Verify your Supabase URL and anon key are correct.

### Issue: Tables not found
**Solution**: Run the database setup script completely.

### Issue: Permission denied errors
**Solution**: Check that RLS policies are properly set up in the database.

## 📞 Support

If you encounter issues not covered in this guide:

1. Check the browser console for error messages
2. Verify your Supabase project settings
3. Ensure all environment variables are set correctly
4. Run the database setup script again

## 🎯 Next Steps

Once everything is working:

1. **Customize the application** to match your business needs
2. **Add more users** through the registration system
3. **Set up agencies** and assign users to them
4. **Configure storage policies** for file uploads
5. **Monitor usage** through Supabase dashboard

---

**Happy coding! 🎉**

Your Business Teamspace application should now be fully functional with all APIs working correctly.
