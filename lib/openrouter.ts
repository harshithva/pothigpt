import type { SimplifiedBookInput } from '@/types'

// Provider type definition
type AIProvider = 'openrouter' | 'openai'

// Provider configuration interface
interface ProviderConfig {
  apiKey: string
  model: string
  baseUrl: string
  headers: Record<string, string>
}

// Chat completion options
interface ChatCompletionOptions {
  temperature?: number
  max_tokens?: number
}

// Get the configured AI provider
function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER || 'openrouter').toLowerCase()
  if (provider === 'openai' || provider === 'openrouter') {
    return provider
  }
  console.warn(`[AI Provider] Invalid provider "${provider}", defaulting to "openrouter"`)
  return 'openrouter'
}

// Get provider configuration based on selected provider
function getProviderConfig(): ProviderConfig {
  const provider = getAIProvider()
  
  if (provider === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is required when AI_PROVIDER=openai')
    }
    
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    
    return {
      apiKey,
      model,
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    }
  } else {
    // OpenRouter (default)
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY is required when AI_PROVIDER=openrouter')
    }
    
    const model = process.env.OPENROUTER_MODEL || 'z-ai/glm-4.5-air:free'
    
    return {
      apiKey,
      model,
      baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'X-Title': 'PothiGPT eBook Maker',
      }
    }
  }
}

// Unified chat completion function
export async function chatCompletion(
  messages: Array<{ role: string; content: string }>,
  options: ChatCompletionOptions = {}
): Promise<string> {
  const provider = getAIProvider()
  const config = getProviderConfig()
  
  const { temperature = 0.7, max_tokens = 8000 } = options
  
  const logPrefix = provider === 'openai' ? '[OpenAI]' : '[OpenRouter]'
  console.log(`${logPrefix} Making API request to ${config.baseUrl}`)
  console.log(`${logPrefix} Using model: ${config.model}`)
  
  const response = await fetch(config.baseUrl, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify({
      model: config.model,
      messages,
      temperature,
      max_tokens,
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`${logPrefix} API error:`, response.status, errorText)
    throw new Error(`${provider === 'openai' ? 'OpenAI' : 'OpenRouter'} API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error(`${logPrefix} Invalid response structure:`, data)
    throw new Error(`Invalid response from ${provider === 'openai' ? 'OpenAI' : 'OpenRouter'} API`)
  }
  
  const content = data.choices[0].message.content
  console.log(`${logPrefix} Received response (${content.length} chars)`)
  
  return content
}

export async function generateBookContent(
  answers: Record<string, any>,
  questionnaireTitle: string
): Promise<any> {
  const prompt = `You are a professional ebook content generator. Based on the questionnaire "${questionnaireTitle}" and the user's answers below, create a detailed ebook.

User Answers:
${JSON.stringify(answers, null, 2)}

IMPORTANT: You must respond with ONLY a valid JSON object. Do not include any other text before or after the JSON.

Generate an ebook with this EXACT JSON structure:
{
  "title": "Compelling Book Title Here",
  "subtitle": "Engaging Subtitle Here",
  "chapters": [
    {
      "number": 1,
      "title": "Chapter 1 Title",
      "introduction": "A detailed introduction paragraph for this chapter explaining what will be covered.",
      "content": [
        "First detailed paragraph with substantial content.",
        "Second detailed paragraph with more information.",
        "Third detailed paragraph expanding on the topic."
      ],
      "keyTakeaways": [
        "First important takeaway",
        "Second important takeaway"
      ],
      "conclusion": "A summary paragraph concluding this chapter."
    }
  ]
}

Create at least 5 chapters with rich, detailed content. Each content paragraph should be at least 3-4 sentences long.`

  try {
    const provider = getAIProvider()
    const logPrefix = provider === 'openai' ? '[OpenAI]' : '[OpenRouter]'
    console.log(`${logPrefix} Starting book generation...`)
    
    const content = await chatCompletion(
      [
        {
          role: 'user',
          content: prompt
        }
      ],
      {
        temperature: 0.7,
        max_tokens: 8000,
      }
    )
    
    console.log(`${logPrefix} Generated content length:`, content.length)
    console.log(`${logPrefix} Content preview:`, content.substring(0, 300))

    // Try to parse JSON from the response
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      // Try to find JSON between code blocks
      const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      if (codeBlockMatch) {
        jsonMatch = [codeBlockMatch[1]]
      }
    }
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        console.log(`${logPrefix} Successfully parsed JSON with`, parsed.chapters?.length || 0, 'chapters')
        return parsed
      } catch (parseError) {
        console.error(`${logPrefix} JSON parse error:`, parseError)
        console.error(`${logPrefix} Failed to parse:`, jsonMatch[0].substring(0, 500))
      }
    }

    // Enhanced fallback with more chapters
    console.warn(`${logPrefix} Using fallback content structure`)
    return {
      title: questionnaireTitle || "Your eBook",
      subtitle: "Generated from your answers",
      chapters: [
        {
          number: 1,
          title: "Introduction",
          introduction: "Welcome to your personalized ebook. This content has been generated based on your specific requirements and preferences.",
          content: [
            content.substring(0, 500) || "This is your generated ebook content. The AI has created this based on your answers to help you achieve your goals.",
            "Each chapter in this book is designed to provide valuable insights and practical knowledge that you can apply immediately.",
            "As you progress through the chapters, you'll discover detailed information carefully crafted for your needs."
          ],
          keyTakeaways: [
            "Personalized content based on your answers",
            "Practical and actionable information"
          ],
          conclusion: "This chapter sets the foundation for your learning journey."
        },
        {
          number: 2,
          title: "Getting Started",
          introduction: "Let's dive into the fundamentals and establish a strong foundation for your journey.",
          content: [
            "Understanding the basics is crucial for success in any endeavor. This chapter will guide you through essential concepts.",
            "We'll explore practical approaches that you can implement right away to see immediate results.",
            "By the end of this chapter, you'll have a clear roadmap for moving forward with confidence."
          ],
          keyTakeaways: [
            "Master the fundamental concepts",
            "Implement practical strategies"
          ],
          conclusion: "You're now ready to move to more advanced topics."
        },
        {
          number: 3,
          title: "Advanced Techniques",
          introduction: "Building on the foundation, we'll explore more sophisticated approaches and strategies.",
          content: [
            "Advanced techniques require practice and dedication, but the rewards are well worth the effort.",
            "In this chapter, we'll examine real-world applications and case studies that demonstrate proven success.",
            "You'll learn how to adapt these techniques to your specific situation for maximum impact."
          ],
          keyTakeaways: [
            "Apply advanced strategies effectively",
            "Learn from real-world examples"
          ],
          conclusion: "These advanced techniques will set you apart from others."
        },
        {
          number: 4,
          title: "Practical Applications",
          introduction: "Theory is important, but practical application is where real growth happens.",
          content: [
            "This chapter focuses on hands-on implementation of everything you've learned so far.",
            "We'll work through specific scenarios and provide step-by-step guidance for common situations.",
            "By practicing these applications, you'll build confidence and competence in your skills."
          ],
          keyTakeaways: [
            "Gain hands-on experience",
            "Build practical skills"
          ],
          conclusion: "Practice makes perfect - keep applying what you've learned."
        },
        {
          number: 5,
          title: "Moving Forward",
          introduction: "As we conclude, let's look at how to continue your growth and maintain momentum.",
          content: [
            "Success is a journey, not a destination. This final chapter provides guidance for ongoing development.",
            "We'll discuss strategies for staying motivated and continuing to learn and grow over time.",
            "Remember that every expert was once a beginner who refused to give up."
          ],
          keyTakeaways: [
            "Maintain long-term growth",
            "Stay motivated and committed"
          ],
          conclusion: "Your journey doesn't end here - it's just beginning. Keep learning and growing!"
        }
      ]
    }
  } catch (error) {
    const provider = getAIProvider()
    const logPrefix = provider === 'openai' ? '[OpenAI]' : '[OpenRouter]'
    console.error(`${logPrefix} Error generating book content:`, error)
    throw error
  }
}

export async function generateChapterOutline({
  bookType,
  audience,
  bookTitle,
  chapterCount,
}: SimplifiedBookInput): Promise<any> {
  const tone = audience === 'kids'
    ? 'Write in an imaginative, age-appropriate, encouraging voice that balances fun and clear explanations.'
    : 'Write in a polished, engaging, professional tone suited for mature readers.'

  const categoryDescriptor =
    bookType === 'fiction'
      ? `${audience === 'kids' ? 'Children' : 'Adult'} Fiction`
      : `${audience === 'kids' ? 'Children' : 'Adult'} Non-fiction`

  const prompt = `You are a master book editor tasked with crafting a chapter blueprint for a ${categoryDescriptor} title called "${bookTitle}".

Follow these rules carefully:
• Produce exactly ${chapterCount} core chapters unless the concept absolutely requires fewer (avoid combining chapters).
• Each chapter must be substantial, progression-based, and able to support 5-10 richly written pages.
• Every chapter needs 4 to 6 compelling subheadings that would translate to strong section prompts.
• Avoid duplicate chapter names or repetitive subheadings; keep them chronological and escalating.
• Include a prologue and/or epilogue only if they make the book feel complete for this genre/audience.
• ${tone}

Return ONLY valid JSON in this exact structure (no prose, no markdown):
{
  "title": "${bookTitle}",
  "audience": "${audience}",
  "category": "${categoryDescriptor}",
  "prologue": {
    "title": "Optional prologue title",
    "summary": "2 sentence overview"
  },
  "chapters": [
    {
      "number": 1,
      "heading": "Chapter heading",
      "summary": "2-3 sentence summary describing the arc of this chapter",
      "subheadings": [
        "Subheading 1",
        "Subheading 2",
        "Subheading 3",
        "Subheading 4"
      ]
    }
  ],
  "epilogue": {
    "title": "Optional epilogue title",
    "summary": "2 sentence overview"
  }
}

Important formatting requirements:
• Subheadings must be phrased as clear action-oriented or descriptive section titles (no numbering, no emojis).
• Do not mention prologue/epilogue keys if they are irrelevant—omit them entirely.
• Keep JSON tidy with arrays and strings only; never include null or empty strings.`

  try {
    const provider = getAIProvider()
    const logPrefix = provider === 'openai' ? '[OpenAI]' : '[OpenRouter]'
    console.log(`${logPrefix} Generating chapter outline...`)
    
    const content = await chatCompletion(
      [
        {
          role: 'user',
          content: prompt
        }
      ],
      {
        temperature: 0.7,
        max_tokens: 2000,
      }
    )
    
    console.log(`${logPrefix} Outline content preview:`, content.substring(0, 300))

    // Try to parse JSON from the response
    let jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/)
      if (codeBlockMatch) {
        jsonMatch = [codeBlockMatch[1]]
      }
    }
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])

        if (Array.isArray(parsed?.chapters)) {
          parsed.chapters = parsed.chapters.map((chapter: any, index: number) => {
            const subheadings = Array.isArray(chapter?.subheadings)
              ? chapter.subheadings.filter((item: any) => typeof item === 'string' && item.trim())
              : []

            const heading = chapter?.heading || chapter?.title || `Chapter ${index + 1}`
            const summary = chapter?.summary || chapter?.description || ''

            return {
              ...chapter,
              number: typeof chapter?.number === 'number' ? chapter.number : index + 1,
              heading,
              title: chapter?.title || heading,
              summary,
              description: chapter?.description || summary,
              subheadings,
            }
          })
        }

        if (parsed?.prologue) {
          parsed.prologue = {
            ...parsed.prologue,
            title: parsed.prologue.title || 'Prologue',
            summary: parsed.prologue.summary || parsed.prologue.description || '',
            description: parsed.prologue.description || parsed.prologue.summary || '',
          }
        }

        if (parsed?.epilogue) {
          parsed.epilogue = {
            ...parsed.epilogue,
            title: parsed.epilogue.title || 'Epilogue',
            summary: parsed.epilogue.summary || parsed.epilogue.description || '',
            description: parsed.epilogue.description || parsed.epilogue.summary || '',
          }
        }

        console.log(`${logPrefix} Successfully parsed outline with`, parsed.chapters?.length || 0, 'chapters')
        return parsed
      } catch (parseError) {
        console.error(`${logPrefix} JSON parse error:`, parseError)
      }
    }

    // Fallback outline with simple scaffolding
    const defaultSubheads = [
      'Opening Context',
      'Key Idea One',
      'Key Idea Two',
      'Practical Application',
      'Reflection'
    ]

    return {
      title: bookTitle,
      audience,
      category: categoryDescriptor,
      chapters: Array.from({ length: Math.max(5, chapterCount) }).map((_, index) => ({
        number: index + 1,
        heading: `Chapter ${index + 1}: Placeholder Heading`,
        summary: 'This chapter will expand upon the main theme with detailed insights and examples.',
        subheadings: defaultSubheads.slice(0, 4),
      })),
    }
  } catch (error) {
    const provider = getAIProvider()
    const logPrefix = provider === 'openai' ? '[OpenAI]' : '[OpenRouter]'
    console.error(`${logPrefix} Error generating outline:`, error)
    throw error
  }
}

export async function generateChapterContent(
  chapterNumber: number,
  chapterTitle: string,
  bookTitle: string,
  answers: Record<string, any>,
  conversationHistory: Array<{ role: string; content: string }> = []
): Promise<{ content: string; updatedHistory: Array<{ role: string; content: string }> }> {
  const prompt = `You are writing Chapter ${chapterNumber}: "${chapterTitle}" for the ebook "${bookTitle}".

${conversationHistory.length > 0 ? 'Previous chapters context is provided above.' : ''}

Based on the user's original requirements:
${JSON.stringify(answers, null, 2)}

Write a comprehensive, book-quality chapter with substantial depth and detail. The chapter should be approximately 5-10 pages when formatted, which translates to:

1. An engaging introduction (3-4 paragraphs) that hooks the reader and sets context
2. Main content sections with detailed explanations, examples, and insights (10-15 paragraphs minimum)
   - Break complex ideas into digestible sections
   - Include practical examples, case studies, or anecdotes where relevant
   - Provide thorough explanations and reasoning
   - Use subheadings or clear transitions between major points
3. Key takeaways or summary points (4-6 bullet points or short paragraphs)
4. A strong conclusion (2-3 paragraphs) that reinforces key points and provides forward momentum

Write in a professional, engaging style appropriate for a published ebook. The content should be substantial enough to warrant its own chapter. Develop ideas fully rather than rushing through topics. Each paragraph should be 3-5 sentences with meaningful content.

Make it practical, engaging, and build upon previous chapters. Write in a clear, accessible yet authoritative style suitable for a real book.`

  try {
    const provider = getAIProvider()
    const logPrefix = provider === 'openai' ? '[OpenAI]' : '[OpenRouter]'
    console.log(`${logPrefix} Generating Chapter ${chapterNumber}...`)
    
    // Build messages array with conversation history
    const messages = [
      ...conversationHistory,
      {
        role: 'user',
        content: prompt
      }
    ]
    
    const chapterContent = await chatCompletion(
      messages,
      {
        temperature: 0.7,
        max_tokens: 8000,
      }
    )
    
    console.log(`${logPrefix} Generated Chapter ${chapterNumber} (${chapterContent.length} chars)`)
    
    // Update conversation history with this chapter
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: prompt },
      { role: 'assistant', content: chapterContent }
    ]
    
    return {
      content: chapterContent,
      updatedHistory
    }
  } catch (error) {
    const provider = getAIProvider()
    const logPrefix = provider === 'openai' ? '[OpenAI]' : '[OpenRouter]'
    console.error(`${logPrefix} Error generating chapter ${chapterNumber}:`, error)
    throw error
  }
}

export async function improveContent(originalContent: string, instruction: string): Promise<string> {
  const prompt = `Improve the following content based on this instruction: "${instruction}"

Original content:
${originalContent}

Return only the improved content without any additional explanation.`

  try {
    const provider = getAIProvider()
    const logPrefix = provider === 'openai' ? '[OpenAI]' : '[OpenRouter]'
    
    const improvedContent = await chatCompletion(
      [
        {
          role: 'user',
          content: prompt
        }
      ],
      {
        temperature: 0.7,
        max_tokens: 4000,
      }
    )
    
    return improvedContent
  } catch (error) {
    const provider = getAIProvider()
    const logPrefix = provider === 'openai' ? '[OpenAI]' : '[OpenRouter]'
    console.error(`${logPrefix} Error improving content:`, error)
    throw error
  }
}

// Re-export book generator functions for convenience
export {
  generateNonFictionPrompts,
  generateFictionPrompts,
  generateNonFictionContent,
  generateFictionContent,
  generateNonFictionChapter,
  generateFictionChapter
} from '@/lib/book-generators'

