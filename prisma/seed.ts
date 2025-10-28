import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo123456', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@ebook.com' },
    update: {},
    create: {
      email: 'demo@ebook.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  })

  console.log('Created user:', user.email)

  // Create sample questionnaires
  const businessBookQuestionnaire = await prisma.questionnaire.upsert({
    where: { id: 'business-guide' },
    update: {},
    create: {
      id: 'business-guide',
      title: 'Business Strategy eBook Guide',
      description: 'Create a comprehensive business strategy ebook based on your expertise',
      isPublished: true,
      questions: [
        {
          id: 'q1',
          type: 'text',
          question: 'What is your business or industry focus?',
          required: true,
        },
        {
          id: 'q2',
          type: 'textarea',
          question: 'What are the main challenges your target audience faces?',
          required: true,
        },
        {
          id: 'q3',
          type: 'textarea',
          question: 'What unique insights or strategies can you share?',
          required: true,
        },
        {
          id: 'q4',
          type: 'multiple-choice',
          question: 'What is the experience level of your target readers?',
          options: ['Beginner', 'Intermediate', 'Advanced', 'All levels'],
          required: true,
        },
        {
          id: 'q5',
          type: 'textarea',
          question: 'What are the key outcomes readers should achieve after reading?',
          required: true,
        },
      ],
    },
  })

  const personalDevelopmentQuestionnaire = await prisma.questionnaire.upsert({
    where: { id: 'personal-dev' },
    update: {},
    create: {
      id: 'personal-dev',
      title: 'Personal Development eBook',
      description: 'Create an inspiring personal development ebook',
      isPublished: true,
      questions: [
        {
          id: 'q1',
          type: 'text',
          question: 'What is the main topic of personal growth you want to cover?',
          required: true,
        },
        {
          id: 'q2',
          type: 'textarea',
          question: 'What personal experiences or stories can you share?',
          required: true,
        },
        {
          id: 'q3',
          type: 'multiple-choice',
          question: 'What tone should the ebook have?',
          options: ['Motivational', 'Practical', 'Reflective', 'Mixed'],
          required: true,
        },
        {
          id: 'q4',
          type: 'textarea',
          question: 'What actionable steps will readers be able to take?',
          required: true,
        },
        {
          id: 'q5',
          type: 'rating',
          question: 'How detailed should the exercises and activities be? (1-5)',
          required: true,
        },
      ],
    },
  })

  const howToGuideQuestionnaire = await prisma.questionnaire.upsert({
    where: { id: 'how-to-guide' },
    update: {},
    create: {
      id: 'how-to-guide',
      title: 'How-To Guide eBook',
      description: 'Create a practical step-by-step guide',
      isPublished: true,
      questions: [
        {
          id: 'q1',
          type: 'text',
          question: 'What skill or process will you teach?',
          required: true,
        },
        {
          id: 'q2',
          type: 'textarea',
          question: 'Why is this skill important and who needs to learn it?',
          required: true,
        },
        {
          id: 'q3',
          type: 'textarea',
          question: 'What are the main steps involved in this process?',
          required: true,
        },
        {
          id: 'q4',
          type: 'textarea',
          question: 'What common mistakes should readers avoid?',
          required: true,
        },
        {
          id: 'q5',
          type: 'multiple-choice',
          question: 'What format works best for this guide?',
          options: ['Step-by-step tutorial', 'Case studies', 'Examples and exercises', 'Mixed approach'],
          required: true,
        },
      ],
    },
  })

  console.log('Created questionnaires:')
  console.log('- ', businessBookQuestionnaire.title)
  console.log('- ', personalDevelopmentQuestionnaire.title)
  console.log('- ', howToGuideQuestionnaire.title)

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

