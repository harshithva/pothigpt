# PotHiGPT.com - Technical Function Guide
## Complete Developer Reference for AI Book Generation System

---

## 📋 **Table of Contents**

1. [System Overview](#system-overview)
2. [Stage 1: Prompt Generation Systems](#stage-1-prompt-generation-systems)
3. [Stage 2: Content Generation Systems](#stage-2-content-generation-systems)
4. [Stage 3: Audio Production System](#stage-3-audio-production-system)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Function Reference](#function-reference)
7. [Error Handling Patterns](#error-handling-patterns)
8. [API Integration Details](#api-integration-details)

---

## 🎯 **System Overview**

The PotHiGPT.com platform consists of **4 distinct pipelines**, each following a **3-stage process**:

```
Input Excel → Stage 1 (Prompt Generation) → Stage 2 (Content Generation) → Stage 3 (Audio Production) → Final Output
```

### **Pipeline Types:**
- **Adult Fiction** (`fictional_prompts.py` → `fiction_bookmake.py`)
- **Adult Non-fiction** (`nonfiction_prompts.py` → `nonfiction_bookmake.py`)
- **Kids Fiction** (`kids_fictional_prompts.py` → `kids_fiction_bookmake.py`)
- **Kids Non-fiction** (`kids_nonfiction_prompts.py` → `kids_nonfiction_bookmake.py`)

### **Universal Components:**
- **Audio Production** (`Audiobookmaker.py`) - Works with all pipelines

---

## 🔧 **Stage 1: Prompt Generation Systems**

### **Purpose**
Transform user input into structured, detailed prompts for AI content generation.

### **Input Format**
Excel file with book specifications (title, genre, chapters, etc.)

### **Output Format**
Structured Excel file with detailed prompts for each chapter and subheading

---

### **1.1 Adult Fiction Prompts (`fictional_prompts.py`)**

#### **Core Functions:**

**`set_global_context()`**
```python
def set_global_context(title, genre, sub_genre, premise_theme, tone_style, setting_worldbuilding, characters, target_audience):
```
- **Purpose**: Generate and store comprehensive story context
- **Logic**: Creates 4 key context elements:
  - `plot_outline`: 3-act story structure (~200 words)
  - `character_profiles`: Character development details
  - `conflicts_resolutions`: Narrative tension and resolution
  - `foreshadowing_clues`: Story continuity elements
- **Storage**: Global dictionary `GLOBAL_CONTEXT` for cross-chapter consistency

**`generate_main_outline()`**
```python
def generate_main_outline(title, genre, sub_genre, premise_theme, tone_style, setting_worldbuilding, characters, target_audience):
```
- **Purpose**: Create 3-act story structure
- **AI Prompt**: Structured prompt with all story elements
- **Output**: ~200-word narrative outline
- **Temperature**: 0.7 for creative but consistent output

**`generate_subplots()`**
```python
def generate_subplots(title, genre, sub_genre, plot_outline, target_audience, num_subplots=3):
```
- **Purpose**: Create secondary storylines
- **Logic**: Generates 3 subplots (~50 words each)
- **Integration**: Weaves subplots into main narrative
- **Focus**: Character development and emotional beats

**`generate_chapter_goals()`**
```python
def generate_chapter_goals(plot_outline, subplots, target_audience, num_chapters):
```
- **Purpose**: Break story into chapter-specific objectives
- **Logic**: Combines main plot + subplots into chapter goals
- **Output**: 1-2 line goals per chapter
- **Continuity**: Ensures narrative progression

**`generate_chapter_titles()`**
```python
def generate_chapter_titles(plot_outline, target_audience, num_chapters):
```
- **Purpose**: Create evocative chapter titles
- **Logic**: Parses numbered list format
- **Regex**: `r"^\d+\.\s*(.*)$"` for title extraction
- **Output**: Clean title list

**`generate_chapter_prompt()`**
```python
def generate_chapter_prompt(idx, title, genre, sub_genre, premise_theme, words_per_chapter, characters, setting_worldbuilding, tone_style, dialogue_guideline, pacing, chapter_title, chapter_goal, current_summary, previous_summary, target_audience, total_chapters):
```
- **Purpose**: Build final chapter generation prompt
- **Logic**: 
  - First chapter: Full context + full style guide
  - Other chapters: Short context + short style guide
  - Final chapter: Adds resolution requirements
- **Context Management**: Uses `GLOBAL_CONTEXT` for continuity
- **Style Guides**: `FULL_STYLE_GUIDE` vs `SHORT_STYLE_GUIDE`

#### **Data Flow:**
```
Input Excel → Global Context Generation → Subplots → Chapter Goals → Chapter Titles → Chapter Prompts → Output Excel
```

---

### **1.2 Kids Fiction Prompts (`kids_fictional_prompts.py`)**

#### **Key Differences from Adult Version:**

**Simplified Context Generation:**
- **Word Counts**: Reduced (150 words vs 200 for outline)
- **Subplots**: 2 instead of 3
- **Conflicts**: Gentle, easily resolved
- **Themes**: Friendship, courage, learning

**Age-Appropriate Prompts:**
```python
KIDS_FULL_STYLE_GUIDE = (
    "1) Keep the narrative voice warm, friendly, and age-appropriate.\n"
    "2) Use simple sentences and vocabulary suitable for children.\n"
    "3) Include positive themes like friendship, courage, and helping others.\n"
    # ... more child-friendly guidelines
)
```

**Content Safety:**
- **Positive themes only**
- **Simple vocabulary**
- **Gentle conflicts**
- **Happy resolutions**

---

### **1.3 Adult Non-fiction Prompts (`nonfiction_prompts.py`)**

#### **Core Functions:**

**`generate_book_description()`**
```python
def generate_book_description(book_title: str) -> str:
```
- **Purpose**: Create engaging book description
- **Logic**: Assumes advanced adult audience
- **Output**: 3-sentence description
- **Focus**: Key insights and reader benefits

**`generate_genre_and_target_audience()`**
```python
def generate_genre_and_target_audience(title: str) -> tuple[str, str]:
```
- **Purpose**: Classify book genre and audience
- **Logic**: JSON response parsing
- **Fallback**: "Self-Help", "Adults" if parsing fails
- **Error Handling**: Graceful degradation

**`generate_chapter_titles_and_subheadings()`**
```python
def generate_chapter_titles_and_subheadings(title, chapters, description, structure):
```
- **Purpose**: Structure educational content
- **Logic**: 4 subheadings per chapter
- **Output**: JSON format with titles and subheadings
- **Structure**: Follows user-specified chapter structure

#### **Memory System:**
```python
def load_memory():
    if os.path.exists(MEMORY_FILE):
        return json.load(open(MEMORY_FILE))
    return {"titles": [], "subheadings": []}
```
- **Purpose**: Track generated content to avoid repetition
- **Storage**: JSON file persistence
- **Usage**: Prevents duplicate chapter titles/subheadings

---

### **1.4 Kids Non-fiction Prompts (`kids_nonfiction_prompts.py`)**

#### **Key Adaptations:**

**Simplified Structure:**
- **Subheadings**: 3 instead of 4 per chapter
- **Word Counts**: Reduced (800 words intro vs 1500)
- **Language**: Elementary level vocabulary
- **Examples**: Fun facts and interactive elements

**Educational Focus:**
- **Age Range**: 6-12 years
- **Learning Objectives**: Clear educational goals
- **Engagement**: Interactive elements and examples
- **Safety**: Age-appropriate content only

---

## 📝 **Stage 2: Content Generation Systems**

### **Purpose**
Convert structured prompts into professional Word documents

### **Input Format**
Excel file with detailed prompts from Stage 1

### **Output Format**
Professional Word documents (.docx) with proper formatting

---

### **2.1 Adult Fiction Content (`fiction_bookmake.py`)**

#### **Core Functions:**

**`generate_text()`**
```python
def generate_text(prompt):
```
- **Purpose**: Generate chapter content from prompts
- **Model**: GPT-4o-mini
- **Tokens**: 6000 max tokens
- **Error Handling**: Returns error message on failure
- **System Message**: "You are a helpful assistant."

**`create_docx()`**
```python
def create_docx(book_title, chapters):
```
- **Purpose**: Create complete Word document
- **Structure**:
  1. Title page with author attribution
  2. Copyright page
  3. Prologue (if present)
  4. Chapters with proper headings
  5. Epilogue (if present)
- **Formatting**: Professional fonts, spacing, alignment

**`add_hyperlink()`**
```python
def add_hyperlink(paragraph, url, text):
```
- **Purpose**: Add hyperlinks to Word documents
- **Implementation**: Uses `docx.oxml` for XML manipulation
- **Styling**: Blue color, bold text, proper formatting

#### **Document Structure:**
```
Title Page (Centered, Large Font)
↓
Copyright Page (Centered)
↓
Prologue (if exists)
↓
Chapter 1: [Title] (Centered Heading)
[Generated Content]
↓
Chapter 2: [Title]
[Generated Content]
↓
...
↓
Epilogue (if exists)
```

---

### **2.2 Kids Fiction Content (`kids_fiction_bookmake.py`)**

#### **Key Adaptations:**

**Child-Friendly Formatting:**
```python
# Larger fonts for children
style.font.size = Pt(12)  # Body text
title_heading.runs[0].font.size = Pt(24)  # Titles
```

**Age-Appropriate Copyright:**
```python
"Copyright © 2025 AI Book Generator\n"
"This is a work of fiction for children...\n"
"Recommended for ages 6-12"
```

**Simplified Structure:**
- **Larger fonts** for better readability
- **Age recommendations** in copyright
- **Child-friendly language** throughout
- **Positive themes** emphasis

---

### **2.3 Non-fiction Content Systems**

#### **Adult Non-fiction (`nonfiction_bookmake.py`)**

**`init_doc()`**
```python
def init_doc(title: str) -> Document:
```
- **Purpose**: Initialize Word document with title page
- **Structure**: Title + "By AI Book Generator" + page break
- **Font Sizes**: 20pt title, 14pt author

**`generate_text()`**
```python
def generate_text(prompt: str) -> str:
```
- **Purpose**: Generate content from prompts
- **Model**: GPT-4o-mini
- **Error Handling**: Graceful failure with empty string return
- **Logging**: Progress indicators with emoji

**`clean_intro()` & `clean_subsection()`**
```python
def clean_intro(text: str, chapter_title: str) -> str:
def clean_subsection(text: str, subheading: str) -> str:
```
- **Purpose**: Remove redundant headings from generated content
- **Logic**: Filters out lines containing chapter/subheading titles
- **Regex**: `r'chapter\s*\d+'` for chapter detection

#### **Kids Non-fiction (`kids_nonfiction_bookmake.py`)**

**Adaptations:**
- **Larger fonts** (12pt body, 24pt titles)
- **Age recommendations** in title page
- **Simplified structure** (3 subheadings vs 4)
- **Child-friendly language** in all prompts

---

## 🎧 **Stage 3: Audio Production System**

### **Purpose**
Convert Word documents to professional MP3 audiobooks

### **Input Format**
Word documents (.docx) from Stage 2

### **Output Format**
High-quality MP3 files with intro/outro

---

### **3.1 Audiobookmaker.py**

#### **Core Functions:**

**`parse_docx()`**
```python
def parse_docx(docx_path: Path):
```
- **Purpose**: Extract sections from Word document
- **Logic**: 
  - Detects Heading 1 styles
  - Fallback regex for legacy documents
  - Groups content by sections
- **Output**: OrderedDict {section_title: body_text}
- **Regex**: `r"^(chapter|introduction|prologue|epilogue|book|part)\b"`

**`_is_heading1()`**
```python
def _is_heading1(para):
```
- **Purpose**: Identify top-level headings
- **Logic**:
  1. Check Word style name (Heading 1)
  2. Fallback to text pattern matching
- **Return**: Boolean for heading detection

**`tts_to_mp3()`**
```python
def tts_to_mp3(text: str, out_mp3: Path):
```
- **Purpose**: Convert text to MP3 using OpenAI TTS
- **Process**:
  1. Call OpenAI TTS API
  2. Save to temporary MP3
  3. Process with pydub for quality
  4. Export final MP3 (44.1kHz, 192kbps)
  5. Clean up temporary files
- **Error Handling**: Silent fallback audio on failure
- **Quality**: Professional audio standards

**`make_audiobook()`**
```python
def make_audiobook(docx_path: Path, title: str, author: str, publisher: str):
```
- **Purpose**: Create complete audiobook
- **Process**:
  1. Parse Word document
  2. Create output directory
  3. Generate intro audio
  4. Generate chapter audio files
  5. Generate outro audio
- **Naming**: Sequential numbering with safe filenames
- **Branding**: Generic publisher attribution

#### **Audio Specifications:**
- **Model**: OpenAI TTS-1
- **Voice**: Configurable (alloy, echo, fable, onyx, nova, shimmer)
- **Sample Rate**: 44.1kHz
- **Bitrate**: 192kbps
- **Format**: MP3

#### **File Structure:**
```
BookName/
├── 00_intro.mp3
├── 01_chapter_1.mp3
├── 02_chapter_2.mp3
├── ...
└── XX_outro.mp3
```

---

## 🔄 **Data Flow Architecture**

### **Complete Pipeline Flow:**

```
1. INPUT EXCEL
   ├── Book specifications
   ├── Chapter requirements
   └── Content preferences
   ↓
2. STAGE 1: PROMPT GENERATION
   ├── Parse input data
   ├── Generate book context
   ├── Create chapter structure
   ├── Build detailed prompts
   └── Output: Structured Excel
   ↓
3. STAGE 2: CONTENT GENERATION
   ├── Read prompt Excel
   ├── Generate chapter content
   ├── Format Word documents
   ├── Apply professional styling
   └── Output: Word documents
   ↓
4. STAGE 3: AUDIO PRODUCTION
   ├── Parse Word documents
   ├── Generate TTS audio
   ├── Process audio quality
   ├── Create intro/outro
   └── Output: MP3 audiobooks
```

### **Data Dependencies:**
- **Stage 1 → Stage 2**: Excel file with prompts
- **Stage 2 → Stage 3**: Word documents
- **Cross-Stage**: No dependencies (can run independently)

---

## 📚 **Function Reference**

### **Common Patterns Across All Files:**

#### **OpenAI API Integration:**
```python
# Standard pattern used in all files
response = openai.ChatCompletion.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": prompt}],
    max_tokens=4000-6000,  # Varies by content type
    temperature=0.7
)
return response.choices[0].message.content.strip()
```

#### **Error Handling Pattern:**
```python
try:
    # API call or file operation
    result = perform_operation()
    return result
except Exception as e:
    print(f"❌ Error: {e}")
    return fallback_value  # Empty string, default value, etc.
```

#### **File Path Management:**
```python
# Consistent pattern across all files
os.makedirs(output_dir, exist_ok=True)
path = os.path.join(output_dir, filename)
```

#### **Text Cleaning:**
```python
# Standard text cleaning function
def clean_text(text: str) -> str:
    return re.sub(r"[\*#\"]", "", text or "").strip()
```

---

## ⚠️ **Error Handling Patterns**

### **1. API Error Handling:**
```python
try:
    response = openai.ChatCompletion.create(...)
    return response.choices[0].message.content.strip()
except Exception as e:
    print(f"❌ OpenAI error: {e}")
    return ""  # Graceful degradation
```

### **2. File Operation Error Handling:**
```python
try:
    with open(file_path, 'w') as f:
        f.write(content)
except Exception as e:
    print(f"❌ File error: {e}")
    # Continue processing other files
```

### **3. Data Validation:**
```python
if not isinstance(prompt, str) or not prompt.strip():
    return ""  # Skip empty prompts
```

### **4. Progress Saving:**
```python
# Save progress after each major operation
save_doc(title, doc)  # Prevents data loss
```

---

## 🔌 **API Integration Details**

### **OpenAI API Configuration:**

#### **Text Generation (All Files):**
```python
openai.api_key = os.getenv("OPENAI_API_KEY", "fallback_key").strip()
MODEL = "gpt-4o-mini"
TEMPERATURE = 0.7
MAX_TOKENS = 4000-6000  # Varies by content type
```

#### **TTS Generation (Audiobookmaker.py):**
```python
response = openai.audio.speech.create(
    model="tts-1",
    voice="alloy",  # Configurable
    input=text,
    response_format="mp3"
)
```

### **Rate Limiting Considerations:**
- **Sequential Processing**: Files process one book at a time
- **Progress Saving**: Prevents loss on API failures
- **Error Recovery**: Continues processing after failures
- **Token Management**: Appropriate limits for each content type

---

## 🎯 **Key Technical Decisions**

### **1. Sequential Processing:**
- **Reason**: Maintains narrative continuity
- **Implementation**: Global context storage
- **Benefit**: Consistent character development and plot progression

### **2. Progressive Saving:**
- **Reason**: Prevents data loss on failures
- **Implementation**: Save after each chapter
- **Benefit**: Resume processing from last successful point

### **3. Modular Architecture:**
- **Reason**: Easy maintenance and updates
- **Implementation**: Separate files for each stage
- **Benefit**: Independent testing and deployment

### **4. Age-Appropriate Adaptations:**
- **Reason**: Different content requirements for children
- **Implementation**: Separate kids versions with adapted prompts
- **Benefit**: Safe, educational content for children

### **5. Generic Branding:**
- **Reason**: SaaS platform flexibility
- **Implementation**: Configurable publisher fields
- **Benefit**: White-label capability

---

## 🚀 **Deployment Considerations**

### **Environment Requirements:**
- **Python 3.9+**
- **FFmpeg** for audio processing
- **OpenAI API** access
- **File system** write permissions

### **Scalability Patterns:**
- **Batch Processing**: Multiple books in sequence
- **Error Isolation**: Failures don't stop other books
- **Resource Management**: Appropriate token limits
- **Progress Tracking**: Clear status indicators

### **Monitoring Points:**
- **API Success Rate**: Track OpenAI call failures
- **Processing Time**: Monitor generation duration
- **File Creation**: Verify output file generation
- **Error Patterns**: Identify common failure modes

---

## 📋 **Summary**

The PotHiGPT.com system is a sophisticated, multi-stage AI content generation platform with:

- **4 distinct pipelines** for different content types
- **3-stage processing** for each pipeline
- **Robust error handling** throughout
- **Professional output quality** for both text and audio
- **Age-appropriate adaptations** for children's content
- **SaaS-ready architecture** with generic branding

Each stage is carefully designed to maintain quality while providing flexibility for different use cases and audiences.

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Platform**: PotHiGPT.com
