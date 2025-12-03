# PothiGPT

A modern, full-stack eBook creation platform powered by AI, featuring a Canva-style editor and beautiful Neopop UI design.

## 🚀 Features

- **AI-Powered Content Generation**: Answer questionnaires and let AI generate professional ebook content via OpenRouter
- **Canva-Style Editor**: Full-featured visual editor using Fabric.js for text editing, layout design, and image manipulation
- **Questionnaire System**: Create and manage questionnaire templates for structured content generation
- **Modern Neopop UI**: Beautiful, bold design using CRED's Neopop design system
- **Multi-Page Support**: Create books with multiple pages, add/remove/reorder pages easily
- **PDF Export**: Export your finished ebooks as high-quality PDFs
- **Auto-Save**: Never lose your work with automatic saving
- **User Authentication**: Secure authentication with NextAuth.js
- **MongoDB Database**: Robust NoSQL data storage with Prisma ORM

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI**: Neopop by CRED + TailwindCSS
- **Database**: MongoDB + Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: OpenRouter API
- **Canvas Editor**: Fabric.js
- **PDF Generation**: jsPDF
- **Forms**: React Hook Form + Zod

## 📋 Prerequisites

- Node.js 18+
- MongoDB database (MongoDB Atlas or local MongoDB instance)
- OpenRouter API key

## 🎯 Getting Started

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory with the following:

```env
# MongoDB Connection (use your MongoDB Atlas connection string)
DATABASE_URL="mongodb+srv://harsh:kkrpUunNIOzOJ9e9@cluster0.al1ddrw.mongodb.net/ebook-maker?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-change-this-in-production"
NEXTAUTH_URL="http://localhost:3000"

# OpenRouter API (ADD YOUR KEY HERE)
OPENROUTER_API_KEY="your-openrouter-api-key"
```

**Note**: Replace the DATABASE_URL with your MongoDB connection string. Make sure to append a database name (e.g., `/ebook-maker`) and connection options.

Get your OpenRouter API key from: https://openrouter.ai/

### 3. Database Setup

Push the schema to MongoDB (MongoDB uses `db push` instead of migrations):

```bash
npm run db:push
```

This will create the collections in your MongoDB database.

### 4. Seed Sample Data

```bash
npm run db:seed
```

This creates:
- A demo user (email: `demo@ebook.com`, password: `demo123456`)
- 3 sample questionnaire templates

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 How to Use

### For Users:

1. **Sign Up / Login**
   - Create an account or login with demo credentials
   - Email: `demo@ebook.com`
   - Password: `demo123456`

2. **Create a Book**
   - Click "Create New Book" from the dashboard
   - Select a questionnaire template
   - Answer all questions thoughtfully

3. **AI Generation**
   - Submit your answers
   - AI generates a complete ebook structure with chapters and content

4. **Edit Your Book**
   - Use the Canva-style editor to customize
   - Add headings, text, images
   - Adjust fonts, colors, and layouts
   - Manage multiple pages

5. **Export**
   - Save your work (auto-saves as you edit)
   - Export as PDF when ready

### For Admins:

1. **Create Questionnaires**
   - Navigate to Questionnaires section
   - Click "Create Questionnaire"
   - Add questions with different types:
     - Short text
     - Long text (textarea)
     - Multiple choice
     - Rating (1-5)
   - Publish when ready

2. **Manage Templates**
   - Edit existing questionnaires
   - Delete unused templates
   - Control what users can access

## 🎨 Design Philosophy

The application follows Neopop design principles:
- Bold, brutalist aesthetics
- High contrast and vibrant colors
- Strong borders and shadows
- Fun, engaging user experience
- Professional yet creative

## 📁 Project Structure

```
ebook-maker/
├── app/
│   ├── (auth)/              # Authentication pages
│   ├── (dashboard)/         # Protected dashboard pages
│   ├── admin/               # Admin pages (questionnaires)
│   ├── api/                 # API routes
│   └── page.tsx             # Landing page
├── components/
│   ├── landing/             # Landing page components
│   ├── editor/              # Canvas editor components
│   ├── ui/neopop/           # Neopop UI components
│   └── Providers.tsx        # Context providers
├── lib/
│   ├── prisma.ts            # Database client
│   ├── auth.ts              # NextAuth configuration
│   ├── openrouter.ts        # AI integration
│   └── pdf-generator.ts     # PDF export logic
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed script
└── types/
    └── index.ts             # TypeScript types
```

## 🔑 Key Features Explained

### AI Content Generation

Uses OpenRouter API with Claude 3.5 Sonnet to:
- Analyze questionnaire answers
- Generate book structure with chapters
- Create professional, engaging content
- Suggest chapter titles and flow

### Canvas Editor

Powered by Fabric.js for:
- Text manipulation (fonts, sizes, colors)
- Image uploads and positioning
- Layer management
- Undo/redo functionality
- Multi-page support
- Real-time preview

### Questionnaire System

Flexible question types:
- **Text**: Short answers
- **Textarea**: Long-form responses
- **Multiple Choice**: Select from options
- **Rating**: 1-5 scale

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm start
```

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio

## 🤝 Contributing

This is a demonstration project showcasing modern web development practices with Next.js, AI integration, and creative UI design.

## 📄 License

MIT

## 🎯 Future Enhancements

- [ ] Image upload and integration in editor
- [ ] More page templates (covers, layouts)
- [ ] Collaboration features
- [ ] Book marketplace
- [ ] Advanced typography controls
- [ ] Custom fonts integration
- [ ] Export to EPUB format
- [ ] AI-powered image generation
- [ ] Template library
- [ ] Version history

## 💡 Notes

- Make sure to add your own OpenRouter API key
- The demo user is for testing purposes
- Change NEXTAUTH_SECRET in production
- Update DATABASE_URL with your MongoDB connection string
- All Neopop components are customized for the project

---

**PothiGPT - Built with ❤️ using Next.js, Neopop, and AI**
