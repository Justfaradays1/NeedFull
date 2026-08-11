// WHAT: Canonical category definitions — single source of truth for all category metadata
// WHY: Ensures consistent names, icons, and behaviour everywhere across NeedFull

export type TaskMode = "onsite" | "collection_return" | "meetup" | "remote";

export interface CategoryConfig {
  key: string;
  displayName: string;
  /** Compact label for space-constrained surfaces (chips, filters) */
  shortName: string;
  /** Lucide icon NAME — render via <CategoryIcon name={...} /> */
  icon: string;
  /** Category colour CSS variable (see globals.css --nf-cat-*) */
  colorVar: string;
  description: string;
  /** Search synonyms — typed queries that should surface this category */
  keywords: string[];
  /** Budget config */
  budget: {
    min: number;
    max: number;
    step: number;
    suggestions: number[];
    fairRange: { min: number; max: number };
    excellentRange: { min: number; max: number };
  };
  /** Whether this task needs both task + completion locations */
  needsDualLocation: boolean;
  /** Which task modes are available */
  allowedModes: TaskMode[];
  /** Default task mode */
  defaultMode: TaskMode;
  /** Suggestion chips for the description field */
  suggestionChips: string[];
  /** Example title placeholder */
  titlePlaceholder: string;
  /** Description placeholder */
  descriptionPlaceholder: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  laundry: {
    key: "laundry",
    displayName: "Laundry & Washing",
    shortName: "Laundry",
    icon: "Shirt",
    colorVar: "var(--nf-cat-laundry)",
    description: "Wash, dry, iron and care for clothes.",
    keywords: ["laundry", "wash", "washing", "iron", "fold", "dry", "clothes"],
    budget: { min: 200, max: 5000, step: 100, suggestions: [500, 800, 1200], fairRange: { min: 500, max: 999 }, excellentRange: { min: 1000, max: 5000 } },
    needsDualLocation: true,
    allowedModes: ["onsite", "collection_return"],
    defaultMode: "collection_return",
    suggestionChips: ["Wash before evening", "Iron after washing", "Detergent provided", "Return same day", "Delicate fabrics only", "Separate whites and colours"],
    titlePlaceholder: "Wash 3 bags of clothes",
    descriptionPlaceholder: "Describe what needs washing — type of clothes, quantity, any special care instructions, and preferred pickup/delivery time.",
  },
  delivery: {
    key: "delivery",
    displayName: "Delivery & Pickup",
    shortName: "Delivery",
    icon: "Truck",
    colorVar: "var(--nf-cat-delivery)",
    description: "Deliver packages, documents and items.",
    keywords: ["delivery", "deliver", "pickup", "package", "parcel", "document", "courier", "dispatch"],
    budget: { min: 300, max: 8000, step: 100, suggestions: [500, 1000, 2000], fairRange: { min: 800, max: 1499 }, excellentRange: { min: 1500, max: 8000 } },
    needsDualLocation: true,
    allowedModes: ["onsite", "collection_return"],
    defaultMode: "collection_return",
    suggestionChips: ["Deliver to lecture hall", "Pick up from hostel", "Urgent — within 2 hours", "Handle with care", "Call on arrival", "Text when picked up"],
    titlePlaceholder: "Deliver a package from hostel A to faculty",
    descriptionPlaceholder: "Describe what needs to be delivered, pickup location, drop-off location, preferred time, and any special handling instructions.",
  },
  cleaning: {
    key: "cleaning",
    displayName: "Home Cleaning",
    shortName: "Home Cleaning",
    icon: "Home",
    colorVar: "var(--nf-cat-cleaning)",
    description: "Clean rooms, homes and other spaces.",
    keywords: ["cleaning", "clean", "room", "house", "apartment", "tidy", "sweep", "mop"],
    budget: { min: 500, max: 15000, step: 100, suggestions: [1000, 2000, 3500], fairRange: { min: 1500, max: 2999 }, excellentRange: { min: 3000, max: 15000 } },
    needsDualLocation: false,
    allowedModes: ["onsite", "collection_return"],
    defaultMode: "onsite",
    suggestionChips: ["Cleaning materials available", "Deep cleaning", "Standard cleaning", "Bathroom focus", "Kitchen focus", "Sweep and mop only"],
    titlePlaceholder: "Clean my room in Gold Hostel",
    descriptionPlaceholder: "Describe what needs to be cleaned — room size, areas to focus on, whether cleaning materials are provided, and preferred time.",
  },
  printing: {
    key: "printing",
    displayName: "Printing & Documents",
    shortName: "Printing",
    icon: "Printer",
    colorVar: "var(--nf-cat-printing)",
    description: "Print, scan, photocopy and bind documents.",
    keywords: ["printing", "print", "scan", "scanner", "photocopy", "bind", "binding", "copy", "document"],
    budget: { min: 100, max: 3000, step: 50, suggestions: [300, 700, 1500], fairRange: { min: 500, max: 999 }, excellentRange: { min: 1000, max: 3000 } },
    needsDualLocation: true,
    allowedModes: ["onsite", "collection_return"],
    defaultMode: "collection_return",
    suggestionChips: ["Print in colour", "Spiral bind", "A4 paper", "Deliver to lecture hall", "Print both sides", "High quality"],
    titlePlaceholder: "Print 30 pages of my assignment",
    descriptionPlaceholder: "Describe what needs to be printed — number of pages, colour or B&W, binding required, paper size, and delivery location.",
  },
  food: {
    key: "food",
    displayName: "Food & Grocery",
    shortName: "Food & Grocery",
    icon: "ShoppingBasket",
    colorVar: "var(--nf-cat-food)",
    description: "Get food and groceries delivered.",
    keywords: ["food", "grocery", "groceries", "snacks", "meal", "buy food", "pick up"],
    budget: { min: 300, max: 5000, step: 100, suggestions: [500, 1000, 2000], fairRange: { min: 800, max: 1499 }, excellentRange: { min: 1500, max: 5000 } },
    needsDualLocation: true,
    allowedModes: ["onsite", "collection_return"],
    defaultMode: "collection_return",
    suggestionChips: ["Buy from specific vendor", "Keep receipts", "No onions please", "Call before ordering", "Deliver to hostel", "Cash on delivery"],
    titlePlaceholder: "Buy jollof rice from Mama's Kitchen",
    descriptionPlaceholder: "Describe what food to buy, from where, any dietary restrictions, and where to deliver it.",
  },
  shopping: {
    key: "shopping",
    displayName: "Shopping & Errands",
    shortName: "Shopping",
    icon: "ShoppingCart",
    colorVar: "var(--nf-cat-shopping)",
    description: "Get someone to shop or run errands.",
    keywords: ["shopping", "buy", "purchase", "errand", "errands", "supplies", "supermarket", "toiletries"],
    budget: { min: 300, max: 10000, step: 100, suggestions: [800, 1500, 2500], fairRange: { min: 1000, max: 1999 }, excellentRange: { min: 2000, max: 10000 } },
    needsDualLocation: true,
    allowedModes: ["onsite", "collection_return"],
    defaultMode: "collection_return",
    suggestionChips: ["Buy exact items", "Keep receipts", "Budget flexible", "Compare prices", "Text before buying", "Get cheapest option"],
    titlePlaceholder: "Buy toiletries from the supermarket",
    descriptionPlaceholder: "List the items to buy, preferred store, spending limit, and delivery location. Ask the runner to keep receipts.",
  },
    techsupport: {
    key: "techsupport",
    displayName: "Tech Support",
    shortName: "Tech Support",
    icon: "Laptop",
    colorVar: "var(--nf-cat-techsupport)",
    description: "Get help with devices, software and technology.",
    keywords: ["tech", "technology", "computer", "laptop", "phone", "software", "devices", "internet", "virus"],
    budget: { min: 500, max: 15000, step: 100, suggestions: [2000, 5000, 10000], fairRange: { min: 3000, max: 7999 }, excellentRange: { min: 8000, max: 15000 } },
    needsDualLocation: false,
    allowedModes: ["onsite", "remote"],
    defaultMode: "onsite",
    suggestionChips: ["Bring your own tools", "Software installation", "Hardware repair", "Virus removal", "Laptop screen repair", "Data backup"],
    titlePlaceholder: "Fix my laptop screen",
    descriptionPlaceholder: "Describe the issue, device model, what you've tried, and whether you need on-site or remote help.",
  },
  design: {
    key: "design",
    displayName: "Design & Creative",
    shortName: "Design",
    icon: "Palette",
    colorVar: "var(--nf-cat-design)",
    description: "Logos, graphics, posters and creative work.",
    keywords: ["design", "graphic", "flyer", "logo", "banner", "creative", "poster", "canva"],
    budget: { min: 500, max: 15000, step: 100, suggestions: [2000, 5000, 10000], fairRange: { min: 3000, max: 7999 }, excellentRange: { min: 8000, max: 15000 } },
    needsDualLocation: false,
    allowedModes: ["remote"],
    defaultMode: "remote",
    suggestionChips: ["Need source files", "Canva or Photoshop", "Brand colours provided", "Multiple revisions", "Print-ready format", "Social media sizes"],
    titlePlaceholder: "Design a flyer for my birthday party",
    descriptionPlaceholder: "Describe the design needed, size/dimensions, colours, text to include, deadline, and preferred format.",
  },
  photography: {
    key: "photography",
    displayName: "Photography",
    shortName: "Photography",
    icon: "Camera",
    colorVar: "var(--nf-cat-photography)",
    description: "Event photography, portraits, product photos.",
    keywords: ["photography", "photo", "pictures", "event", "portrait", "camera", "shoot"],
    budget: { min: 500, max: 15000, step: 100, suggestions: [3000, 7000, 12000], fairRange: { min: 3000, max: 7999 }, excellentRange: { min: 8000, max: 15000 } },
    needsDualLocation: false,
    allowedModes: ["onsite", "remote"],
    defaultMode: "onsite",
    suggestionChips: ["Edited photos", "Raw files included", "Event coverage", "Passport photos", "Product photos", "Same-day delivery"],
    titlePlaceholder: "Take photos at my department's event",
    descriptionPlaceholder: "Describe the photography needed — event type, duration, number of photos, editing requirements, and delivery format.",
  },
  repairs: {
    key: "repairs",
    displayName: "Repairs & Maintenance",
    shortName: "Repairs",
    icon: "Wrench",
    colorVar: "var(--nf-cat-repairs)",
    description: "Fix appliances, furniture, plumbing, electrical.",
    keywords: ["repair", "repairs", "maintenance", "fix", "appliance", "plumbing", "electrical", "handyman"],
    budget: { min: 500, max: 15000, step: 100, suggestions: [2000, 5000, 10000], fairRange: { min: 2000, max: 4999 }, excellentRange: { min: 5000, max: 15000 } },
    needsDualLocation: false,
    allowedModes: ["onsite", "collection_return"],
    defaultMode: "onsite",
    suggestionChips: ["Bring your own tools", "Spare parts needed", "Urgent repair", "Small fix", "Electrical work", "Plumbing"],
    titlePlaceholder: "Fix my reading desk",
    descriptionPlaceholder: "Describe what needs to be repaired, the issue, any tools or parts needed, and preferred time.",
  },
  moving: {
    key: "moving",
    displayName: "Furniture & Item Moving",
    shortName: "Item Moving",
    icon: "Package",
    colorVar: "var(--nf-cat-moving)",
    description: "Move belongings, furniture and other items.",
    keywords: ["moving", "move", "relocation", "relocate", "luggage", "furniture", "boxes", "carry"],
    budget: { min: 500, max: 15000, step: 100, suggestions: [2000, 5000, 10000], fairRange: { min: 2000, max: 4999 }, excellentRange: { min: 5000, max: 15000 } },
    needsDualLocation: true,
    allowedModes: ["onsite", "collection_return"],
    defaultMode: "collection_return",
    suggestionChips: ["Heavy items", "Fragile items", "Need vehicle", "Ground floor", "Stairs involved", "Help packing"],
    titlePlaceholder: "Help move boxes from my hostel",
    descriptionPlaceholder: "Describe what needs to be moved, from where to where, how many items, whether a vehicle is needed, and any special handling.",
  },
  academic: {
    key: "academic",
    displayName: "Tutoring & Academic",
    shortName: "Tutoring",
    icon: "GraduationCap",
    colorVar: "var(--nf-cat-academic)",
    description: "Tutoring, assignments and study assistance.",
    keywords: ["academic", "assignment", "tutor", "tutoring", "research", "study", "proofread", "writing", "homework"],
    budget: { min: 500, max: 10000, step: 100, suggestions: [1000, 2500, 5000], fairRange: { min: 1500, max: 2999 }, excellentRange: { min: 3000, max: 10000 } },
    needsDualLocation: false,
    allowedModes: ["remote", "meetup"],
    defaultMode: "remote",
    suggestionChips: ["Need citations", "Plagiarism check", "Proofread only", "Urgent deadline", "Specific format", "Online tutoring"],
    titlePlaceholder: "Help with my economics research paper",
    descriptionPlaceholder: "Describe the academic help needed — subject, topic, type of help (research, writing, tutoring), deadline, and level.",
  },
  other: {
    key: "other",
    displayName: "Other / Custom",
    shortName: "Other",
    icon: "Sparkles",
    colorVar: "var(--nf-cat-other)",
    description: "Something else? Create a task that doesn't fit a category.",
    keywords: ["other", "custom", "misc", "anything", "everything", "general"],
    budget: { min: 200, max: 10000, step: 100, suggestions: [500, 1500, 3000], fairRange: { min: 1000, max: 2999 }, excellentRange: { min: 3000, max: 10000 } },
    needsDualLocation: false,
    allowedModes: ["onsite", "collection_return", "meetup", "remote"],
    defaultMode: "onsite",
    suggestionChips: ["Be specific", "Include deadline", "Mention tools/materials", "Set expectations"],
    titlePlaceholder: "Describe your task",
    descriptionPlaceholder: "Describe exactly what you need help with — be as specific as possible so NeedRunners understand what to expect.",
  },
};

// WHAT: Map API category names to config keys
// WHY: DB category names may differ from our canonical keys — include both
//      legacy DB values and the current canonical names for forward compat
const API_NAME_TO_KEY: Record<string, string> = {
  "Laundry": "laundry",
  "Laundry & Washing": "laundry",
  "Delivery": "delivery",
  "Delivery & Errands": "delivery",
  "Delivery & Pickup": "delivery",
  "Cleaning": "cleaning",
  "Home & Room Cleaning": "cleaning",
  "Home Cleaning": "cleaning",
  "Printing": "printing",
  "Printing & Binding": "printing",
  "Printing & Documents": "printing",
  "Food": "food",
  "Food Delivery": "food",
  "Food Runs": "food",
  "Food & Grocery Run": "food",
  "Food & Grocery": "food",
  "Food & Grocery Runs": "food",
  "Shopping": "shopping",
  "Shopping & Errands": "shopping",
  "Tech": "techsupport",
  "Tech Support": "techsupport",
  "Tech Help": "techsupport",
  "Tech Help & Support": "techsupport",
  "Design": "design",
  "Graphic Design": "design",
  "Design & Creative": "design",
  "Photography": "photography",
  "Repairs": "repairs",
  "Repairs & Maintenance": "repairs",
  "Moving": "moving",
  "Moving Help": "moving",
  "Item Moving": "moving",
  "Item Moving & Relocation": "moving",
  "Item & Furniture Moving": "moving",
  "Furniture & Item Moving": "moving",
  "Assignment": "academic",
  "Assignment Help": "academic",
  "Academic": "academic",
  "Academic Assistance": "academic",
  "Academic Help": "academic",
  "Tutoring": "academic",
  "Tutoring & Academic": "academic",
  "Academic Help & Tutoring": "academic",
  "Handyman": "repairs",
  "Event": "other",
  "Other": "other",
  "Other / Custom": "other",
};

export function getCategoryConfig(nameOrKey: string): CategoryConfig {
  const key = API_NAME_TO_KEY[nameOrKey] ?? nameOrKey.toLowerCase().replace(/[\s&]+/g, "");
  return CATEGORY_CONFIGS[key] ?? CATEGORY_CONFIGS.other;
}

export function getCategoryDisplayName(dbName: string): string {
  const config = getCategoryConfig(dbName);
  return config.displayName;
}

export function getCategoryShortName(dbName: string): string {
  const config = getCategoryConfig(dbName);
  return config.shortName;
}

export function getCategoryIcon(dbName: string): string {
  const config = getCategoryConfig(dbName);
  return config.icon;
}

// WHAT: Category colour CSS variable for a category name/key
// WHY: One colour per category, defined once in globals.css (--nf-cat-*),
//      reused with inline styles so every surface stays in sync
export function getCategoryColor(dbName: string): string {
  const config = getCategoryConfig(dbName);
  return config.colorVar;
}

export function getCategoryConfigs(): CategoryConfig[] {
  return Object.values(CATEGORY_CONFIGS);
}

// WHAT: Search categories by query text
// WHY: Match against display name, short name, description, and keywords so
//      "move", "furniture", "photocopy" or "iron clothes" all resolve correctly
export function searchCategoryConfigs(query: string): CategoryConfig[] {
  const q = query.trim().toLowerCase();
  if (!q) return getCategoryConfigs();
  return getCategoryConfigs().filter(
    (c) =>
      c.displayName.toLowerCase().includes(q) ||
      c.shortName.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.toLowerCase().includes(q)),
  );
}

// WHAT: Get recent categories from localStorage
// WHY: Show frequently used categories for repeat users
export function getRecentlyUsedCategories(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("nf_recent_categories");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function addRecentlyUsedCategory(categoryName: string): void {
  if (typeof window === "undefined") return;
  try {
    const recent = getRecentlyUsedCategories().filter((c) => c !== categoryName);
    recent.unshift(categoryName);
    localStorage.setItem("nf_recent_categories", JSON.stringify(recent.slice(0, 5)));
  } catch { /* ignore */ }
}
