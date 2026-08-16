/**
 * 300 unique typefaces for TipTap (no duplicates).
 * Loaded on demand from Google Fonts.
 */
export type FontEntry = {
  /** Display name (unique) */
  name: string
  /** Google Fonts family query (spaces OK; encoded later) */
  google?: string
  /** CSS font-family value applied to the selection */
  css: string
  /** Category hint */
  kind: 'serif' | 'sans' | 'display' | 'hand' | 'mono'
}

const SERIF = [
  'Literata', 'Merriweather', 'Lora', 'Playfair Display', 'Source Serif 4',
  'Libre Baskerville', 'Cormorant Garamond', 'EB Garamond', 'Crimson Text', 'Crimson Pro',
  'Cardo', 'Spectral', 'Noto Serif', 'PT Serif', 'Roboto Serif',
  'Bitter', 'Domine', 'Vollkorn', 'Libre Caslon Text', 'Old Standard TT',
  'Neuton', 'Alegreya', 'Tinos', 'Zilla Slab', 'Rokkitt',
  'Arvo', 'Slabo 27px', 'Josefin Slab', 'BioRhyme', 'Crete Round',
  'Cormorant', 'Cormorant Infant', 'Cormorant SC', 'Sorts Mill Goudy', 'Gentium Book Plus',
  'Gentium Plus', 'Andada Pro', 'Fraunces', 'Newsreader', 'Petrona',
  'Bodoni Moda', 'Libre Caslon Display', 'Gilda Display', 'Cinzel', 'Cinzel Decorative',
  'Unna', 'Prata', 'Rufina', 'Young Serif', 'Instrument Serif',
  'Amiri', 'Scheherazade New', 'Noto Serif Display', 'Noto Serif JP', 'Noto Serif KR',
  'Noto Serif SC', 'Noto Serif TC', 'Shippori Mincho', 'Zen Old Mincho', 'Sawarabi Mincho',
  'Kaisei Decol', 'Kaisei Opti', 'Kaisei Tokumin', 'Yuji Mai', 'Yuji Syuku',
  'Hina Mincho', 'Klee One', 'Kiwi Maru', 'Zen Antique', 'Zen Antique Soft',
  'BIZ UDPMincho', 'IBM Plex Serif', 'STIX Two Text', 'Charis SIL', 'Abhaya Libre',
  'Alike', 'Alike Angular', 'Alice', 'Amethysta', 'Antic Slab',
  'Aref Ruqaa', 'Artifika', 'Asar', 'Baskervville', 'Benne',
  'Bentham', 'Libre Bodoni', 'Brawler', 'Brevia', 'Caladea',
  'Cambo', 'Cantata One', 'Caudex', 'Coustard', 'David Libre',
]

const SANS = [
  'Source Sans 3', 'Inter', 'Roboto', 'Open Sans', 'Lato',
  'Montserrat', 'Nunito', 'Nunito Sans', 'Poppins', 'Raleway',
  'Work Sans', 'DM Sans', 'Manrope', 'Outfit', 'Figtree',
  'Plus Jakarta Sans', 'Space Grotesk', 'Sora', 'Albert Sans', 'Urbanist',
  'Lexend', 'Lexend Deca', 'Lexend Exa', 'Lexend Giga', 'Lexend Mega',
  'Lexend Peta', 'Lexend Tera', 'Lexend Zetta', 'Rubik', 'Karla',
  'Mulish', 'Barlow', 'Barlow Condensed', 'Barlow Semi Condensed', 'Oswald',
  'Cabin', 'Josefin Sans', 'Exo 2', 'Exo', 'Titillium Web',
  'Ubuntu', 'Noto Sans', 'PT Sans', 'PT Sans Narrow', 'PT Sans Caption',
  'Fira Sans', 'Fira Sans Condensed', 'Fira Sans Extra Condensed', 'IBM Plex Sans', 'IBM Plex Sans Condensed',
  'IBM Plex Sans JP', 'IBM Plex Sans KR', 'IBM Plex Sans Arabic', 'IBM Plex Sans Hebrew', 'IBM Plex Sans Thai',
  'Red Hat Display', 'Red Hat Text', 'Red Hat Mono', 'Schibsted Grotesk', 'Instrument Sans',
  'Onest', 'Syne', 'Public Sans', 'Atkinson Hyperlegible', 'Atkinson Hyperlegible Next',
  'Commissioner', 'Epilogue', 'Recursive', 'Hanken Grotesk', 'Familjen Grotesk',
  'Wix Madefor Text', 'Be Vietnam Pro', 'Noto Sans JP', 'Noto Sans KR', 'Noto Sans SC',
  'Noto Sans TC', 'Noto Sans Arabic', 'Noto Sans Devanagari', 'Noto Sans Thai', 'Noto Sans Hebrew',
  'M PLUS 1', 'M PLUS 1p', 'M PLUS 2', 'M PLUS Rounded 1c', 'Zen Kaku Gothic New',
  'Zen Kaku Gothic Antique', 'Zen Maru Gothic', 'Sawarabi Gothic', 'Kosugi', 'Kosugi Maru',
  'BIZ UDPGothic', 'Shippori Antique', 'Shippori Antique B1', 'Yomogi', 'DotGothic16',
  'Chivo', 'Chivo Mono', 'Asap', 'Asap Condensed', 'Maven Pro',
  'Questrial', 'Catamaran', 'Varela Round', 'Varela', 'Oxygen',
  'Hind', 'Hind Madurai', 'Hind Siliguri', 'Hind Guntur', 'Hind Vadodara',
  'Kanit', 'Prompt', 'Sarabun', 'Bai Jamjuree', 'Krub',
  'Mitr', 'Chakra Petch', 'K2D', 'Athiti', 'Taviraj',
  'Saira', 'Saira Condensed', 'Saira Extra Condensed', 'Saira Semi Condensed', 'Saira Stencil One',
  'Archivo', 'Archivo Narrow', 'Archivo Black', 'Encode Sans', 'Encode Sans Condensed',
  'Encode Sans Expanded', 'Encode Sans Semi Condensed', 'Encode Sans Semi Expanded', 'Jost', 'Signika',
  'Signika Negative', 'Overpass', 'Overpass Mono', 'Cairo', 'Tajawal',
  'Almarai', 'El Messiri', 'Harmattan', 'Lateef', 'Noto Kufi Arabic',
]

const DISPLAY = [
  'Bebas Neue', 'Anton', 'Staatliches', 'Alfa Slab One', 'Righteous',
  'Pacifico', 'Lobster', 'Lobster Two', 'Comfortaa', 'Fredoka',
  'Cherry Bomb One', 'Bangers', 'Bungee', 'Bungee Shade', 'Bungee Inline',
  'Bungee Hairline', 'Bungee Outline', 'Monoton', 'Press Start 2P', 'Silkscreen',
  'Orbitron', 'Audiowide', 'Russo One', 'Black Ops One', 'Teko',
  'Rajdhani', 'Changa', 'Changa One', 'Passion One', 'Fugaz One',
  'Bowlby One', 'Bowlby One SC', 'Ultra', 'Lilita One', 'Titan One',
  'Luckiest Guy', 'Boogaloo', 'Chewy', 'Permanent Marker', 'Rock Salt',
  'Special Elite', 'Homemade Apple', 'Caveat', 'Caveat Brush', 'Kalam',
  'Patrick Hand', 'Patrick Hand SC', 'Shadows Into Light', 'Shadows Into Light Two', 'Indie Flower',
  'Amatic SC', 'Architects Daughter', 'Covered By Your Grace', 'Dancing Script', 'Great Vibes',
  'Sacramento', 'Satisfy', 'Yellowtail', 'Allura', 'Alex Brush',
  'Tangerine', 'Pinyon Script', 'Mr Dafoe', 'Mr De Haviland', 'Mrs Saint Delafield',
  'Parisienne', 'Rouge Script', 'Clicker Script', 'Cookie', 'Courgette',
  'Kaushan Script', 'Marck Script', 'Norican', 'Petit Formal Script', 'Qwigley',
  'Rancho', 'Rochester', 'Seaweed Script', 'Stalemate', 'Style Script',
  'Whisper', 'Meow Script', 'Imperial Script', 'Birthstone', 'Birthstone Bounce',
  'Carattere', 'Cherish', 'Comforter', 'Comforter Brush', 'Inspiration',
  'Island Moments', 'Moon Dance', 'Ms Madi', 'Neonderthaw', 'Passions Conflict',
  'Send Flowers', 'Shalimar', 'Splash', 'The Nautigal', 'Vujahday Script',
  'Waterfall', 'Ballet', 'Festive', 'Grey Qo', 'Hurricane',
]

const HAND = [
  'Handjet', 'Gochi Hand', 'Just Another Hand', 'La Belle Aurore', 'Loved by the King',
  'Nothing You Could Do', 'Over the Rainbow', 'Reenie Beanie', 'Waiting for the Sunrise', 'Zeyada',
  'Annie Use Your Telescope', 'Coming Soon', 'Crafty Girls', 'Gloria Hallelujah', 'Give You Glory',
  'Kristi', 'League Script', 'Meddon', 'Miss Fajardose', 'Mr Bedfort',
  'Mrs Sheppards', 'Princess Sofia', 'Ruthie', 'Swanky and Moo Moo', 'Cedarville Cursive',
]

const MONO = [
  'IBM Plex Mono', 'JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Roboto Mono',
  'Space Mono', 'Inconsolata', 'Ubuntu Mono', 'Noto Sans Mono', 'PT Mono',
  'Courier Prime', 'Anonymous Pro', 'Fragment Mono', 'Azeret Mono', 'DM Mono',
  'Nova Mono', 'Share Tech Mono', 'VT323', 'Xanh Mono', 'Spline Sans Mono',
  'Martian Mono', 'Sixtyfour', 'Pixelify Sans', 'Tiny5', 'LXGW WenKai Mono TC',
]

function toEntry(name: string, kind: FontEntry['kind']): FontEntry {
  const quoted = name.includes(' ') ? `"${name}"` : name
  const fallback =
    kind === 'mono'
      ? 'ui-monospace, monospace'
      : kind === 'serif'
        ? 'Georgia, serif'
        : kind === 'hand' || kind === 'display'
          ? 'cursive'
          : 'system-ui, sans-serif'
  return {
    name,
    google: name,
    css: `${quoted}, ${fallback}`,
    kind,
  }
}

function unique300(): FontEntry[] {
  const seen = new Set<string>()
  const out: FontEntry[] = []
  // Balanced quotas so all categories appear (exact total 300)
  const quotas: Array<[string[], FontEntry['kind'], number]> = [
    [SERIF, 'serif', 70],
    [SANS, 'sans', 110],
    [DISPLAY, 'display', 70],
    [HAND, 'hand', 25],
    [MONO, 'mono', 25],
  ]
  for (const [list, kind, quota] of quotas) {
    let n = 0
    for (const name of list) {
      if (n >= quota) break
      const key = name.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      out.push(toEntry(name, kind))
      n++
    }
  }
  // Fill remaining slots from leftover names across buckets
  if (out.length < 300) {
    const rest: Array<[string[], FontEntry['kind']]> = [
      [SERIF, 'serif'],
      [SANS, 'sans'],
      [DISPLAY, 'display'],
      [HAND, 'hand'],
      [MONO, 'mono'],
    ]
    for (const [list, kind] of rest) {
      for (const name of list) {
        if (out.length >= 300) break
        const key = name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(toEntry(name, kind))
      }
      if (out.length >= 300) break
    }
  }
  return out.slice(0, 300)
}

export const FONT_CATALOG: FontEntry[] = unique300()

/** Assert uniqueness at module load */
;(() => {
  const names = FONT_CATALOG.map((f) => f.name.toLowerCase())
  if (names.length !== 300) {
    console.warn(`[fonts] expected 300, got ${names.length}`)
  }
  const uniq = new Set(names)
  if (uniq.size !== names.length) {
    console.warn('[fonts] duplicate names detected')
  }
})()

const loaded = new Set<string>()

/** Load a Google Font stylesheet once. */
export function ensureFontLoaded(entry: FontEntry): void {
  if (!entry.google || loaded.has(entry.google)) return
  loaded.add(entry.google)
  const family = encodeURIComponent(entry.google).replace(/%20/g, '+')
  const href = `https://fonts.googleapis.com/css2?family=${family}:ital,wght@0,400;0,600;0,700;1,400&display=swap`
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

/** Prefetch a small starter set so the page looks good immediately. */
export function prefetchStarterFonts(): void {
  const starters = [
    'Literata',
    'Source Sans 3',
    'IBM Plex Mono',
    'Playfair Display',
    'Inter',
    'JetBrains Mono',
  ]
  for (const name of starters) {
    const entry = FONT_CATALOG.find((f) => f.name === name)
    if (entry) ensureFontLoaded(entry)
  }
}
