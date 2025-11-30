#!/usr/bin/env python3
import os
import json
import pandas as pd
import openai
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import re

# ── CONFIGURATION ────────────────────────────────────────────

openai.api_key = os.getenv("OPENAI_API_KEY", "").strip()
if not openai.api_key:
    raise RuntimeError("OPENAI_API_KEY environment variable not set.")
if not openai.api_key:
    raise RuntimeError("OpenAI API key not set.")

MODEL = "gpt-4o-mini"
MEMORY_FILE = "kids_chapter_memory.json"
INPUT_EXCEL = "kids_book_input.xlsx"
PROMPTS_EXCEL = "Kids_Book_Generated_Content.xlsx"

# ── MEMORY HELPERS ───────────────────────────────────

def load_memory():
    if os.path.exists(MEMORY_FILE):
        return json.load(open(MEMORY_FILE))
    return {"titles": [], "subheadings": []}

def save_memory(mem):
    with open(MEMORY_FILE, "w") as f:
        json.dump(mem, f)

# ── UTIL ─────────────────────────────────────

def clean_json_string(response: str) -> str:
    matches = re.findall(r'```(?:json)?(.*?)```', response, re.DOTALL)
    if matches:
        return matches[0].strip()
    return response.strip()

# ── CORE OPENAI CALL ────────────────────────────────

def generate_content(prompt: str) -> str:
    try:
        response = openai.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("OpenAI error:", e)
        return ""

# ── DOMAIN‐SPECIFIC GENERATORS FOR KIDS ───────────────────────────

def generate_book_description(book_title: str) -> str:
    prompt = (
        f"Using the title '{book_title}', assume this is a non-fiction book for children ages 6-12. "
        "Write an engaging, two-sentence description that introduces the topic in a fun way, "
        "explains why it's interesting, and hints at what young readers will learn. "
        "Use simple, exciting language that makes kids want to read more."
    )
    return generate_content(prompt)

def generate_genre_and_target_audience(title: str) -> tuple[str, str]:
    prompt = f"For the children's book titled '{title}', suggest the most suitable educational genre and ideal age range. Return as JSON: {{\"genre\": \"...\", \"audience\": \"...\"}}"
    out = generate_content(prompt)
    try:
        data = json.loads(clean_json_string(out))
        return data["genre"], data["audience"]
    except Exception as e:
        print(f"❌ Failed to parse genre/audience for '{title}'. Response was:\n{out}")
        return "Educational", "Ages 6-12"

def generate_chapter_titles_and_subheadings(title, chapters, description, structure):
    prompt = (
        f"Create a list of {chapters} fun chapter titles and 3 simple subheadings per chapter for a children's book titled '{title}' "
        f"based on this description: {description}. Structure should be {structure}. "
        f"Make titles exciting and educational. Keep subheadings simple and engaging for kids. "
        f"Return as JSON like: {{\"chapters\": [{{\"title\": \"...\", \"subheadings\": [\"...\", \"...\", \"...\"]}}, ...]}}"
    )
    out = generate_content(prompt)
    try:
        j = json.loads(clean_json_string(out))
        titles = [c["title"] for c in j["chapters"]]
        subheads = [c["subheadings"] for c in j["chapters"]]
        return titles, subheads
    except Exception as e:
        print(f"❌ Failed to parse chapter titles JSON for '{title}'. Response was:\n{out}")
        return [], []

# ── BUILD PROMPTS EXCEL ──────────────────────────────

def create_prompts_excel(input_path: str, output_path: str):
    df_in = pd.read_excel(input_path)
    rows = []
    mem = load_memory()

    for _, entry in df_in.iterrows():
        title = entry["Book Title"]
        chapters = int(entry["Chapters_required"])
        structure = entry["Chapter_Structure"]

        genre, audience = generate_genre_and_target_audience(title)
        desc = generate_book_description(title)
        chap_titles, subheads = generate_chapter_titles_and_subheadings(title, chapters, desc, structure)

        if not chap_titles:
            print(f"⚠️ Skipping '{title}' — no chapters generated.")
            continue

        intro_prompt = (
            f"Write a 800-word engaging and fun introduction for the children's book '{title}'. "
            f"Focus on the key themes: {desc}. Use simple language, fun facts, and exciting examples. "
            f"Make it interesting for kids ages 6-12. Avoid using headings."
        )

        max_chaps = min(len(chap_titles), len(subheads))
        if max_chaps < chapters:
            print(f"⚠️ Partial generation for '{title}': only {max_chaps} of {chapters} chapters available.")

        for i in range(max_chaps):
            ct = chap_titles[i]
            try:
                ci = (
                    f"Write a 100-word fun introduction for Chapter {i+1}, titled '{ct}', in the children's book '{title}'. "
                    "Start with an exciting hook that makes kids curious. Use simple language. "
                    "Do not repeat the chapter title. Make it sound like an adventure or discovery."
                )
                sh_prompts = [
                    f"Write a 300-word engaging section on '{sh}' for Chapter {i+1} of the children's book '{title}'. "
                    f"Include fun examples, simple explanations, and interactive elements. "
                    f"Use age-appropriate language for kids ages 6-12. Make it exciting and educational. "
                    f"Maintain continuity and avoid repeating the chapter title."
                    for sh in subheads[i]
                ]

                row = {
                    "Book_Title": title,
                    "Intro_Prompt": intro_prompt if i == 0 else "",
                    "Chapter_Title": f"Chapter {i+1}: {ct}",
                    "Chapter_Intro": ci,
                    **{f"Subheading_{j+1}": subheads[i][j] for j in range(len(subheads[i]))},
                    **{f"Subheading_{j+1}_Prompt": sh_prompts[j] for j in range(len(sh_prompts))},
                    "Genre": genre,
                    "Target_Audience": audience,
                    "Tone": "Fun and educational",
                    "Style": "Simple and engaging",
                    "Pacing": "Easy to follow",
                    "Language": "English",
                    "Readability": "Elementary Level",
                    "Word_Goal": 1000
                }
                rows.append(row)
            except Exception as e:
                print(f"⚠️ Skipped Chapter {i+1} of '{title}' due to error: {e}")

    pd.DataFrame(rows).to_excel(output_path, index=False)
    save_memory(mem)
    print(f"✅ Kids prompts Excel written to: {output_path}")

# ── ENTRY POINT ────────────────────────────────

if __name__ == "__main__":
    create_prompts_excel(INPUT_EXCEL, PROMPTS_EXCEL)


