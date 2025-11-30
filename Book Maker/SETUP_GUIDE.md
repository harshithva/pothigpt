# PotHiGPT.com - AI Book Generation Platform
## Quick Setup Guide for Developers

### Prerequisites
- Python 3.9 or higher
- FFmpeg installed and accessible via PATH
- OpenAI API key
- Git

### Installation Steps

1. **Clone the repository**
```bash
git clone https://github.com/pothigpt/book-generation-platform.git
cd book-generation-platform
```

2. **Create virtual environment**
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. **Install dependencies**
```bash
pip install -r requirements.txt
```

4. **Set environment variables**
```bash
export OPENAI_API_KEY="your-openai-api-key-here"
export FFMPEG_PATH="/usr/local/bin/ffmpeg"  # Adjust path as needed
```

5. **Verify FFmpeg installation**
```bash
ffmpeg -version
ffprobe -version
```

### Quick Test

1. **Test Adult Fiction Pipeline**
```bash
cd "kids fiction stage 1"
python kids_fictional_prompts.py
# Enter path to your input Excel file when prompted
```

2. **Test Kids Non-fiction Pipeline**
```bash
cd "../kids non fiction stage 1"
python kids_nonfiction_prompts.py
```

### File Structure Overview

```
Book Maker/
├── kids fiction stage 1/          # Kids fiction prompt generation
├── kids fiction stage 2/          # Kids fiction content generation
├── kids non fiction stage 1/     # Kids non-fiction prompt generation
├── kids non fiction stage 2/     # Kids non-fiction content generation
├── Audiobookmaker.py             # Universal audio conversion
└── DEVELOPER_DOCUMENTATION.md    # Complete technical documentation
```

### Input Excel Format

**For Kids Fiction:**
- Title
- Author
- Genre
- Sub Genre
- Core Premise and Theme
- Number of Chapters
- Words Per Chapter
- Primary Characters Names
- Setting & Worldbuilding
- Tone & Writing Style
- Dialogue Guidelines
- Pacing
- Target Audience

**For Kids Non-fiction:**
- Book Title
- Chapters_required
- Chapter_Structure

### Output Files

**Stage 1 Outputs:**
- `kids_fiction_output.xlsx` - Structured prompts for kids fiction
- `Kids_Book_Generated_Content.xlsx` - Structured prompts for kids non-fiction

**Stage 2 Outputs:**
- Word documents (.docx) in respective output folders
- Book-author summary Excel files

**Stage 3 Outputs:**
- MP3 audiobooks with professional intro/outro
- Organized folder structure by book

### Troubleshooting

**Common Issues:**

1. **FFmpeg not found**
   - Install FFmpeg: https://ffmpeg.org/download.html
   - Add to PATH or set FFMPEG_PATH environment variable

2. **OpenAI API errors**
   - Verify API key is valid and has sufficient credits
   - Check rate limits and implement backoff if needed

3. **File permission errors**
   - Ensure write permissions for output directories
   - Check disk space availability

4. **Import errors**
   - Verify all dependencies are installed: `pip install -r requirements.txt`
   - Check Python version compatibility

### Development Notes

- **Sequential Processing**: Each stage must complete before the next begins
- **Error Handling**: All systems include graceful error handling and recovery
- **Progress Saving**: Content is saved incrementally to prevent data loss
- **Age Appropriateness**: Kids content includes additional safety filters

### Support

For technical support or questions:
- Email: dev@pothigpt.com
- Documentation: See DEVELOPER_DOCUMENTATION.md
- Issues: Create GitHub issues for bugs or feature requests

### License

This code is proprietary to PotHiGPT.com. Unauthorized distribution or modification is prohibited.


