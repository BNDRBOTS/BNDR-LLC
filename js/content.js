// BNDR content — single source of truth for every word on the site.
// Markdown-first: any *Md field renders as formatted content on the live site.
// Edit from dashboard.html → Save draft (preview) → Export content.js → replace this file → deploy.
window.BNDR_CONTENT = {
  version: 3.5,

  owner: {
    // Deliberately unset in the distributable. Open dashboard.html privately,
    // create the first passphrase, export content.js, and only then deploy.
    passHash: null,
    // Added during first setup or the next legacy passphrase change; salted
    // PBKDF2 then replaces and removes the legacy passHash field.
    passKdf: null,
    // Optional public key for signed, time-limited operator links. The console creates this; the private key never enters content.js.
    operatorPublicKey: null,
    // Optional deployed deny-list for cancelling individual operator links.
    // The console manages these random nonces; no access token is stored here.
    operatorRevokedNonces: []
  },

  meta: {
    siteName: "BNDR LLC",
    baseUrl: "https://bndrllc.com",
    tagline: "Custom Website Design and Strategic Marketing | Phoenix, AZ",
    logo: "https://r2-uploader-production.up.railway.app/files/6a9dd45e-e7a0-4396-a084-5f11b737e92e.png",
    ogImage: "https://dl.dropboxusercontent.com/scl/fi/9z9t4iy7758k9tsa9k4ia/upscale_image-10.jpeg?rlkey=67mn0n5ijc9s62ucs89zz15zk&st=xo5rmfcz&raw=1",
    email: "bndr.labs@gmail.com",
    substack: "https://substack.com/@bndrllc",
    twitter: "@BNDRLLC",
    region: "Phoenix, AZ"
  },

  // Optional. If this section is absent, js/site.js renders these same defaults.
  // Marks, colors, layout, legal links, logo, and shine behavior stay code-only.
  footer: {
    social: [
      { id: "linkedin", enabled: true, url: "https://www.linkedin.com/in/bndrtech/" },
      { id: "github", enabled: true, url: "https://github.com/bndrbots" },
      { id: "instagram", enabled: true, url: "https://www.instagram.com/bndrllc" },
      { id: "facebook", enabled: true, url: "https://www.facebook.com/BNDRLLC" },
      { id: "substack", enabled: true, url: "https://substack.com/@bndrllc" },
      { id: "buymeacoffee", enabled: true, url: "https://buymeacoffee.com/bndr" },
      { id: "gumroad", enabled: true, url: "https://bndrllc.gumroad.com" },
      { id: "promptbase", enabled: true, url: "https://promptbase.com/profile/bndrllc" },
      { id: "x", enabled: false, url: "" },
      { id: "youtube", enabled: false, url: "" },
      { id: "tiktok", enabled: false, url: "" },
      { id: "discord", enabled: false, url: "" },
      { id: "etsy", enabled: false, url: "" },
      { id: "patreon", enabled: false, url: "" },
      { id: "threads", enabled: false, url: "" },
      { id: "dribbble", enabled: false, url: "" }
    ]
  },

  // Optional dashboard-managed navigation. Older content.js files fall back
  // to the identical links already present in each HTML page.
  nav: {
    links: [
      { label: "Home", href: "index.html" },
      { label: "Sites", href: "sites.html" },
      { label: "Apps", href: "apps.html" },
      { label: "Photos", href: "photos.html" },
      { label: "Blog", href: "blog.html" },
      { label: "Builder", href: "builder.html" },
      { label: "Templates", href: "templates.html" },
      { label: "Estimate", href: "estimate.html" }
    ]
  },

  hero: {
    descMd: "Custom websites for businesses that expect more. **Shaped around the psychology of choice.**",
    values: ["Customized Code", "Engaging Motion", "Attention Holding", "Premium Designs"]
  },

  home: {
    proofLeadMd: "Design is the marketing. **Here are the receipts.** Every number below comes from primary research and links straight to it. Cross-checked. No marketing fog.",
    proofFacts: ["judge-50ms", "credibility-design", "mobile-abandon", "expect-2s", "conversion-100ms", "trust-referral"],
    sections: [
      {
        badge: "Why Go Custom?",
        title: "First Impressions & Credibility",
        bodyMd: "You have about **50 milliseconds** before someone decides if your site looks credible. That's not a guess; it's from Lindgaard et al. in *Behaviour & Information Technology*. Once they're in, the halo effect kicks in: if it looks right, people assume your work is right. That's why I build with tactile feedback. Click, bump, beep, swing, or sing. A site that doesn't answer back feels broken."
      },
      {
        badge: "Why BNDR?",
        title: "Attention To Detail",
        bodyMd: "Google's own data says **53% of mobile site visits are abandoned** if a page takes longer than three seconds to load. And a one-second delay? That's a 7% loss in conversions — Aberdeen Group, backed by Akamai. If your site doesn't load fast and move right, you're gone before you start."
      },
      {
        badge: "What's The Point?",
        title: "It's More Than Meets The Eye",
        bodyMd: "Moderate-speed animations make waiting feel shorter and help you sell more, per Stanford research (Ding & Kyung, 2025). But trust breaks faster: if a site feels off or weird, most people just leave — and a strange layout alone makes 4 in 10 think something's wrong. Reliability *is* the aesthetic."
      }
    ]
  },

  photos: {
    leadMd: "Stills from the lab. Every frame is licensed direct — no stock house, no middleman.",
    categories: [
      { id: "singularity", title: "Singularity", vibe: "violet" },
      { id: "neon", title: "Neon Structures", vibe: "cyan" },
      { id: "texture", title: "Textures", vibe: "amber" }
    ],
    items: [
      {
        id: "wrpd",
        title: "Image 01 // Wrpd",
        cat: "singularity",
        img: "https://dl.dropboxusercontent.com/scl/fi/kfl4hkrx8pzalrybc48wf/u9574564132_Inside_the_Singularity_The_Final_Shot_Your_shot_isn_0defdbda-8daa-4dc9-8093-5c1783344231.png?rlkey=n86clze3ksj3zi5vyahjpu3p8&st=f45yrals&raw=1",
        descMd: "A swirling vortex of humanity.",
        frame: "tall",
        price: "$140",
        paymentLink: ""
      },
      {
        id: "lava-layer",
        title: "Image 02 // Lava Layer",
        cat: "neon",
        img: "https://dl.dropboxusercontent.com/scl/fi/b6rj16y4ng0k2x9otxitx/digital_tokyo_A_futuristic_honeycomb_design_with_glowing_neon_o_981cfb04-d986-4e79-96a1-3d079d686659.png?rlkey=hl0k5ed068oahl01xx1wnuhn1&st=utwtjr10&raw=1",
        descMd: "It never settles. It just keeps pushing right. It is restless. It moves in waves.",
        frame: "wide",
        price: "$140",
        paymentLink: ""
      },
      {
        id: "faded-circuit",
        title: "Image 03 // Faded Circuit",
        cat: "texture",
        img: "https://r2-uploader-production.up.railway.app/files/3fe339a0-3124-46a8-860b-a41b4b8629db.jpeg",
        descMd: "Signal decay, held still long enough to look at.",
        frame: "square",
        price: "$120",
        paymentLink: ""
      }
    ]
  },

  apps: {
    leadMd: "Working software, not mockups. Every app runs live — open one and use it before you own it.",
    categories: [
      { id: "calm", title: "Focus & Calm", vibe: "cyan" },
      { id: "play", title: "Play & Motion", vibe: "magenta" },
      { id: "tools", title: "Tools & Interaction", vibe: "plasma" }
    ],
    items: [
      { id: "breathe", title: "Breathe Machine", cat: "calm", url: "https://bndrbots.github.io/breathemachine/", descMd: "A paced-breathing instrument. Sit down rattled, stand up level.", price: "", paymentLink: "" },
      { id: "binaural", title: "Binaural", cat: "calm", url: "https://bndrbots.github.io/binaural/", descMd: "Generated binaural beds for deep-focus sessions.", price: "", paymentLink: "" },
      { id: "mindcan", title: "Mind Can", cat: "calm", url: "https://bndrbots.github.io/mindcan/", descMd: "Capture the thought before it evaporates.", price: "", paymentLink: "" },
      { id: "rita-boss", title: "Rogue Rita — Boss Pack", cat: "play", url: "https://bndrbots.github.io/RogueRita_CyberArena_BossPack/", descMd: "Cyber-arena boss fights. Browser-native, zero installs.", price: "", paymentLink: "" },
      { id: "rita-vapor", title: "Rogue Rita — Vaporwave", cat: "play", url: "https://bndrbots.github.io/RogueRita_Vaporwave/", descMd: "Same bones, different fever dream.", price: "", paymentLink: "" },
      { id: "rita-v1", title: "Rogue Rita V1", cat: "play", url: "https://bndrbots.github.io/RogueRitaV1/", descMd: "Where the arena started.", price: "", paymentLink: "" },
      { id: "reflex", title: "Reflex", cat: "play", url: "https://bndrbots.github.io/reflex/", descMd: "Reaction-time under pressure. Simple rules, mean curve.", price: "", paymentLink: "" },
      { id: "voice", title: "BNDR Voice", cat: "tools", url: "https://bndrbots.github.io/BNDRVoice/", descMd: "Voice-driven interaction, straight in the browser.", price: "", paymentLink: "" },
      { id: "slct", title: "SLCT", cat: "tools", url: "https://bndrbots.github.io/slct/", descMd: "Decision friction, removed.", price: "", paymentLink: "" },
      { id: "controlled", title: "Controlled Output", cat: "tools", url: "https://bndrbots.github.io/controlledoutput/", descMd: "Structured output you can actually rely on.", price: "", paymentLink: "" },
      { id: "resource", title: "Resource Cite", cat: "tools", url: "https://bndrbots.github.io/resourcecite/#home", descMd: "Citations without the ceremony.", price: "", paymentLink: "" },
      { id: "solar", title: "Solar Expanse", cat: "tools", url: "https://bndrbots.github.io/solarexpanse/", descMd: "A quiet, spatial screen for long thinking.", price: "", paymentLink: "" }
    ]
  },

  sites: {
    leadMd: "The BNDR portfolio. Built from scratch, owned by the client, **more to come.**",
    categories: [
      { id: "brand", title: "Brand & Design", vibe: "plasma" },
      { id: "concept", title: "Concepts & Experiences", vibe: "magenta" }
    ],
    items: [
      { title: "Business SaaS Demo", cat: "brand", url: "https://bndrbots.github.io/raydeo/", noteMd: "A full SaaS front — pricing psychology, motion discipline, conversion path." },
      { title: "Voss", cat: "brand", url: "https://bndrbots.github.io/Voss/", noteMd: "Premium-minimal. The restraint is the flex." },
      { title: "Forma", cat: "brand", url: "https://bndrbots.github.io/forma/", noteMd: "Structure-first identity work." },
      { title: "Life Space", cat: "brand", url: "https://bndrbots.github.io/lifespace", noteMd: "Warmth without the clip-art. A service brand people believe." },
      { title: "Jacksons", cat: "brand", url: "https://bndrbots.github.io/jacksons/", noteMd: "Local business, big-league presence." },
      { title: "Zen", cat: "brand", url: "https://bndrbots.github.io/zen/", noteMd: "Calm as a design system." },
      { title: "Liquid Glass", cat: "concept", url: "https://bndrbots.github.io/liquidglass/", noteMd: "Material study — refraction, depth, restraint." },
      { title: "Immersion", cat: "concept", url: "https://bndrbots.github.io/immersion/", noteMd: "What a page feels like when it commits." },
      { title: "Demo", cat: "concept", url: "https://bndrbots.github.io/demo/", noteMd: "A sandbox for interaction physics." },
      { title: "Oil Flux", cat: "concept", url: "https://bndrbots.github.io/oilflux/", noteMd: "Liquid motion, held to a grid." },
      { title: "Heavy Ink", cat: "concept", url: "https://bndrbots.github.io/heavyink/", noteMd: "Typography with a body weight." }
    ]
  },

  templates: {
    leadMd: "A growing rail of complete site systems you can preview before purchase. **Built cleanly, editable without a framework, and ready for your identity.**",
    comingSoonMd: "The first releases are in production. When one ships, you will be able to inspect the live example here and purchase through a hosted Stripe or Gumroad checkout.",
    categories: [
      { id: "business", title: "Business", vibe: "plasma" },
      { id: "portfolio", title: "Portfolio", vibe: "magenta" },
      { id: "launch", title: "Launch", vibe: "cyan" }
    ],
    // Add items from Dashboard → Galleries → Templates. paymentLink accepts
    // only Stripe or Gumroad HTTPS checkout URLs on the public site.
    items: []
  },

  blog: {
    leadMd: "Field notes on design psychology, speed, and building alone — written by the person who ships the code.",
    posts: [
      {
        slug: "the-50-millisecond-interview",
        title: "The 50-Millisecond Interview",
        date: "2026-07-10",
        tags: ["design psychology", "credibility"],
        descMd: "Your website gets judged faster than a handshake. What that means for how you build — and what visitors decide before they read a single word.",
        bodyMd: "Your site gets interviewed before you do. A visitor forms a judgment of visual appeal almost instantly — long before they read your headline, your offer, or your name.\n\nThat first impression isn't decoration. It's a **credibility decision**. People routinely judge whether a business is legitimate from layout, type, and color — the visual design — more than from anything the site actually says. The design *is* the argument.\n\n## What I do about it\n\n- **Tactile feedback everywhere.** Click, bump, swing, or sing — a site that doesn't answer back feels broken.\n- **One visual voice.** Every page holds the same identity, so trust compounds instead of resetting.\n- **No template smell.** Visitors have seen every theme on earth. Custom reads as effort, and effort reads as competence.\n\n## The takeaway\n\nYou don't get to present your case and *then* be judged. The judgment happens first, in a window shorter than a blink. Build for the blink."
      },
      {
        slug: "speed-is-a-design-decision",
        title: "Speed Is a Design Decision",
        date: "2026-07-16",
        tags: ["performance", "mobile"],
        descMd: "Slow doesn't look slow — it looks broken. Why load time belongs in the design conversation, not the IT ticket queue.",
        bodyMd: "Nobody sees a slow website. They see a blank screen, assume it's broken, and leave. On mobile, that's not a leak — it's a flood: most abandonment happens before your page ever paints.\n\nSpeed isn't an engineering afterthought. It's the **first design element anyone experiences**. Users arrive with a stopwatch already running and expectations set by the fastest app on their phone.\n\n## How BNDR builds for it\n\n1. **No framework tax.** Hand-written pages ship kilobytes, not megabytes.\n2. **Motion that pays rent.** Animation guides attention and masks the few milliseconds that remain — it never adds to them.\n3. **Measured, not vibed.** Every build gets tested on a real phone over a real cell connection before it ships.\n\nConversion follows the same curve. Speed improvements you can barely perceive show up in revenue you definitely can. Milliseconds compound — in both directions.\n\n> Fast is a feature. Slow is a verdict."
      }
    ]
  },

  builder: {
    kicker: "The Builder",
    title: "Scott. One person. The whole stack.",
    introMd: "I'm Scott — the person behind BNDR. Not a team pretending to be one person, not a person pretending to be a team. I design, write, code, test, and ship everything with the BNDR mark on it, from Phoenix, Arizona.\n\nThe business runs on a simple contract: **excellent, honest work at a price you knew before you said yes.** No retainer traps. No upsell theatre. You own everything I build for you — code, assets, all of it — and you get a direct line to the person who writes the code and makes the changes himself.\n\nMost of my work arrives by referral: somebody saw a site I built and asked who made it. That's the whole marketing plan, and it's working — people trust a recommendation from someone they know over any ad on earth.",
    shipped: [
      { name: "Client & portfolio builds", note: "20+ live sites, apps, and experiments — every one custom-coded, every one in the galleries on this site." },
      { name: "R2 media rail", note: "A self-hosted file service on Railway that serves the imagery on this very page. Built because stock pipelines were the bottleneck." },
      { name: "BNDR brand system", note: "The identity you're looking at — bone, void, plasma — carried across every product without exception." }
    ],
    motion: [
      { name: "QuickResets", note: "A QR code and a single dollar. Scan a code on a bus stop, give one buck, and it moves straight to someone in a critical situation. The payment rail and landing page are in the build phase now — then the first codes go up around Phoenix Metro and Sedona." },
      { name: "AI behavior auditing", note: "A pattern taxonomy and tooling for catching where AI systems drift, pad, and dodge. Born from running these models hard every day." },
      { name: "This site's owner console", note: "Markdown-first publishing with a verified-facts layer — the machine can only cite sources from a hand-checked registry. Eating my own cooking before offering it to clients." }
    ],
    next: [
      { name: "First QR codes in the wild", note: "Phoenix Metro first. Sedona after. Quiet outreach alongside — finding people before they fall deeper." },
      { name: "App licensing", note: "The lab apps move from free demos to owned builds — buy it once, it's yours, same as the sites." }
    ],
    missionMd: "## Why any of this exists\n\nBNDR was never meant to stop at websites. The business is the vehicle. The revenue funds the thing I actually care about: reaching people who are marginalized, disabled, or falling through the gaps of a system that wasn't built to catch them. I've been on the wrong side of that gap myself. It's real, it's ignored, and it needs to be handled.\n\nThis is for people whose world just collapsed — a parent out of groceries, someone staring down their first night on the street, capable people drowning quietly because they don't know how to ask. Cash matters right away, but the reset has to be a path forward: connecting people with advocates who can bridge the gap to the right agencies, because a stack of forms you have to face alone isn't help.\n\nUntil the rail is live, the mission looks like this: **build you something excellent, charge you honestly, and put the proceeds to work where they're needed most.** If you need a site, want to contribute, or you've made something like this work before — get in touch.",
    ctaMd: "If you're building something real — or you know someone who needs a site that actually works — the line is direct: no secretary, no project manager, no queue."
  },

  pricing: {
    leadMd: "One guy. Custom code.  \n**Direct to Source.**",
    tiers: [
      { title: "Launch Site Special", price: "$599" },
      { title: "One-Page Lander™", price: "$2,500" },
      { title: "Three-Page Custom™", price: "$4,500" },
      { title: "Small Business Site™", price: "$6,500" }
    ]
  },

  faq: [
    {
      q: "What's the difference between BNDR and an agency?",
      aMd: "Agencies often swap your logo, change your colors, upload your pictures, shift some layout objects around and call it custom. Then they lock you into workflows and retainers that are 'sticky.' Every custom site I build from scratch is for your business and **belongs to you once it's made** — no attachments. The only long-term contract involved is my commitment of quality to you. You communicate with me directly, not a secretary or project manager."
    },
    {
      q: "Do I own the code?",
      aMd: "**Yes.** The site is built uniquely for your business and you own the code and the assets unconditionally. You can move the site to your own host whenever you choose."
    },
    {
      q: "How do hosting and care work?",
      aMd: "Hosting is **$99 a month**. I keep the site live and reachable. That fee covers the environment and the uptime, so I take responsibility for the site being online. This is separate from ongoing labor."
    },
    {
      q: "What if I need updates or a new page?",
      aMd: "Tweaks and maintenance like text changes or image swaps are **$79 an hour** with a one hour minimum. An entirely new interior page is a flat **$300**."
    }
  ],

  intake: {
    leadMd: "Tap through a few options and the number updates live. Flat pricing, known before you say yes \u2014 no sales call, no email chain, no surprises.",
    // Form endpoint. Empty = FormSubmit AJAX built from meta.email at runtime
    // (first real submission triggers a one-time activation email from FormSubmit \u2014 click it once and you're live).
    // Paste any other endpoint URL here (Static Forms, Basin, \u2026) to switch services without touching code.
    endpoint: "",
    successMd: "**Got it \u2014 it's in my inbox.** You'll hear back from me directly, usually same day. No secretary, no queue, no drip campaign.",
    hostingNote: "Flat build price. Hosting is $99/mo separate \u2014 covered in the FAQ below.",
    businessTypes: [
      "Home services / trades",
      "Med spa / salon / aesthetics",
      "Law / professional practice",
      "Restaurant / food",
      "Local shop / retail",
      "Personal brand / creative",
      "Something else"
    ],
    needs: [
      "Brand-new site \u2014 nothing exists yet",
      "Redesign \u2014 my current site embarrasses me",
      "Landing page for a campaign or launch",
      "Not sure \u2014 tell me what I need"
    ],
    sizes: [
      { label: "Launch Site Special", detail: "One sharp page, fast", price: 599 },
      { label: "One-Page Lander\u2122", detail: "A single page engineered to convert", price: 2500 },
      { label: "Three-Page Custom\u2122", detail: "Home, work, contact \u2014 the full pitch", price: 4500 },
      { label: "Small Business Site\u2122", detail: "The complete presence", price: 6500 }
    ],
    addons: [
      { label: "Blog / field notes", price: 500 },
      { label: "Photo or work gallery", price: 400 },
      { label: "Copywriting help", price: 450 },
      { label: "Logo / brand touch-up", price: 600 }
    ],
    timelines: ["ASAP", "Within a month", "This quarter", "Just looking"],
    budgets: ["Under $1k", "$1k \u2013 $3k", "$3k \u2013 $6k", "$6k+", "Not sure yet"]
  }
};
