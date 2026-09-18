
GENRES = [
    "acid house", "ambient techno", "breakcore", "deep house", "detroit techno",
    "drum and bass", "dub techno", "electro", "footwork", "gabber", "garage house",
    "hardgroove techno", "hyperpop", "idm", "jungle", "microhouse", "minimal synth",
    "progressive house", "psytrance", "synthwave", "tech house", "trance",
    "trip-hop", "uk garage", "witch house", "berlin school", "dark ambient", "drone", "dungeon synth", "field recording",
    "harsh noise", "lowercase", "modular synth", "musique concrete", "new age",
    "power electronics", "space ambient", "tape loops", "art punk", "blackgaze", "chamber pop", "dream pop", "emo", "garage rock",
    "grunge", "hardcore punk", "indie folk", "indie rock", "jangle pop",
    "krautrock", "math rock", "midwest emo", "noise rock", "post-hardcore",
    "post-punk", "post-rock", "power pop", "psychedelic rock", "shoegaze",
    "slowcore", "space rock", "stoner rock", "surf rock","atmospheric black metal", "black metal", "death metal", "deathcore",
    "doom metal", "drone metal", "folk metal", "funeral doom", "grindcore",
    "metalcore", "post-metal", "progressive metal", "sludge metal",
    "speed metal", "technical death metal", "thrash metal", "abstract hip-hop", "boom bap", "cloud rap", "conscious hip-hop", "drill",
    "experimental hip-hop", "funk", "g-funk", "jazz rap", "lo-fi hip-hop",
    "neo-soul", "phonk", "rnb", "soul", "trap", "afrobeat", "americana", "bedroom pop", "bossa nova", "chiptune", "city pop",
    "cumbia", "dub", "free jazz", "fourth world", "gospel", "highlife",
    "jazz fusion", "klezmer", "modern classical", "new wave", "nu jazz",
    "outsider folk", "post-bop", "reggae", "singer-songwriter", "ska",
    "spiritual jazz", "spoken word", "synth pop", "vaporwave",
]

GENRE_SET = {g.lower() for g in GENRES}

BROAD_TAGS = {
    "alternative", "ambient", "beats", "dance", "electronic", "electronica",
    "experimental", "folk", "hip hop", "hip-hop", "hip-hop/rap", "indie",
    "instrumental", "jazz", "metal", "music", "pop", "punk", "rap", "rock",
    "singer", "songwriter", "soundtrack", "world", "avant-garde", "noise",
    "lo-fi", "lofi", "underground", "diy", "new music", "album", "ep", "single",
}

_LOCATION_HINTS = {
    "usa", "united states", "uk", "united kingdom", "england", "scotland",
    "wales", "ireland", "canada", "australia", "new zealand", "germany",
    "france", "spain", "portugal", "italy", "poland", "russia", "ukraine",
    "japan", "china", "korea", "brazil", "argentina", "chile", "colombia",
    "mexico", "peru", "uruguay", "netherlands", "belgium", "sweden", "norway",
    "denmark", "finland", "iceland", "greece", "turkey", "india", "indonesia",
    "south africa", "nigeria", "london", "berlin", "paris", "tokyo", "osaka",
    "new york", "brooklyn", "los angeles", "chicago", "detroit", "seattle",
    "portland", "austin", "atlanta", "toronto", "montreal", "vancouver",
    "melbourne", "sydney", "buenos aires", "rosario", "cordoba", "sao paulo",
    "rio de janeiro", "bogota", "madrid", "barcelona", "lisbon", "amsterdam",
    "copenhagen", "oslo", "stockholm", "helsinki", "moscow", "kyiv", "warsaw",
    "prague", "vienna", "zurich", "dublin", "glasgow", "manchester", "bristol",
    "leeds", "birmingham", "philadelphia", "boston", "san francisco", "oakland",
    "denver", "minneapolis", "nashville", "new orleans", "miami", "houston",
    "dallas", "phoenix", "santa fe",
}


def is_location(tag: str) -> bool:
    return tag.strip().lower() in _LOCATION_HINTS


def specificity(tag: str) -> int:
    """Higher = more likely to be a usefully specific genre. Negative = reject."""
    t = tag.strip().lower()
    if not t or is_location(t):
        return -1
    if t in BROAD_TAGS:
        return 0
    score = 1
    if t in GENRE_SET:
        score += 5
        score += min(len(t.split()) - 1, 3)
    if "-" in t or "/" in t:
        score += 1
    if len(t) > 32:
        score -= 3
    return score


ALIASES = {
    "dnb": "drum and bass", "d&b": "drum and bass", "drum & bass": "drum and bass",
    "drum n bass": "drum and bass", "dark jungle": "jungle", "liquid dnb": "drum and bass",
    "blackmetal": "black metal", "black-metal": "black metal",
    "dsbm": "atmospheric black metal", "atmo black metal": "atmospheric black metal",
    "post metal": "post-metal", "post rock": "post-rock", "post punk": "post-punk",
    "postpunk": "post-punk", "post hardcore": "post-hardcore", "posthardcore": "post-hardcore",
    "deathmetal": "death metal", "tech death": "technical death metal",
    "doom": "doom metal", "sludge": "sludge metal", "drone doom": "drone metal",
    "stoner": "stoner rock", "psych rock": "psychedelic rock", "psych": "psychedelic rock",
    "psychedelic": "psychedelic rock", "shoegazer": "shoegaze", "nu-gaze": "shoegaze",
    "dreampop": "dream pop", "bedroom": "bedroom pop", "synthpop": "synth pop",
    "synth-pop": "synth pop", "synth wave": "synthwave", "darksynth": "synthwave",
    "coldwave": "minimal synth", "minimal wave": "minimal synth",
    "idm/experimental": "idm", "braindance": "idm", "intelligent dance music": "idm",
    "acid": "acid house", "acid techno": "acid house", "hard techno": "hardgroove techno",
    "minimal techno": "microhouse", "dub-techno": "dub techno",
    "ukg": "uk garage", "2step": "uk garage", "2-step": "uk garage",
    "footwork/juke": "footwork", "juke": "footwork",
    "triphop": "trip-hop", "trip hop": "trip-hop",
    "lofi hip hop": "lo-fi hip-hop", "lo fi hip hop": "lo-fi hip-hop",
    "lofi beats": "lo-fi hip-hop", "boombap": "boom bap", "boom-bap": "boom bap",
    "abstract hip hop": "abstract hip-hop", "experimental hip hop": "experimental hip-hop",
    "jazz hop": "jazz rap", "jazzy hip hop": "jazz rap",
    "r&b": "rnb", "r n b": "rnb", "rhythm and blues": "rnb",
    "darkambient": "dark ambient", "ambient drone": "drone", "drone ambient": "drone",
    "space music": "space ambient", "field recordings": "field recording",
    "musique concrète": "musique concrete", "tape music": "tape loops",
    "modular": "modular synth", "eurorack": "modular synth",
    "dungeonsynth": "dungeon synth", "dark dungeon music": "dungeon synth",
    "hnw": "harsh noise", "harsh noise wall": "harsh noise", "pe": "power electronics",
    "mathrock": "math rock", "noiserock": "noise rock", "slowcore/sadcore": "slowcore",
    "emo revival": "midwest emo", "screamo": "post-hardcore",
    "hardcore": "hardcore punk", "punk rock": "hardcore punk", "d-beat": "hardcore punk",
    "garage": "garage rock", "jangle": "jangle pop", "power-pop": "power pop",
    "singer/songwriter": "singer-songwriter", "singer songwriter": "singer-songwriter",
    "freak folk": "outsider folk", "weird folk": "outsider folk",
    "folk rock": "indie folk", "alt country": "americana", "alt-country": "americana",
    "modern composition": "modern classical", "neoclassical": "modern classical",
    "contemporary classical": "modern classical",
    "spiritual": "spiritual jazz", "free improvisation": "free jazz", "free improv": "free jazz",
    "jazz-funk": "jazz fusion", "fusion": "jazz fusion",
    "chip music": "chiptune", "8bit": "chiptune", "8-bit": "chiptune",
    "vapor": "vaporwave", "mallsoft": "vaporwave",
    "citypop": "city pop", "afro-beat": "afrobeat", "afro beat": "afrobeat",
}


def normalize(tag: str) -> str:
    """Lowercase, squash whitespace, and apply the alias table."""
    t = " ".join((tag or "").split()).strip().lower().strip("#")
    return ALIASES.get(t, t)


def match_taxonomy(tag: str) -> str | None:
    """Canonical taxonomy label for a tag, if there is one."""
    t = normalize(tag)
    if t in GENRE_SET:
        return t
    longest = None
    for genre in GENRE_SET:
        if genre in t and (longest is None or len(genre) > len(longest)):
            longest = genre
    return longest


def best_genre(tags) -> tuple[str | None, float]:
    candidates = []
    for i, raw in enumerate(tags or []):
        tag = normalize(raw)
        score = specificity(tag)
        if score < 1:
            continue
        canonical = match_taxonomy(tag)
        if canonical == tag:
            confidence = 0.9
        elif canonical:
            confidence = 0.8
        elif score >= 2:
            confidence = 0.65
        else:
            continue
        candidates.append((confidence, score, -i, tag))

    if not candidates:
        return None, 0.0
    confidence, _, _, tag = max(candidates)
    return tag, confidence


def best_tag(tags) -> str | None:
    """Back-compat wrapper: just the genre, no confidence."""
    return best_genre(tags)[0]
