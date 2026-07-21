export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  date: string;
  readTime: string;
  image: string;
  content: string[];
};

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1200&q=85`;

export const blogPosts: BlogPost[] = [
  {
    slug: "samsung-galaxy-s24-ultra-review",
    title: "Samsung Galaxy S24 Ultra: The Ultimate Flagship Review",
    excerpt: "Galaxy AI, a 200 MP camera and the built-in S Pen make this the most powerful Samsung phone yet. Here's our hands-on take.",
    category: "Reviews",
    author: "Alicia Tech Team",
    date: "2026-07-15",
    readTime: "8 min read",
    image: img("photo-1610945265064-0e34e5519bbf"),
    content: [
      "The Samsung Galaxy S24 Ultra is not just another flagship — it's a statement. With Galaxy AI woven into every app, a titanium frame that feels premium in hand, and a 200 MP camera that captures stunning detail, this phone sets a new bar for what an Android flagship can be.",
      "The 6.8-inch QHD+ AMOLED display is breathtakingly bright, hitting 2,600 nits peak. Whether you're outdoors in the Nairobi sun or watching a movie in bed, the screen adapts perfectly. The 120Hz adaptive refresh rate keeps everything buttery smooth.",
      "Galaxy AI is the real headline feature. Live Translate breaks language barriers in real-time during calls, Circle to Search lets you Google anything on screen with a simple gesture, and Note Assist summarises your longest meeting notes into clean bullet points.",
      "Battery life is excellent. The 5,000 mAh cell easily lasts a full day of heavy use — streaming, photography, gaming and browsing. 45W fast charging gets you back to 65% in 30 minutes.",
      "The camera system is where the S24 Ultra truly shines. The 200 MP main sensor captures incredible detail, the 5x optical zoom telephoto is sharp, and Nightography mode produces clean, bright low-light shots without the over-processing that plagues competitors.",
      "Our verdict: if you want the best Android phone available in Kenya right now, the Galaxy S24 Ultra is it. It's expensive, but every shilling is justified by the experience.",
    ],
  },
  {
    slug: "iphone-16-pro-vs-samsung-s24",
    title: "iPhone 16 Pro vs Samsung Galaxy S24 Ultra: Which Flagship Wins?",
    excerpt: "Two of the biggest phones of 2026 go head-to-head. We compare cameras, AI features, battery life and value for money.",
    category: "Comparisons",
    author: "Alicia Tech Team",
    date: "2026-07-10",
    readTime: "10 min read",
    image: img("photo-1695048133142-1a20484d2569"),
    content: [
      "The age-old debate continues: iPhone or Galaxy? With the iPhone 16 Pro and Samsung Galaxy S24 Ultra both pushing the boundaries of mobile technology, the choice has never been harder — or more exciting.",
      "On design, both phones feel premium. The iPhone 16 Pro sports a titanium frame with Apple's signature minimalist aesthetic. The S24 Ultra also uses titanium but pairs it with a flatter, more angular look and the integrated S Pen slot.",
      "Performance is neck and neck. The A18 Pro chip in the iPhone is a beast for gaming and video editing, while the Snapdragon 8 Gen 3 in the Galaxy handles multitasking and AI workloads with ease. You won't feel a slowdown on either.",
      "Cameras are where personal preference matters most. The iPhone produces warmer, more natural colours that are ready to post. The Galaxy gives you more zoom range (up to 100x) and better low-light detail. For content creators, the Galaxy's Pro video modes edge ahead; for casual shooters, the iPhone's point-and-shoot reliability wins.",
      "Battery life favours the Galaxy S24 Ultra by a clear margin — the larger 5,000 mAh battery outlasts the iPhone's throughout a heavy day. However, the iPhone charges slightly faster wirelessly with MagSafe.",
      "Price in Kenya: the iPhone 16 Pro starts at around KES 155,000 while the S24 Ultra starts at KES 169,000. Both are premium investments. Our recommendation: choose the iPhone if you're invested in the Apple ecosystem, and the Galaxy if you want the most versatile camera and AI tools.",
    ],
  },
  {
    slug: "best-content-creator-gear-2026",
    title: "Best Content Creator Gear to Buy in 2026",
    excerpt: "From wireless mics to ring lights and portable SSDs, here's the essential kit every Kenyan content creator should own.",
    category: "Buying Guides",
    author: "Alicia Tech Team",
    date: "2026-07-05",
    readTime: "7 min read",
    image: img("photo-1590602847861-f357a9332bbc"),
    content: [
      "Content creation in Kenya has exploded. Whether you're a vlogger, podcaster, TikTok creator or YouTube filmmaker, having the right gear can make the difference between amateur and professional output.",
      "Start with audio. The Rode Wireless GO II is our top pick — dual-channel wireless audio with onboard recording means you never lose a take to interference. Clip the transmitter to your subject, plug the receiver into your phone or camera, and you're ready to record crystal-clear audio.",
      "Lighting is next. The Ulanzi 18-inch RGB Ring Light offers adjustable colour temperature, a built-in phone mount, and tripod compatibility. It's perfect for beauty tutorials, product shots, and live streams. At under KES 9,000, it's a no-brainer.",
      "A sturdy tripod is non-negotiable. The Manfrotto Befree Advanced is lightweight, travel-ready, and holds your camera or phone steady for those perfect framing shots. The ball head allows quick adjustments when you're shooting on the move.",
      "Storage matters more than you think. The SanDisk Extreme Portable SSD 1TB gives you fast, rugged storage for 4K video files. At KES 17,900, it's cheaper than losing footage to a corrupted SD card.",
      "Finally, if you stream or do video calls, the Logitech Brio 4K Webcam delivers ultra-sharp 4K with auto-framing and HDR. It's the simplest way to upgrade your on-camera presence without investing in a dedicated camera setup.",
    ],
  },
  {
    slug: "tecno-camon-30-budget-flagship",
    title: "Tecno Camon 30 Premier: The Budget Flagship That Surprised Us",
    excerpt: "A 50 MP camera, 120Hz display and 5G for under KES 60,000? Tecno is serious about disrupting the mid-range market.",
    category: "Reviews",
    author: "Alicia Tech Team",
    date: "2026-06-28",
    readTime: "6 min read",
    image: img("photo-1601784551446-20c9e07cdbdb"),
    content: [
      "Tecno has been quietly improving its phones year after year, and the Camon 30 Premier 5G is the culmination of that effort. This is a phone that genuinely punches above its price tag.",
      "The 6.77-inch AMOLED display runs at 120Hz, making scrolling and gaming feel as smooth as phones costing twice as much. The colours are vibrant, and the brightness is more than adequate for outdoor use.",
      "The 50 MP main camera with OIS is the standout feature. In daylight, it produces sharp, detailed images with good dynamic range. The 50 MP ultrawide and 50 MP telephoto (3x optical) round out a versatile triple camera setup that's rare at this price.",
      "Performance comes from the MediaTek Dimensity 8200 5G chip — a capable processor that handles daily tasks, moderate gaming and multitasking without breaking a sweat. It's not flagship-level, but it's more than enough for most users.",
      "Battery life is solid. The 5,000 mAh battery with 70W fast charging gets you from 0 to 50% in about 20 minutes. You'll comfortably get through a full day of use.",
      "At KES 54,999, the Tecno Camon 30 Premier 5G offers incredible value. If you want flagship-like features without the flagship price, this is the phone to buy.",
    ],
  },
  {
    slug: "how-to-choose-tablet-2026",
    title: "How to Choose the Right Tablet in 2026: iPad vs Android",
    excerpt: "Tablets are more capable than ever. We break down what to look for and whether the iPad Air M2 or Galaxy Tab S9 is right for you.",
    category: "Buying Guides",
    author: "Alicia Tech Team",
    date: "2026-06-20",
    readTime: "9 min read",
    image: img("photo-1544244015-0df4b3ffc6b0"),
    content: [
      "Tablets have evolved from media consumption devices into genuine productivity tools. With powerful chips, stylus support and keyboard accessories, a good tablet can replace a laptop for many users.",
      "The iPad Air M2 is the best all-round tablet for most people. The M2 chip delivers laptop-class performance, the 11-inch Liquid Retina display is gorgeous, and Apple Pencil support makes it excellent for note-taking and creative work. At KES 95,000, it's not cheap, but the value is undeniable.",
      "The Samsung Galaxy Tab S9 is the best Android alternative. The 11-inch AMOLED display is stunning — arguably better than the iPad for media consumption. The included S Pen is a great bonus, and Samsung's DeX mode turns the tablet into a desktop-like environment when connected to a monitor.",
      "When choosing, consider the ecosystem you're already in. If you use an iPhone and Mac, the iPad integrates seamlessly with AirDrop, Handoff and Universal Clipboard. If you're on Android, the Galaxy Tab S9 syncs effortlessly with Samsung phones and offers more customisation.",
      "For students, the iPad Air M2 with Apple Pencil is hard to beat — the app ecosystem for education and note-taking is unmatched. For creative professionals who prefer Android, the Galaxy Tab S9's display quality and included S Pen make it a compelling choice.",
      "Both tablets offer excellent battery life (10+ hours), fast charging, and premium build quality. You can't go wrong with either — it comes down to your preferred ecosystem and specific use case.",
    ],
  },
  {
    slug: "mobile-accessories-must-have",
    title: "5 Mobile Accessories Every Phone Owner Needs",
    excerpt: "Protect your investment and get more from your phone with these essential accessories under KES 5,000.",
    category: "Buying Guides",
    author: "Alicia Tech Team",
    date: "2026-06-15",
    readTime: "5 min read",
    image: img("photo-1609592424824-76e4c4a17b1d"),
    content: [
      "You've spent tens of thousands on a phone — now make sure it stays protected and performs at its best with these affordable accessories.",
      "1. A quality screen protector. The amFilm Glass Screen Protector costs under KES 1,000 and saves your screen from scratches and cracks. 9H tempered glass with an oleophobic coating keeps your display smooth and fingerprint-free.",
      "2. A durable phone case. The Spigen Tough Armor offers dual-layer shock absorption with a built-in kickstand. At KES 2,499, it's a small price to pay for peace of mind against drops.",
      "3. A fast charging cable. The Anker PowerLine III USB-C Cable is braided for durability and supports fast charging. Say goodbye to frayed cables that stop working after a month.",
      "4. A power bank. The Anker Prime 20,000mAh Power Bank charges multiple devices simultaneously and is airline-friendly. Never worry about your phone dying while you're out and about in Nairobi.",
      "5. A compact charger. The Belkin BoostCharge Pro 65W GaN charger can power your laptop, phone and accessories from a single compact adapter. It's perfect for travel and reduces cable clutter at home.",
    ],
  },
];

export function findBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
