"""
SkinSafe AI Domain Guard.
Enforces domain restriction at the backend level before dispatching to the LLM.
Prevents prompt injections, persona hijacking, and out-of-domain requests.
"""

import re
from typing import Optional, Tuple


# Patterns indicating jailbreak, prompt injection, or persona overrides
_PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"disregard\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"forget\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"bypass\s+(safety|rules|restrictions|guardrails)",
    r"you\s+are\s+now\s+(a\s+|an\s+)?(unrestricted|dan|jailbreak|developer\s+mode)",
    r"pretend\s+you\s+are\s+(a\s+|an\s+)?(unrestricted|evil|dan|different\s+ai)",
    r"do\s+anything\s+now",
    r"act\s+as\s+(a\s+|an\s+)?(linux\s+terminal|bash|python\s+interpreter|hacker|chef|therapist)",
    r"system\s+prompt\s+override",
    r"reveal\s+your\s+(initial\s+)?(system\s+prompt|hidden\s+instructions|instructions)",
]

# Unrelated domains / keywords that indicate off-topic requests
_OFF_TOPIC_PATTERNS = [
    # General programming unrelated to chemistry/SMILES
    r"\b(write|create|code|debug)\s+(a\s+|an\s+)?(python|javascript|typescript|react|vue|html|css|sql|bash|c\+\+|java|rust)\s+(script|app|website|scraper|crawler|function|api|bot)\b",
    # Creative writing & entertainment
    r"\b(tell|write)\s+(me\s+)?(a\s+)?(joke|poem|story|haiku|riddle|song|lyrics|rap|fiction)\b",
    # Sports & gaming
    r"\b(super\s+bowl|world\s+cup|nba|nfl|fifa|minecraft|fortnite|playstation|xbox|poker)\b",
    # Pop culture & celebrities
    r"\b(taylor\s+swift|kardashian|hollywood|celebrity|oscar\s+awards|movie\s+review)\b",
    # Politics & elections
    r"\b(presidential\s+election|prime\s+minister|democrat|republican|geopolitics|parliament)\b",
    # Cooking & recipes
    r"\b(recipe\s+for|how\s+to\s+bake|how\s+to\s+cook|sourdough|chocolate\s+cake|pizza\s+dough)\b",
    # General trivia / homework
    r"\b(capital\s+of\s+[a-z]+|who\s+won\s+the\s+war|french\s+revolution|solve\s+this\s+math|calculus\s+integral)\b",
]

# Core chemistry, cosmetic science, descriptor, and Potts-Guy terminology
_IN_DOMAIN_PATTERNS = [
    # Cheminformatics / RDKit / structure
    r"\b(smiles|rdkit|molecule|molecular|compound|chemical|atom|bond|formula|structure|conformation|substituent|functional\s+group|stereochemistry)\b",
    # Descriptors
    r"\b(molecular\s+weight|exact\s+mass|clogp|logp|tpsa|topological\s+polar|polar\s+surface|hbd|hba|hydrogen\s+bond|rotatable\s+bond|molar\s+refractivity|refractivity|heavy\s+atom|donor|acceptor)\b",
    # Drug-likeness & rules
    r"\b(lipinski|rule\s+of\s+(5|five)|ghose|filter|druglike|drug-likeness|oral\s+bioavailability|violation|bioavailability)\b",
    # Permeability & Potts-Guy
    r"\b(potts[-–\s]guy|skin\s+permeability|transdermal|stratum\s+corneum|permeability|kp|log\s+kp|cm/h|cm/s|flux|absorption|penetration|diffusion|applicability\s+domain|dermal)\b",
    # Cosmetic & topical chemistry
    r"\b(cosmetic|skincare|skin|ingredient|formulation|topical|niacinamide|salicylic|glycerin|retinol|retinoid|ceramide|hyaluronic|ascorbic|glycol|aha|bha|sunscreen|emollient|humectant|surfactant|preservative|antioxidant)\b",
    # Comparisons & analysis interpretation
    r"\b(compare|comparison|difference|higher\s+kp|lower\s+kp|permeate|absorb|penetrate|pass|fail|violate|benchmark)\b",
]

# Greetings & capability queries
_GREETING_PATTERNS = [
    r"^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening))[\s!.]*$",
    r"^(who\s+are\s+you|what\s+can\s+you\s+do|what\s+is\s+skinsafe|how\s+can\s+you\s+help(\s+me)?)[\s?!.]*$",
]

_POLITE_REFUSAL_MESSAGE = (
    "I am the SkinSafe AI Research Assistant, specialized exclusively in cosmetic chemistry, "
    "molecular descriptors (RDKit), drug-likeness filters (Lipinski & Ghose), and Potts–Guy "
    "transdermal skin permeability predictions.\n\n"
    "I cannot assist with unrelated topics, general coding, creative writing, or external domains. "
    "Please feel free to ask about cosmetic ingredients, chemical descriptors, or your current molecule analysis!"
)

_INJECTION_REFUSAL_MESSAGE = (
    "I am the SkinSafe AI Research Assistant. I operate strictly within cosmetic chemistry "
    "and skin permeability analysis, and cannot adopt other personas or override platform safety guidelines."
)

_GREETING_RESPONSE = (
    "Hello! I am your SkinSafe Cosmetic Chemistry and Skin Permeability Research Assistant.\n\n"
    "I can help you with:\n"
    "• Explaining RDKit calculated descriptors (MW, cLogP, TPSA, HBD, HBA, rotatable bonds, etc.)\n"
    "• Interpreting Lipinski Rule of Five and Ghose filter drug-likeness assessments\n"
    "• Understanding Potts–Guy empirical transdermal permeability predictions (log Kp, cm/h, cm/s)\n"
    "• Comparing cosmetic ingredients and analyzing your currently selected molecule\n\n"
    "How can I assist your chemical investigation today?"
)


def evaluate_domain_restriction(
    message: str,
    has_context: bool = False,
) -> Tuple[bool, Optional[str]]:
    """
    Evaluates whether the user's message is within the permitted SkinSafe domain.
    Returns:
        (is_allowed: bool, direct_response_or_reason: Optional[str])
        If is_allowed is False, direct_response_or_reason contains the refusal text to return immediately.
        If is_allowed is True and direct_response_or_reason is provided, it's a pre-baked greeting.
    """
    clean_msg = message.strip()
    msg_lower = clean_msg.lower()

    # 1. Check for prompt injections and jailbreak patterns
    for pattern in _PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            return False, _INJECTION_REFUSAL_MESSAGE

    # 2. Check for standard greetings / capability queries
    for pattern in _GREETING_PATTERNS:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            return True, _GREETING_RESPONSE

    # 3. Check for obvious off-topic requests
    for pattern in _OFF_TOPIC_PATTERNS:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            return False, _POLITE_REFUSAL_MESSAGE

    # 4. Check for in-domain keywords
    has_in_domain_signal = False
    for pattern in _IN_DOMAIN_PATTERNS:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            has_in_domain_signal = True
            break

    if has_in_domain_signal:
        return True, None

    # 5. If analysis context is active, allow contextual inquiry
    # (e.g. "Why did it fail?", "What does this mean?", "Explain the results")
    if has_context:
        contextual_inquiry_patterns = [
            r"\b(why|explain|what|how|does|is|tell\s+me|summarize|interpretation|result|prediction|value|number|reading)\b",
        ]
        for pattern in contextual_inquiry_patterns:
            if re.search(pattern, msg_lower, re.IGNORECASE):
                return True, None

    # 6. Ambiguous or completely unrelated message with no chemistry signals
    # If the message is very short like "thanks" or "ok", handle politely
    if msg_lower in ("thanks", "thank you", "ok", "okay", "got it", "cool"):
        return True, "You're welcome! Let me know if you'd like to analyze another cosmetic ingredient or explore permeability predictions."

    # Otherwise decline politely
    return False, _POLITE_REFUSAL_MESSAGE

