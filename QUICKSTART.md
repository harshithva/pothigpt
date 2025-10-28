# Quick Start Guide - Professional eBook Maker

Get up and running in 5 minutes! 🚀

## Prerequisites

- Node.js 18+ installed
- OpenRouter API key (get one at https://openrouter.ai/)

## Step 1: Add Your API Key

Open `.env` file and add your OpenRouter API key:

```env
OPENROUTER_API_KEY="sk-or-v1-your-key-here"
```

> The database is already configured and seeded with sample data!

## Step 2: Start the Application

```bash
npm run dev
```

## Step 3: Access the App

Open your browser and go to:
```
http://localhost:3000
```

## Step 4: Login with Demo Account

Use these credentials:
- **Email**: `demo@ebook.com`
- **Password**: `demo123456`

## What to Try First

### 1. Create Your First eBook

1. Click "Create New Book" from the dashboard
2. Select a questionnaire template (try "Business Strategy")
3. Answer all the questions thoughtfully
4. Click "Generate Book with AI"
5. Wait for AI to generate your content (30-60 seconds)
6. Start editing in the canvas editor!

### 2. Use the Canvas Editor

- **Add Heading**: Click "Heading" button
- **Add Text**: Click "Text" button
- **Edit Text**: Double-click any text on canvas
- **Change Color**: Select text, then click a color
- **Change Size**: Select text, adjust font size
- **Add Pages**: Click "+ Add Page"
- **Navigate**: Click page buttons to switch
- **Save**: Click "Save" button (or auto-saves)

### 3. Create a New Questionnaire

1. Go to "Questionnaires" in the top menu
2. Click "Create Questionnaire"
3. Add a title and description
4. Add questions (choose from 4 types)
5. Click "Publish" when done

### 4. Export Your Book

1. Open a book in the editor
2. Click "Export PDF" button
3. Your PDF will download!

## Sample Questionnaires Included

Three ready-to-use templates:

1. **Business Strategy eBook Guide**
   - For business and strategy content
   
2. **Personal Development eBook**
   - For self-improvement and growth content
   
3. **How-To Guide eBook**
   - For step-by-step tutorials

## Explore the Features

### Landing Page
- Visit http://localhost:3000
- See the modern Neopop design
- Scroll through features and testimonials

### Dashboard
- View all your books
- Search and filter
- See book status (Draft/Published)

### Admin Panel
- Manage questionnaires
- Create new templates
- Edit existing ones

## Troubleshooting

### Can't generate books?
- Make sure you added your OpenRouter API key to `.env`
- Restart the dev server after adding the key

### Database issues?
- Run: `npm run db:push`
- Then: `npm run db:seed`

### Port already in use?
- Kill the process: `lsof -ti:3000 | xargs kill`
- Or change port: `PORT=3001 npm run dev`

## Useful Commands

```bash
# Start development server
npm run dev

# View database
npm run db:studio

# Reseed database
npm run db:seed

# Build for production
npm run build
npm start
```

## Key Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Delete selected | Delete key |
| Save | Cmd/Ctrl + S |

## Tips for Best Results

### When Answering Questions:
- Be specific and detailed
- Provide context and examples
- Think about your target audience
- Include actionable insights

### When Using the Editor:
- Start with the generated content
- Add your own headings
- Use multiple pages for chapters
- Experiment with colors and sizes
- Save frequently

### Creating Questionnaires:
- 5-10 questions work best
- Mix question types
- Make questions clear and specific
- Use multiple choice for categories
- Use textarea for detailed responses

## Next Steps

1. **Create Your First Book**
   - Select a questionnaire
   - Answer the questions
   - Generate and edit

2. **Customize the Editor**
   - Add your own text
   - Change colors and fonts
   - Add multiple pages

3. **Explore Advanced Features**
   - Create custom questionnaires
   - Try different content types
   - Export and share PDFs

4. **Deploy to Production** (Optional)
   - Build: `npm run build`
   - Deploy to Vercel, Netlify, or your preferred platform
   - Update environment variables

## Need Help?

- **README.md** - Full documentation
- **IMPLEMENTATION_SUMMARY.md** - Technical details
- Check the console for error messages
- Inspect Network tab for API issues

## What's Included?

✅ Complete authentication system
✅ AI-powered content generation
✅ Professional canvas editor
✅ Questionnaire management
✅ Beautiful Neopop UI
✅ Sample data and templates
✅ PDF export functionality

## Have Fun Creating!

You're all set to create amazing ebooks with AI! 🎨📚✨

Remember:
- Experiment with the editor
- Try different questionnaires
- Create unique designs
- Export and share your books

**Happy Creating!** 🚀

