"""
SkinSafe AI Domain Guard.
Enforces cosmetic chemistry and skin permeability domain restrictions at the backend level.
Blocks prompt injection, persona hijacking, and out-of-domain requests before invoking LLMs.
"""

import re
from typing import Optional, Tuple


# Exact polite refusal message requested for unrelated topics and boundary enforcement
_POLITE_REFUSAL_MESSAGE = (
    "I'm specialised in cosmetic chemistry, cosmetic ingredient analysis, and skin permeability research. "
    "I can't assist with unrelated topics, but I'd be happy to help with your chemical investigation!"
)

# Friendly greeting response introducing SkinSafe and its scientific capabilities
_GREETING_RESPONSE = (
    "Hello! I am your SkinSafe Cosmetic Chemistry and Skin Permeability Research Assistant.\n\n"
    "I can help you with:\n"
    "• Calculating & interpreting RDKit molecular descriptors (MW, cLogP, TPSA, HBD, HBA, rotatable bonds)\n"
    "• Evaluating drug-likeness benchmark rules (Lipinski Rule of Five & Ghose Filter)\n"
    "• Estimating transdermal skin permeability using the Potts–Guy model (log Kp, cm/h, cm/s)\n"
    "• Analyzing cosmetic ingredients, skin penetration, and topical formulation science\n"
    "• Explaining single molecule analyses and comparing chemical compounds side by side\n\n"
    "How can I assist your chemical investigation today?"
)

# Prompt injection, jailbreak, and persona override patterns
_PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules)",
    r"disregard\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules)",
    r"forget\s+(all\s+)?(previous|prior|above|system)\s+(instructions|prompts|rules)",
    r"bypass\s+(safety|rules|restrictions|guardrails|filters)",
    r"you\s+are\s+now\s+(a\s+|an\s+)?(unrestricted|dan|jailbreak|developer\s+mode|evil|different\s+ai)",
    r"pretend\s+you\s+are\s+(a\s+|an\s+)?(unrestricted|evil|dan|different\s+ai|bot)",
    r"do\s+anything\s+now",
    r"act\s+as\s+(a\s+|an\s+)?(linux|bash|python|terminal|hacker|chef|developer|therapist|unrestricted)",
    r"system\s+prompt\s+override",
    r"reveal\s+your\s+(initial\s+)?(system\s+prompt|hidden\s+instructions|instructions)",
    r"switch\s+to\s+(dan|developer\s+mode|jailbreak)",
]

# Greetings and introductory queries
_GREETING_PATTERNS = [
    r"^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening|day)|howdy)[\s!.,]*$",
    r"^(hi|hello|hey)[\s,]+(there|assistant|skinsafe|ai)[\s!.,]*$",
    r"^(who\s+are\s+you|what\s+can\s+you\s+do|what\s+is\s+skinsafe|how\s+can\s+you\s+help(\s+me)?)[\s?!.,]*$",
]

# Short conversational follow-ups
_CONVERSATIONAL_FOLLOW_UPS = [
    r"^(thanks|thank\s+you|ok|okay|got\s+it|cool|great|awesome|understood|makes\s+sense)[\s!.,]*$",
    r"^(tell\s+me\s+more|can\s+you\s+elaborate|elaborate(\s+please)?|explain\s+further|go\s+on)[\s!.,]*$",
    r"^(what\s+else|continue|more\s+info)[\s!.,]*$",
]

# Unrelated topics (website development, sports, creative writing, entertainment, trivia)
_OFF_TOPIC_PATTERNS = [
    # Website development, coding, programming (unrelated to chemistry)
    r"\b(build|create|code|develop|make|debug)\s+(a\s+|an\s+)?(website|web\s+app|webapp|webpage|landing\s+page|site|portfolio)\b",
    r"\b(website\s+development|web\s+development|software\s+development|frontend|fullstack)\b",
    r"\b(write|create|code|debug)\s+(a\s+|an\s+)?(python|javascript|typescript|react|vue|html|css|tailwind|sql|bash|c\+\+|java|rust)\s+(script|app|code|scraper|bot|api)\b",
    r"\b(how\s+to\s+(make|build|code|program)\s+(a\s+|an\s+)?(website|app|game|bot))\b",
    # Sports & athletic competitions
    r"\b(super\s+bowl|world\s+cup|nba|nfl|fifa|uefa|premier\s+league|champions\s+league|olympics|messi|ronaldo|lebron|baseball|football|basketball|soccer|tennis|cricket|formula\s+1|f1)\b",
    r"\b(who\s+won\s+the\s+(game|match|championship|cup|tournament))\b",
    # Entertainment, creative writing, jokes, stories
    r"\b(tell|write)\s+(me\s+)?(a\s+)?(joke|poem|story|haiku|riddle|song|lyrics|rap|fiction|novel|essay)\b",
    r"\b(movie\s+review|netflix|hollywood|celebrity|taylor\s+swift|kardashian|grammy|oscar|box\s+office)\b",
    # General trivia, politics, recipes
    r"\b(presidential\s+election|prime\s+minister|democrat|republican|geopolitics|parliament)\b",
    r"\b(recipe\s+for|how\s+to\s+(bake|cook)|sourdough|chocolate\s+cake|pizza\s+dough)\b",
    r"\b(capital\s+of\s+[a-z]+|who\s+was\s+[a-z]+|french\s+revolution|history\s+of\s+[a-z]+)\b",
]

# Comprehensive chemistry, molecular descriptors, cheminformatics, and cosmetic terminology
_IN_DOMAIN_PATTERNS = [
    # Core chemistry & structural concepts (allowed even if skincare is not explicitly mentioned)
    r"\b(chemistry|chemical|molecule|molecular|compound|atom|atomic|bond|bonding|structure|formula|element|periodic\s+table)\b",
    r"\b(organic\s+chemistry|functional\s+group|stereochemistry|conformation|isomer|enantiomer|chirality|substituent)\b",
    r"\b(smiles|canonical\s+smiles|inchi|inchi-key|pubchem|chembl|rdkit|cheminformatics|chemoinformatics)\b",
    r"\b(aromatic|benzene|pyridine|ring|heterocycle|aliphatic|alkane|alkene|alkyne)\b",
    r"\b(hydroxyl|carboxyl|carbonyl|amine|amide|ester|ether|thiol|halogen|hydroxyl\s+group|carboxylic\s+acid)\b",
    r"\b(polar|polarity|polar\s+surface|electronegativity|solubility|hydrophilic|hydrophobic|lipophilic|lipophilicity)\b",
    r"\b(pka|ph|ionization|dissociation|partition|partition\s+coefficient)\b",
    # Molecular descriptors
    r"\b(molecular\s+weight|mw|molar\s+mass|exact\s+mass|heavy\s+atom|atom\s+count)\b",
    r"\b(clogp|logp|tpsa|topological\s+polar|polar\s+surface\s+area)\b",
    r"\b(hbd|hba|hydrogen\s+bond|hydrogen\s+bonding|hydrogen\s+donor|hydrogen\s+acceptor)\b",
    r"\b(rotatable\s+bond|molar\s+refractivity|refractivity)\b",
    # Drug-likeness & rule filters
    r"\b(lipinski|rule\s+of\s+(5|five)|ro5|ghose|ghose\s+filter|veber|druglike|drug-likeness|oral\s+bioavailability|violation)\b",
    # Permeability, Potts-Guy, transdermal science
    r"\b(potts[-–\s]guy|potts\s+guy|skin\s+permeability|transdermal|stratum\s+corneum|permeability|kp|log\s+kp)\b",
    r"\b(cm/h|cm/s|flux|skin\s+absorption|penetration|skin\s+penetration|permeate|dermal|cutaneous|skin\s+barrier)\b",
    r"\b(applicability\s+domain|diffusion|diffusion\s+coefficient)\b",
    # Cosmetic ingredients, skincare, and topical formulation science
    r"\b(cosmetic|cosmetics|skincare|skin|dermatology|topical|formulation|ingredient|active\s+ingredient)\b",
    r"\b(emollient|humectant|surfactant|preservative|antioxidant|chelating|penetration\s+enhancer)\b",
    r"\b(niacinamide|salicylic|glycerin|glycerol|retinol|retinoid|ceramide|hyaluronic|ascorbic|vitamin\s+c)\b",
    r"\b(glycol|aha|bha|lactic|glycolic|tocopherol|panthenol|zinc|titanium\s+dioxide|sunscreen|uv\s+filter)\b",
    r"\b(caffeine|urea|resveratrol|bakuchiol|squalane|kojic|arbutin|peptides)\b",
    # Comparative analysis & result interpretation
    r"\b(compare|comparison|difference|ratio|higher\s+kp|lower\s+kp|pass|fail|violate|benchmark)\b",
]


def evaluate_domain_restriction(
    message: str,
    has_context: bool = False,
) -> Tuple[bool, Optional[str]]:
    """
    Evaluates whether the user's message is within the permitted SkinSafe domain.
    Returns:
        (is_allowed: bool, direct_response: Optional[str])
        - If is_allowed is False: direct_response contains the polite refusal message.
        - If is_allowed is True and direct_response is present: returns a pre-computed response (greeting or follow-up).
        - If is_allowed is True and direct_response is None: message is approved for LLM generation.
    """
    clean_msg = message.strip()
    msg_lower = clean_msg.lower()

    # 1. Strictly block prompt injections, jailbreaks, and persona overrides
    for pattern in _PROMPT_INJECTION_PATTERNS:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            return False, _POLITE_REFUSAL_MESSAGE

    # 2. Check for natural greetings
    for pattern in _GREETING_PATTERNS:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            return True, _GREETING_RESPONSE

    # 3. Check for in-domain chemistry, descriptor, rule, or cosmetic keywords
    # Any chemistry question is allowed, even if skincare is not explicitly mentioned
    has_chemistry_signal = False
    for pattern in _IN_DOMAIN_PATTERNS:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            has_chemistry_signal = True
            break

    if has_chemistry_signal:
        return True, None

    # 4. If analysis/comparison context is active, allow contextual inquiry
    # (e.g., "Why did this fail?", "What does its TPSA indicate?", "Explain the difference")
    if has_context:
        context_inquiry_patterns = [
            r"\b(why|explain|what|how|does|is|tell\s+me|summarize|interpretation|result|prediction|value|reading|fail|pass)\b",
        ]
        for pattern in context_inquiry_patterns:
            if re.search(pattern, msg_lower, re.IGNORECASE):
                return True, None

    # 5. Allow short conversational follow-ups
    for pattern in _CONVERSATIONAL_FOLLOW_UPS:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            if "elaborate" in msg_lower or "more" in msg_lower or "go on" in msg_lower or "continue" in msg_lower:
                return True, None
            return True, (
                "You're welcome! Let me know if you would like to explore other molecular descriptors, "
                "test another cosmetic compound, or analyze skin permeability predictions."
            )

    # 6. Check for explicitly unrelated off-topic requests (website development, sports, creative writing, etc.)
    for pattern in _OFF_TOPIC_PATTERNS:
        if re.search(pattern, msg_lower, re.IGNORECASE):
            return False, _POLITE_REFUSAL_MESSAGE

    # 7. Default refusal for any ambiguous query lacking chemistry or analysis signals
    return False, _POLITE_REFUSAL_MESSAGE
