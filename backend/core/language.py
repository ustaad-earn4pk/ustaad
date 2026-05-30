import re
from enum import Enum
from typing import Optional

class Language(str, Enum):
    EN = "en"
    UR_NASTALIQ = "ur_nastaliq"
    UR_ROMAN = "ur_roman"

URDU_PATTERN = re.compile(r'[\u0600-\u06FF]+')
ROMAN_URDU_WORDS = {
    "kya", "hai", "hain", "mein", "ko", "ka", "ki", "ke", "aur", "nahi",
    "haan", "theek", "achha", "ap", "aap", "tum", "main", "hum", "yeh",
    "woh", "bhai", "yaar", "jee", "ji", "bilkul", "zaroor", "samajh",
    "seekhna", "karo", "karna", "kiya", "tha", "thi", "ho", "ga"
}

def detect_language(text: str) -> Language:
    if not text:
        return Language.EN
    if len(URDU_PATTERN.findall(text)) > 0:
        return Language.UR_NASTALIQ
    words = set(text.lower().split())
    if len(words.intersection(ROMAN_URDU_WORDS)) >= 2:
        return Language.UR_ROMAN
    return Language.EN

def should_suggest_switch(message: str, current_lang: str) -> Optional[str]:
    detected = detect_language(message)
    if str(detected) != current_lang and detected != Language.EN:
        return str(detected)
    return None
