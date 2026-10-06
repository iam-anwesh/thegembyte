/*
 * Product catalogue.
 *
 * type: "affiliate" → the Buy button links out to `affiliateUrl` (merchant site)
 * type: "store"     → the product is sold directly and goes into the cart
 *
 * Prices are in Australian dollars (see currency in config.js). Affiliate prices,
 * ratings and review counts mirror the linked amazon.com.au listing; re-check
 * them regularly, since Amazon changes prices often.
 * brand: the manufacturer, used in search-engine product data.
 *
 * image: path or URL. Leave empty to show an automatic illustrated placeholder.
 *        Photos in assets/img/products/ are from Unsplash; credits are on about.html.
 * Replace the example affiliate URLs with your own tracked links.
 */
window.CATEGORIES = [
  { id: "tech", name: "Tech & Gadgets", icon: "⌁", blurb: "Smart picks that earn their place on your desk." },
  { id: "home", name: "Home & Living", icon: "⌂", blurb: "Small upgrades that make a home feel finished." },
  { id: "style", name: "Style & Jewellery", icon: "◇", blurb: "Timeless accessories and everyday gems." },
  { id: "wellness", name: "Wellness", icon: "✿", blurb: "Thoughtful tools for rest and routine." },
  { id: "books", name: "Books & Learning", icon: "❏", blurb: "Reads and kits that leave you sharper." }
];

window.PRODUCTS = [
  {
    id: "wireless-earbuds-pro",
    name: "soundcore Liberty 4 NC Wireless Earbuds",
    brand: "soundcore",
    category: "tech",
    type: "affiliate",
    merchant: "Amazon",
    affiliateUrl: "https://www.amazon.com.au/dp/B0BZV4QFP8",
    price: 119.99,
    compareAt: 169,
    rating: 4.3,
    reviews: 27513,
    badges: ["Editor's pick"],
    featured: true,
    image: "assets/img/products/wireless-earbuds-pro.jpg",
    summary: "Adaptive noise cancelling that tunes itself to your ears and surroundings, with up to 50 hours of playback including the case.",
    highlights: ["Up to 98.5% noise reduction", "50 h total playback", "Hi-Res audio with LDAC", "Wireless charging case"]
  },
  {
    id: "mechanical-keyboard-75",
    name: "Keychron K2v2 Hot-Swappable Mechanical Keyboard",
    brand: "Keychron",
    category: "tech",
    type: "affiliate",
    merchant: "Amazon",
    affiliateUrl: "https://www.amazon.com.au/dp/B08746ZJZ6",
    price: 149,
    compareAt: 0,
    rating: 4.1,
    reviews: 104,
    badges: ["Best value"],
    featured: true,
    image: "assets/img/products/mechanical-keyboard-75.jpg",
    summary: "A compact 75% layout with hot-swappable switches that works over Bluetooth or a USB-C cable.",
    highlights: ["Hot-swappable Gateron G Pro Red switches", "Bluetooth 5.1 + USB-C wired", "84 keys, aluminium frame", "Mac & Windows layouts"]
  },
  {
    id: "smart-led-bulb-4pack",
    name: "FRESHIN B22 Smart LED Bulb (4-pack)",
    brand: "FRESHIN",
    category: "home",
    type: "affiliate",
    merchant: "Amazon",
    affiliateUrl: "https://www.amazon.com.au/dp/B09MVJC1KP",
    price: 49.99,
    compareAt: 0,
    rating: 4.3,
    reviews: 321,
    badges: [],
    featured: false,
    image: "assets/img/products/smart-led-bulb-4pack.jpg",
    summary: "Bayonet-fit colour bulbs with schedules and voice control, connecting straight to your Wi-Fi without a hub.",
    highlights: ["B22 bayonet fitting", "Works with Alexa & Google", "No hub required (2.4 GHz Wi-Fi)", "9 W, 60 W equivalent"]
  },
  {
    id: "linen-throw-blanket",
    name: "Stonewashed Linen Throw",
    category: "home",
    type: "store",
    sku: "TGB-HOME-001",
    stock: 24,
    price: 37,
    compareAt: 0,
    rating: 4.8,
    reviews: 86,
    badges: ["TheGemByte original"],
    featured: true,
    image: "assets/img/products/linen-throw-blanket.jpg",
    summary: "Breathable European flax linen that softens with every wash.",
    highlights: ["100% European flax", "130 × 170 cm", "Pre-washed for softness", "Ships in 2–4 days"]
  },
  {
    id: "sterling-silver-solitaire",
    name: "Sterling Silver Solitaire Pendant",
    category: "style",
    type: "store",
    sku: "TGB-STY-014",
    stock: 12,
    price: 49,
    compareAt: 59,
    rating: 4.9,
    reviews: 142,
    badges: ["TheGemByte original", "Gift ready"],
    featured: true,
    image: "assets/img/products/sterling-silver-solitaire.jpg",
    summary: "A single brilliant-cut stone on a fine 18-inch 925 silver chain.",
    highlights: ["925 sterling silver", "6 mm brilliant-cut CZ", "Hypoallergenic", "Arrives gift-boxed"]
  },
  {
    id: "minimal-leather-watch",
    name: "Timex Easy Reader 38mm Leather Strap Watch",
    brand: "Timex",
    category: "style",
    type: "affiliate",
    merchant: "Amazon",
    affiliateUrl: "https://www.amazon.com.au/dp/B074Y23XBN",
    price: 134.88,
    compareAt: 0,
    rating: 4.6,
    reviews: 9441,
    badges: [],
    featured: false,
    image: "assets/img/products/minimal-leather-watch.jpg",
    summary: "A classic 38 mm dial with full Arabic numerals, a date window and Timex's Indiglo night-light.",
    highlights: ["38 mm brass case", "Indiglo light-up dial", "30 m water resistance", "20 mm genuine leather strap"]
  },
  {
    id: "sunrise-alarm-lamp",
    name: "Vnoeom Sunrise Alarm Clock with FM Radio",
    brand: "Vnoeom",
    category: "wellness",
    type: "affiliate",
    merchant: "Amazon",
    affiliateUrl: "https://www.amazon.com.au/dp/B0CL6NNMTF",
    price: 59.99,
    compareAt: 71.60,
    rating: 4.7,
    reviews: 53,
    badges: ["Trending"],
    featured: true,
    image: "assets/img/products/sunrise-alarm-lamp.jpg",
    summary: "Brightens gradually before your alarm, so you wake up to light instead of a buzzer.",
    highlights: ["10–60 min sunrise simulation", "7 natural sounds + FM radio", "Dual alarms with snooze", "20 brightness levels, 11 colours"]
  },
  {
    id: "acupressure-mat-set",
    name: "XiaoMaGe Acupressure Mat & Pillow Set (120 cm)",
    brand: "XiaoMaGe",
    category: "wellness",
    type: "affiliate",
    merchant: "Amazon",
    affiliateUrl: "https://www.amazon.com.au/dp/B08P4M37G9",
    price: 58.99,
    compareAt: 0,
    rating: 4.3,
    reviews: 223,
    badges: [],
    featured: false,
    image: "assets/img/products/acupressure-mat-set.jpg",
    summary: "A full-length spike mat and neck pillow to ease back and shoulder tension after long desk hours.",
    highlights: ["120 × 42 cm mat + neck pillow", "12,474 + 1,782 pressure points", "100% cotton cover", "Carry bags included"]
  },
  {
    id: "atomic-habits",
    name: "Atomic Habits by James Clear (Paperback)",
    brand: "Random House Business",
    category: "books",
    type: "affiliate",
    merchant: "Amazon",
    affiliateUrl: "https://www.amazon.com.au/dp/1847941834",
    price: 21.49,
    compareAt: 35,
    rating: 4.6,
    reviews: 191582,
    badges: ["Bestseller"],
    featured: false,
    image: "assets/img/products/atomic-habits.jpg",
    summary: "The practical guide to building good habits and breaking bad ones.",
    highlights: ["Paperback, 320 pages", "Practical frameworks", "Great gift", "Bestseller worldwide"]
  },
  {
    id: "gem-journal",
    name: "The Gem Journal – Dot Grid Notebook",
    category: "books",
    type: "store",
    sku: "TGB-BK-002",
    stock: 0,
    price: 10,
    compareAt: 0,
    rating: 4.7,
    reviews: 58,
    badges: ["TheGemByte original"],
    featured: false,
    image: "assets/img/products/gem-journal.jpg",
    summary: "A5 lay-flat notebook on 120 gsm paper that doesn't ghost.",
    highlights: ["A5, 192 pages", "120 gsm ivory paper", "Lay-flat binding", "Two ribbon markers"]
  }
];
