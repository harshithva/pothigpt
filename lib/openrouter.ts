export async function generateBookContent(
  answers: Record<string, any>,
  questionnaireTitle: string
): Promise<any> {
  const prompt = `You are a professional ebook content generator. Based on the following questionnaire titled "${questionnaireTitle}" and user answers, generate a comprehensive ebook structure.

User Answers:
${JSON.stringify(answers, null, 2)}

Generate a detailed ebook with:
1. A compelling title
2. Table of contents
3. Multiple chapters (at least 5-7 chapters)
4. Each chapter should have:
   - Chapter title
   - Introduction
   - Main content (multiple paragraphs)
   - Key takeaways
   - Conclusion

Format your response as a JSON object with this structure:
{
  "title": "Book Title",
  "subtitle": "Book Subtitle",
  "chapters": [
    {
      "number": 1,
      "title": "Chapter Title",
      "introduction": "Introduction text",
      "content": ["Paragraph 1", "Paragraph 2", "Paragraph 3"],
      "keyTakeaways": ["Takeaway 1", "Takeaway 2"],
      "conclusion": "Conclusion text"
    }
  ]
}

Make the content professional, engaging, and valuable.`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content

    // Try to parse JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // Fallback if JSON parsing fails
    return {
      title: questionnaireTitle,
      subtitle: "Generated eBook",
      chapters: [
        {
          number: 1,
          title: "Introduction",
          introduction: content.substring(0, 500),
          content: [content],
          keyTakeaways: ["Generated from your answers"],
          conclusion: "This is your generated ebook."
        }
      ]
    }
  } catch (error) {
    console.error('Error generating book content:', error)
    throw error
  }
}

export async function improveContent(originalContent: string, instruction: string): Promise<string> {
  const prompt = `Improve the following content based on this instruction: "${instruction}"

Original content:
${originalContent}

Return only the improved content without any additional explanation.`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTAUTH_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error improving content:', error)
    throw error
  }
}

