# PotHiGPT.com - AI Book Generation Platform

A sophisticated multi-stage AI-powered book generation system that creates both adult and children's fiction and non-fiction books with professional audiobook production.

## 🎯 Platform Overview

PotHiGPT.com provides four distinct book generation pipelines:

- **Adult Fiction** - Complex narrative generation with sophisticated character development
- **Adult Non-fiction** - Educational and informational content generation  
- **Kids Fiction** - Age-appropriate storytelling with positive themes (ages 6-12)
- **Kids Non-fiction** - Educational content tailored for children (ages 6-12)

## 🏗️ System Architecture

Each pipeline follows a carefully orchestrated 4-stage process:

```
Input Data → Stage 1: Prompt Generation → Stage 2: Content Generation → Stage 3: Audio Production → Final Output
```

**Critical**: The sequencing is immutable - each stage depends on the previous stage's output.

## 📁 Project Structure

```
Book Maker/
├── kids fiction stage 1/          # Kids fiction prompt generation
│   └── kids_fictional_prompts.py
├── kids fiction stage 2/         # Kids fiction content generation  
│   └── kids_fiction_bookmake.py
├── kids non fiction stage 1/     # Kids non-fiction prompt generation
│   └── kids_nonfiction_prompts.py
├── kids non fiction stage 2/     # Kids non-fiction content generation
│   └── kids_nonfiction_bookmake.py
├── Audiobookmaker.py             # Universal audio conversion
├── requirements.txt              # Python dependencies
├── SETUP_GUIDE.md               # Quick setup instructions
└── DEVELOPER_DOCUMENTATION.md   # Complete technical documentation
```

## 🚀 Quick Start

1. **Install dependencies**
```bash
pip install -r requirements.txt
```

2. **Set environment variables**
```bash
export OPENAI_API_KEY="your-openai-api-key"
```

3. **Run kids fiction generation**
```bash
cd "kids fiction stage 1"
python kids_fictional_prompts.py
```

4. **Generate content**
```bash
cd "../kids fiction stage 2"  
python kids_fiction_bookmake.py
```

5. **Create audiobook**
```bash
cd ..
python Audiobookmaker.py
```

## 🎨 Key Features

### Kids Content Adaptations
- **Simplified vocabulary** and sentence structure
- **Positive themes** (friendship, courage, learning)
- **Age-appropriate examples** and gentle conflicts
- **Larger fonts** and child-friendly formatting
- **Educational value** emphasis

### Technical Features
- **Progressive saving** prevents data loss
- **Error handling** with graceful degradation
- **Professional formatting** for Word documents
- **High-quality audio** (44.1kHz, 192kbps MP3)
- **Cross-platform compatibility**

## 📊 Input Requirements

### Kids Fiction Input Excel Format
- Title, Author, Genre, Sub Genre
- Core Premise and Theme
- Number of Chapters, Words Per Chapter
- Primary Characters Names
- Setting & Worldbuilding
- Tone & Writing Style, Dialogue Guidelines
- Pacing, Target Audience

### Kids Non-fiction Input Excel Format  
- Book Title
- Chapters_required
- Chapter_Structure

## 🔧 Dependencies

- **Python 3.9+**
- **OpenAI API** (GPT-4o-mini)
- **FFmpeg** for audio processing
- **Edge-TTS** for text-to-speech
- **python-docx** for Word document generation
- **pandas** for data manipulation

## 📚 Documentation

- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Quick setup instructions
- **[DEVELOPER_DOCUMENTATION.md](DEVELOPER_DOCUMENTATION.md)** - Complete technical documentation

## 🎯 Business Applications

Perfect for:
- **Educational publishers** creating age-appropriate content
- **Parents** generating custom stories for children
- **Teachers** creating educational materials
- **Content creators** producing children's media
- **SaaS platforms** offering book generation services

## 🔒 Safety & Compliance

- **Age-appropriate content** filtering
- **Positive themes** only for children's content
- **COPPA compliance** considerations
- **Content moderation** before generation
- **No persistent storage** of generated content

## 📞 Support

- **Email**: dev@pothigpt.com
- **Documentation**: See DEVELOPER_DOCUMENTATION.md
- **Issues**: Create GitHub issues for bugs or feature requests

## 📄 License

This code is proprietary to PotHiGPT.com. Unauthorized distribution or modification is prohibited.

---

**Platform**: PotHiGPT.com  
**Version**: 1.0.0  
**Last Updated**: January 2025


