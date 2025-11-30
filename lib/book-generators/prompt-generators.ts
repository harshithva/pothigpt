// Prompt generation functions for all book types
import { chatCompletion } from '@/lib/openrouter'
import { cleanJsonString, parseChapterTitles, parseChapterGoals } from './utils'
import type { BookGenerationInput, NonFictionPrompts, FictionPrompts, FictionContext } from './types'

/**
 * Generate book description for non-fiction books
 */
export async function generateBookDescription(
  bookTitle: string,
  audience: 'adult' | 'kids'
): Promise<string> {
  const isKids = audience === 'kids'
  const prompt = isKids
    ? `Using the title '${bookTitle}', assume this is a non-fiction book for children ages 6-12. Write an engaging, two-sentence description that introduces the topic in a fun way, explains why it's interesting, and hints at what young readers will learn. Use simple, exciting language that makes kids want to read more.`
    : `Using the title '${bookTitle}', assume this is a non-fiction book for an advanced adult audience. Write an engaging, three-sentence description introducing the topic, exploring key insights, and hinting at what readers will gain.`

  return await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, max_tokens: 500 }
  )
}

/**
 * Generate genre and target audience for a book
 */
export async function generateGenreAndTargetAudience(
  title: string,
  audience: 'adult' | 'kids'
): Promise<{ genre: string; targetAudience: string }> {
  const isKids = audience === 'kids'
  const prompt = isKids
    ? `For the children's book titled '${title}', suggest the most suitable educational genre and ideal age range. Return as JSON: {"genre": "...", "audience": "..."}`
    : `For the book titled '${title}', suggest the most suitable genre and ideal target audience. Return as JSON: {"genre": "...", "audience": "..."}`

  try {
    const response = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.7, max_tokens: 200 }
    )
    const data = JSON.parse(cleanJsonString(response))
    return {
      genre: data.genre || (isKids ? 'Educational' : 'Self-Help'),
      targetAudience: data.audience || (isKids ? 'Ages 6-12' : 'Adults')
    }
  } catch (error) {
    console.error(`Failed to parse genre/audience for '${title}':`, error)
    return {
      genre: isKids ? 'Educational' : 'Self-Help',
      targetAudience: isKids ? 'Ages 6-12' : 'Adults'
    }
  }
}

/**
 * Generate chapter titles and subheadings for non-fiction books
 */
export async function generateChapterTitlesAndSubheadings(
  title: string,
  chapters: number,
  description: string,
  structure: string,
  audience: 'adult' | 'kids'
): Promise<{ titles: string[]; subheadings: string[][] }> {
  const isKids = audience === 'kids'
  const subheadingCount = isKids ? 3 : 4
  const prompt = isKids
    ? `Create a list of ${chapters} fun chapter titles and ${subheadingCount} simple subheadings per chapter for a children's book titled '${title}' based on this description: ${description}. Structure should be ${structure}. Make titles exciting and educational. Keep subheadings simple and engaging for kids. Return as JSON like: {"chapters": [{"title": "...", "subheadings": ["...", "...", "..."]}, ...]}`
    : `Create a list of ${chapters} chapter titles and ${subheadingCount} subheadings per chapter for a book titled '${title}' based on this description: ${description}. Structure should be ${structure}. Return as JSON like: {"chapters": [{"title": "...", "subheadings": ["...", "...", "...", "..."]}, ...]}`

  try {
    const response = await chatCompletion(
      [{ role: 'user', content: prompt }],
      { temperature: 0.7, max_tokens: 2000 }
    )
    const data = JSON.parse(cleanJsonString(response))
    const titles = data.chapters?.map((c: any) => c.title) || []
    const subheadings = data.chapters?.map((c: any) => c.subheadings || []) || []
    return { titles, subheadings }
  } catch (error) {
    console.error(`Failed to parse chapter titles JSON for '${title}':`, error)
    return { titles: [], subheadings: [] }
  }
}

/**
 * Generate complete non-fiction prompts structure
 */
export async function generateNonFictionPrompts(
  input: BookGenerationInput
): Promise<NonFictionPrompts> {
  const { title, audience, chaptersRequired = 10, chapterStructure = 'Progressive' } = input
  const isKids = audience === 'kids'

  console.log(`[Non-Fiction Prompts] Generating for: ${title} (${audience})`)

  // Generate description
  const description = await generateBookDescription(title, audience)

  // Generate genre and audience
  const { genre, targetAudience } = await generateGenreAndTargetAudience(title, audience)

  // Generate chapter titles and subheadings
  const { titles, subheadings } = await generateChapterTitlesAndSubheadings(
    title,
    chaptersRequired,
    description,
    chapterStructure,
    audience
  )

  if (titles.length === 0) {
    throw new Error(`Failed to generate chapters for '${title}'`)
  }

  // Create intro prompt - match Python code exactly
  const introWordCount = isKids ? 800 : 1500
  const introPrompt = isKids
    ? `Write a ${introWordCount}-word engaging and fun introduction for the children's book '${title}'. Focus on the key themes: ${description}. Use simple language, fun facts, and exciting examples. Make it interesting for kids ages 6-12. Avoid using headings. IMPORTANT: Write exactly ${introWordCount} words or more. Be thorough and detailed.`
    : `Write a ${introWordCount}-word engaging and informative introduction for the non-fiction book '${title}'. Focus on the key themes: ${description}. Use storytelling, context, and a preview of what's inside. Avoid using headings. IMPORTANT: Write exactly ${introWordCount} words or more. Be thorough and detailed.`

  // Build chapter prompts
  const chapters = titles.map((chapterTitle, i) => {
    const chapterIntroWordCount = isKids ? 100 : 200
    const chapterIntro = isKids
      ? `Write a ${chapterIntroWordCount}-word fun introduction for Chapter ${i + 1}, titled '${chapterTitle}', in the children's book '${title}'. Start with an exciting hook that makes kids curious. Use simple language. Do not repeat the chapter title. Make it sound like an adventure or discovery. IMPORTANT: Write exactly ${chapterIntroWordCount} words or more.`
      : `Write a ${chapterIntroWordCount}-word introduction for Chapter ${i + 1}, titled '${chapterTitle}', in the book '${title}'. Start with an emotional or insightful hook. Do not repeat the chapter title. Set context and build reader interest. IMPORTANT: Write exactly ${chapterIntroWordCount} words or more.`

    const subheadingPrompts = (subheadings[i] || []).map((subheading, j) => {
      const subheadingWordCount = isKids ? 300 : 500
      const prompt = isKids
        ? `Write a ${subheadingWordCount}-word engaging section on '${subheading}' for Chapter ${i + 1} of the children's book '${title}'. Include fun examples, simple explanations, and interactive elements. Use age-appropriate language for kids ages 6-12. Make it exciting and educational. Maintain continuity and avoid repeating the chapter title. IMPORTANT: Write exactly ${subheadingWordCount} words or more. Be thorough and detailed with examples and explanations.`
        : `Write a ${subheadingWordCount}-word engaging section on '${subheading}' for Chapter ${i + 1} of '${title}'. Include real-world examples, useful strategies, and a warm, professional tone. Maintain continuity and avoid repeating the chapter title. IMPORTANT: Write exactly ${subheadingWordCount} words or more. Be thorough and detailed with examples, strategies, and practical insights.`

      return { title: subheading, prompt }
    })

    return {
      chapterTitle: `Chapter ${i + 1}: ${chapterTitle}`,
      chapterIntro,
      subheadings: subheadingPrompts
    }
  })

  return {
    bookTitle: title,
    introPrompt,
    chapters,
    genre,
    targetAudience
  }
}

/**
 * Generate main plot outline for fiction books
 */
export async function generateMainOutline(
  title: string,
  genre: string,
  subGenre: string,
  premiseTheme: string,
  toneStyle: string,
  setting: string,
  characters: string,
  audience: 'adult' | 'kids'
): Promise<string> {
  const isKids = audience === 'kids'
  const wordCount = isKids ? 150 : 200
  const prompt = isKids
    ? `Generate a ~${wordCount}-word, simple 3-act story outline for a children's book titled '${title}' (${genre}/${subGenre}).\nCore Premise: ${premiseTheme}.\nMain Characters: ${characters}.\nSetting: ${setting}.\nTone/Style: ${toneStyle}.\nTarget Audience: ${audience}.\nFocus on a clear beginning, middle, and end. Keep it simple and positive. Use age-appropriate language. Include themes of friendship, courage, or learning. End with a happy resolution that teaches a gentle lesson.`
    : `Generate a ~${wordCount}-word, 3-act story outline for a novel titled '${title}' (${genre}/${subGenre}).\nCore Premise: ${premiseTheme}.\nMain Characters: ${characters}.\nSetting: ${setting}.\nTone/Style: ${toneStyle}.\nTarget Audience: ${audience}.\nFocus on a clear beginning, middle, and end. Keep it concise, with subtle foreshadowing. Use a warm, human voice. End by hinting at the ultimate resolution.`

  return await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, max_tokens: isKids ? 4000 : 6000 }
  )
}

/**
 * Generate character profiles for fiction books
 */
export async function generateCharacterProfiles(
  plotOutline: string,
  characters: string,
  audience: 'adult' | 'kids'
): Promise<string> {
  const isKids = audience === 'kids'
  const prompt = isKids
    ? `Write 1-2 line character profiles for these characters: ${characters}\nIn the context of this children's story:\n${plotOutline}\n\nTarget Audience: ${audience}.\nFocus on positive traits, what they like to do, and how they help others. Use simple, warm language. Make characters relatable to children. Include their favorite activities or things they're good at.`
    : `Write 2-3 line character profiles for these characters: ${characters}\nIn the context of this story:\n${plotOutline}\n\nTarget Audience: ${audience}.\nFocus on their motivations, strengths, and how they contribute to the narrative. Use a natural, human voice.`

  return await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, max_tokens: isKids ? 4000 : 6000 }
  )
}

/**
 * Generate conflicts and resolutions for fiction books
 */
export async function generateConflictsResolutions(
  plotOutline: string,
  audience: 'adult' | 'kids'
): Promise<string> {
  const isKids = audience === 'kids'
  const wordCount = isKids ? 60 : 100
  const prompt = isKids
    ? `In under ${wordCount} words, list the main gentle conflicts and how they resolve happily, based on this children's story:\n\n${plotOutline}\n\nTarget Audience: ${audience}.\nFocus on simple problems like sharing, being brave, or learning something new. Show how characters work together to solve problems. Use encouraging language.`
    : `In under ${wordCount} words, list the main conflicts and their resolutions, based on this story:\n\n${plotOutline}\n\nTarget Audience: ${audience}.\nFocus on character-driven conflicts and how they resolve through growth and action.`

  return await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, max_tokens: 500 }
  )
}

/**
 * Generate foreshadowing clues for fiction books
 */
export async function generateForeshadowing(
  plotOutline: string,
  audience: 'adult' | 'kids'
): Promise<string> {
  const isKids = audience === 'kids'
  const wordCount = isKids ? 50 : 80
  const prompt = isKids
    ? `Identify some gentle hints (under ${wordCount} words) for this children's story:\n\n${plotOutline}\n\nTarget Audience: ${audience}.\nExplain briefly how these clues hint at happy surprises or helpful solutions without being scary or confusing for children.`
    : `Identify some subtle foreshadowing elements (under ${wordCount} words) for this story:\n\n${plotOutline}\n\nTarget Audience: ${audience}.\nExplain how these clues hint at future developments without being too obvious.`

  return await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, max_tokens: 400 }
  )
}

/**
 * Generate subplots for fiction books
 */
export async function generateSubplots(
  title: string,
  genre: string,
  subGenre: string,
  plotOutline: string,
  audience: 'adult' | 'kids',
  numSubplots: number = 3
): Promise<string> {
  const isKids = audience === 'kids'
  const wordCount = isKids ? 30 : 50
  const numSubs = isKids ? 2 : numSubplots
  const prompt = isKids
    ? `Based on this main plot outline for the children's book '${title}' (${genre}/${subGenre}):\n\n${plotOutline}\n\nTarget Audience: ${audience}.\nGenerate ${numSubs} simple subplots, each around ${wordCount} words. Each subplot should revolve around friendship, helping others, or learning something new. Include gentle emotional moments and show how characters help each other. Write in a warm, child-friendly voice. Keep conflicts mild and always resolvable.`
    : `Based on this main plot outline for '${title}' (${genre}/${subGenre}):\n\n${plotOutline}\n\nTarget Audience: ${audience}.\nGenerate ${numSubs} subplots, each around ${wordCount} words. Each subplot should revolve around a secondary character or a personal challenge that adds depth to the story. Include emotional beats, small calm/tender moments, and show how it ties back subtly. Write in a natural, human voice without rehashing the entire main conflict.`

  return await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, max_tokens: isKids ? 4000 : 6000 }
  )
}

/**
 * Generate chapter goals for fiction books
 */
export async function generateChapterGoals(
  plotOutline: string,
  subplots: string,
  audience: 'adult' | 'kids',
  numChapters: number
): Promise<string[]> {
  const prompt = `Combine the main plot outline:\n${plotOutline}\n\nWith these subplots:\n${subplots}\n\nNow break everything into ${numChapters} ${audience === 'kids' ? 'simple ' : ''}chapter goals (${audience === 'kids' ? '1 line each' : '1-2 lines each'}). Target Audience: ${audience}.\n${audience === 'kids' ? 'Mention how subplots weave in gently. Provide variety in emotional beats. Ensure each chapter moves the story forward with positive messages. Include moments of friendship, discovery, or gentle problem-solving. Write in a warm, encouraging style suitable for children.' : 'Mention how subplots weave in. Provide variety in emotional beats. Ensure each chapter moves the story forward, includes some foreshadowing, and builds tension toward a final confrontation. Write in a human-sounding style.'}`

  const response = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, max_tokens: 4000 }
  )

  return parseChapterGoals(response, numChapters)
}

/**
 * Generate chapter titles for fiction books
 */
export async function generateChapterTitles(
  plotOutline: string,
  audience: 'adult' | 'kids',
  numChapters: number
): Promise<string[]> {
  const prompt = `Generate ${numChapters} ${audience === 'kids' ? 'short, fun ' : ''}chapter titles for this ${audience === 'kids' ? "children's book" : 'book'}:\n\n${plotOutline}\n\nTarget Audience: ${audience}.\n${audience === 'kids' ? 'Write them as a simple list (1. Title...). Use playful, encouraging words. Avoid scary or confusing titles. Make them sound exciting and positive.' : 'Write them as a simple list (1. Title...). Make them engaging and hint at the chapter content.'}`

  const response = await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, max_tokens: 2000 }
  )

  return parseChapterTitles(response)
}

/**
 * Generate prologue for fiction books
 */
export async function generatePrologue(
  title: string,
  premiseTheme: string,
  toneStyle: string,
  plotOutline: string,
  characterProfiles: string,
  conflictsResolutions: string,
  foreshadowingClues: string,
  audience: 'adult' | 'kids'
): Promise<string> {
  const isKids = audience === 'kids'
  const wordCount = isKids ? '100-150' : '150-200'
  const prompt = `Write a prologue for the ${isKids ? "children's book" : 'book'} '${title}' (~${wordCount} words) with a ${isKids ? 'warm, friendly' : toneStyle} voice (tone: ${toneStyle}).\nIntroduce the main characters and setting ${isKids ? 'in a gentle way' : ''}. Set up the adventure or learning journey.\nTarget Audience: ${audience}.\n\nReferences:\n- Plot Outline: ${plotOutline}\n- Characters: ${characterProfiles}\n- Conflicts: ${conflictsResolutions}\n- Foreshadowing: ${foreshadowingClues}\n\nDo not include any heading or title. Start directly with the narrative text.\n${isKids ? 'Use simple sentences and positive language. Make it exciting but not scary.' : 'Use engaging prose that draws readers in.'}`

  return await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, max_tokens: isKids ? 4000 : 6000 }
  )
}

/**
 * Generate epilogue for fiction books
 */
export async function generateEpilogue(
  title: string,
  toneStyle: string,
  plotOutline: string,
  characterProfiles: string,
  audience: 'adult' | 'kids'
): Promise<string> {
  const isKids = audience === 'kids'
  const wordCount = isKids ? 150 : 200
  const prompt = `Write an epilogue (~${wordCount} words) for the ${isKids ? "children's book" : 'book'} '${title}' in a ${toneStyle} style.\n${isKids ? 'Reflect on the happy ending, how the characters feel, and what they learned.' : 'Reflect on the resolution, character growth, and the story\'s conclusion.'}\nTarget Audience: ${audience}.\n\nReferences:\n- Plot Outline: ${plotOutline}\n- Characters: ${characterProfiles}\n\nDo not include any heading or title. Start directly with the narrative text.\n${isKids ? 'Show how the characters are happy and what they learned. Use encouraging language.' : 'Provide closure and show how the journey has changed the characters.'}`

  return await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, max_tokens: isKids ? 4000 : 6000 }
  )
}

/**
 * Generate chapter prompt for fiction books
 */
export async function generateChapterPrompt(
  chapterIdx: number,
  chapterTitle: string,
  chapterGoal: string,
  input: BookGenerationInput,
  context: FictionContext,
  previousSummary: string,
  currentSummary: string,
  isFirstChapter: boolean,
  isFinalChapter: boolean
): Promise<string> {
  const {
    title,
    genre = '',
    subGenre = '',
    premiseTheme = '',
    characters = '',
    setting = '',
    toneStyle = '',
    dialogueGuideline = '',
    pacing = '',
    wordsPerChapter = 2000,
    audience
  } = input

  const isKids = audience === 'kids'

  // Style guides
  const fullStyleGuide = isKids
    ? `1) Keep the narrative voice warm, friendly, and age-appropriate.\n2) Use simple sentences and vocabulary suitable for children.\n3) Include positive themes like friendship, courage, and helping others.\n4) Show characters being kind and working together.\n5) Use gentle foreshadowing that hints at happy solutions.\n6) Include moments of discovery, fun, and gentle adventure.\n7) End chapters with positive feelings or gentle excitement.\n8) For the final chapter, ensure a happy resolution and a gentle lesson learned.`
    : `1) Maintain a natural, engaging narrative voice.\n2) Use varied sentence structure and rich vocabulary.\n3) Include emotional depth and character development.\n4) Show character interactions and relationships.\n5) Use subtle foreshadowing to build tension.\n6) Include moments of conflict, growth, and resolution.\n7) End chapters with forward momentum or emotional beats.\n8) For the final chapter, provide a satisfying resolution.`

  const shortStyleGuide = isKids
    ? `Maintain the warm, child-friendly tone. Build gentle excitement and show positive character growth. Include moments of friendship and discovery. Use simple language. Conclude with positive feelings or gentle anticipation for what's next.`
    : `Maintain the established tone. Build narrative tension and show character development. Include emotional beats and forward momentum. Conclude with anticipation or resolution.`

  const styleGuide = isFirstChapter ? fullStyleGuide : shortStyleGuide
  const finalChapterNote = isFinalChapter
    ? (isKids
        ? '\n[Final Chapter Note: Emphasize a happy resolution, show how characters have grown, and include a gentle lesson learned.]'
        : '\n[Final Chapter Note: Provide a satisfying resolution, show character growth, and tie up major plot threads.]')
    : ''

  const additionalContext = isFirstChapter
    ? `Full Context:\nPlot Outline: ${context.plotOutline}\nCharacter Profiles: ${context.characterProfiles}\nConflicts & Resolutions: ${context.conflictsResolutions}\nForeshadowing: ${context.foreshadowingClues}`
    : 'Refer to the global context provided at the start for Plot Outline, Characters, Conflicts, and Foreshadowing. Focus on new positive developments and gentle character growth.'

  const prompt = `Weave in the following details to generate approximately ${wordsPerChapter} words of narrative text${isKids ? ' for children' : ''}.\nDo not include any chapter heading or title; start directly with the narrative text.\n\nDetails:\n- Genre/Sub-Genre: ${genre}/${subGenre}\n- Premise: ${premiseTheme}\n- Characters: ${characters}\n- Setting: ${setting}\n- Tone: ${toneStyle}\n- Dialogue: ${dialogueGuideline}\n- Pacing: ${pacing}\n- Target Audience: ${audience}\n\n${additionalContext}\n\nChapter Title (for reference only): '${chapterTitle}'\nChapter Goal: ${chapterGoal}\n\n${previousSummary ? `Previous Chapter Summary:\n${previousSummary}\n\n` : ''}Current Chapter Summary (planned):\n${currentSummary}\n\nSTYLE GUIDE:\n${styleGuide}${finalChapterNote}\n\nEnsure continuity with earlier chapters and avoid repeating previous details.\n${isKids ? 'Use simple, child-friendly language. Include positive themes and gentle adventure.' : 'Use engaging prose that maintains narrative momentum.'}\nStart directly with the narrative text.`

  return prompt
}

/**
 * Summarize a chapter for continuity
 */
export async function summarizeChapter(
  chapterIdx: number,
  chapterTitle: string,
  plotOutline: string,
  audience: 'adult' | 'kids'
): Promise<string> {
  const isKids = audience === 'kids'
  const wordCount = isKids ? 50 : 80
  const prompt = `Summarize in ~${wordCount} words what happens in Chapter ${chapterIdx}: '${chapterTitle}' for this ${isKids ? "children's book" : 'book'}, referencing the main plot:\n${plotOutline}\n\nTarget Audience: ${audience}.\n${isKids ? 'Mention any gentle subplots or positive moments. Keep it simple and encouraging.' : 'Mention key plot developments and character moments.'}`

  return await chatCompletion(
    [{ role: 'user', content: prompt }],
    { temperature: 0.7, max_tokens: 500 }
  )
}

/**
 * Generate complete fiction prompts structure
 */
export async function generateFictionPrompts(
  input: BookGenerationInput
): Promise<FictionPrompts> {
  const {
    title,
    genre = '',
    subGenre = '',
    premiseTheme = '',
    characters = '',
    setting = '',
    toneStyle = '',
    dialogueGuideline = '',
    pacing = '',
    wordsPerChapter = 2000,
    numChapters = 10,
    audience
  } = input

  console.log(`[Fiction Prompts] Generating for: ${title} (${audience})`)

  // Step 1: Generate main plot outline
  const plotOutline = await generateMainOutline(
    title,
    genre,
    subGenre,
    premiseTheme,
    toneStyle,
    setting,
    characters,
    audience
  )

  // Step 2: Generate character profiles
  const characterProfiles = await generateCharacterProfiles(
    plotOutline,
    characters,
    audience
  )

  // Step 3: Generate conflicts/resolutions
  const conflictsResolutions = await generateConflictsResolutions(
    plotOutline,
    audience
  )

  // Step 4: Generate foreshadowing
  const foreshadowingClues = await generateForeshadowing(
    plotOutline,
    audience
  )

  // Step 5: Generate subplots
  const subplots = await generateSubplots(
    title,
    genre,
    subGenre,
    plotOutline,
    audience,
    audience === 'kids' ? 2 : 3
  )

  // Step 6: Generate chapter goals
  const chapterGoals = await generateChapterGoals(
    plotOutline,
    subplots,
    audience,
    numChapters
  )

  // Step 7: Generate chapter titles
  const chapterTitles = await generateChapterTitles(
    plotOutline,
    audience,
    numChapters
  )

  // Step 8: Generate prologue
  const prologue = await generatePrologue(
    title,
    premiseTheme,
    toneStyle,
    plotOutline,
    characterProfiles,
    conflictsResolutions,
    foreshadowingClues,
    audience
  )

  // Step 9: Generate chapter prompts
  const previousSummaries: string[] = []
  const chapters = await Promise.all(
    chapterTitles.map(async (chapterTitle, idx) => {
      const chapterIdx = idx + 1
      const chapterGoal = chapterGoals[idx] || 'Advance the main plot with engaging narrative.'
      
      const currentSummary = await summarizeChapter(
        chapterIdx,
        chapterTitle,
        plotOutline,
        audience
      )
      const previousSummary = previousSummaries[previousSummaries.length - 1] || ''
      previousSummaries.push(currentSummary)

      const context: FictionContext = {
        plotOutline,
        characterProfiles,
        conflictsResolutions,
        foreshadowingClues,
        subplots,
        chapterGoals
      }

      const chapterPrompt = await generateChapterPrompt(
        chapterIdx,
        chapterTitle,
        chapterGoal,
        input,
        context,
        previousSummary,
        currentSummary,
        chapterIdx === 1,
        chapterIdx === numChapters
      )

      return {
        chapter: `Chapter ${chapterIdx}: ${chapterTitle}`,
        chapterPrompt
      }
    })
  )

  // Step 10: Generate epilogue
  const epilogue = await generateEpilogue(
    title,
    toneStyle,
    plotOutline,
    characterProfiles,
    audience
  )

  // Step 11: Generate book description and keywords
  const bookDescriptionPrompt = `Write a ~200-word description for the ${audience === 'kids' ? "children's book" : 'book'} '${title}' (${genre}/${subGenre}).\nIt should ${audience === 'kids' ? 'excite young readers and make parents want to read it to their children' : 'engage readers and highlight the story\'s appeal'}.\nInclude references to the core premise: ${premiseTheme}, the key characters: ${characters}, and the setting: ${setting}, all in the established tone: ${toneStyle}.\nFocus on ${audience === 'kids' ? 'fun, adventure, and positive themes without spoilers' : 'themes, character dynamics, and narrative appeal without major spoilers'}.`

  const bookDescription = await chatCompletion(
    [{ role: 'user', content: bookDescriptionPrompt }],
    { temperature: 0.7, max_tokens: 1000 }
  )

  const keywordsPrompt = `Given the following information:\n- Title: ${title}\n- Genre/Sub-Genre: ${genre}/${subGenre}\n- Premise/Theme: ${premiseTheme}\n- Target Audience: ${audience}\n\nGenerate 7 short (max 2 words each) keywords, separated by commas, that ${audience === 'kids' ? 'parents and children might use to search for this book. Focus on positive, child-friendly terms.' : 'readers might use to search for this book.'}`

  const keywords = await chatCompletion(
    [{ role: 'user', content: keywordsPrompt }],
    { temperature: 0.7, max_tokens: 200 }
  )

  return {
    bookTitle: title,
    prologue,
    chapters,
    epilogue,
    bookDescription,
    keywords
  }
}

