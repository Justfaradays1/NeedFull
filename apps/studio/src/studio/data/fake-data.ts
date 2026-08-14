// WHAT: Fake-but-convincing marketplace data for the Studio films.
// WHY:  The videos must feel alive — recognizably Nigerian campus life with
//       realistic names, Naija-flavored tasks/prices, and believable activity.

import { mulberry32 } from "../motion/prng";

export interface Student {
  id: string;
  name: string;
  initials: string;
  hue: string; // avatar gradient
  role: "seeker" | "runner" | "both";
  school: string;
  department: string;
  trustScore: number;
  tasksDone: number;
  rating: number;
}

const avatarHues = [
  ["#2E8B62", "#1A6B4A"],
  ["#EAA325", "#C9871B"],
  ["#3FA97C", "#24735A"],
  ["#D98A3F", "#B4692A"],
  ["#4E9FB0", "#2E7588"],
  ["#7A5FBF", "#5A4293"],
];

const NAMES = [
  "Amina Bello", "Chidi Nwosu", "Tola Adeyemi", "Fatima Yusuf", "Kelechi Obi",
  "Ngozi Eze", "Segun Ojo", "Zainab Musa", "Emeka Okafor", "Bisi Alabi",
  "Tunde Bakare", "Chioma Okeke", "Ibrahim Suleiman", "Damilola Adegoke", "Kemi Ogunleye",
];

const DEPTS = ["Computer Science", "Mass Comm", "Nursing", "Accounting", "Mechanical Eng", "Law", "Economics", "Biochemistry"];

export const students: Student[] = NAMES.map((name, i) => {
  const rng = mulberry32(i * 977 + 4);
  const parts = name.split(" ");
  const initials = (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  const hue = avatarHues[i % avatarHues.length];
  return {
    id: `u${i}`,
    name,
    initials,
    hue: `linear-gradient(135deg, ${hue[0]}, ${hue[1]})`,
    role: i % 3 === 0 ? "runner" : i % 2 === 0 ? "seeker" : "both",
    school: "Federal University Oye-Ekiti",
    department: DEPTS[i % DEPTS.length],
    trustScore: 62 + Math.floor(rng() * 34),
    tasksDone: 3 + Math.floor(rng() * 40),
    rating: 3.8 + rng() * 1.1,
  };
});

export const avatarOf = (name: string): Student => {
  const s = students.find((st) => st.name === name);
  return s ?? students[0];
};

// WHAT: Avatar component-friendly data — deterministic gradient per student
export const avatarStyle = (name: string) => avatarOf(name).hue;

export interface TaskItem {
  id: string;
  title: string;
  category: string;
  budgetNaira: number;
  location: string;
  urgent: boolean;
  poster: string;
  runner?: string;
  distanceKm?: number;
  postedAgo?: string;
}

export const tasks: TaskItem[] = [
  { id: "t1", title: "Print my assignment — 60 pages", category: "Printing", budgetNaira: 1500, location: "New Lecture Hall", urgent: true, poster: "Amina Bello", distanceKm: 0.4 },
  { id: "t2", title: "Laundry pickup & drop-off", category: "Laundry", budgetNaira: 2500, location: "PG Hostel", urgent: false, poster: "Kelechi Obi", distanceKm: 0.8 },
  { id: "t3", title: "Deliver my charger to the library", category: "Delivery", budgetNaira: 800, location: "Main Library", urgent: true, poster: "Tola Adeyemi", distanceKm: 0.2 },
  { id: "t4", title: "Help move boxes to hostel", category: "Moving", budgetNaira: 4000, location: "Hostel B", urgent: false, poster: "Ngozi Eze", distanceKm: 1.1 },
  { id: "t5", title: "Buy & deliver snacks from Paddy", category: "Errands", budgetNaira: 1200, location: "Faculty of Science", urgent: false, poster: "Segun Ojo", distanceKm: 0.6 },
  { id: "t6", title: "Type up my 15-page project draft", category: "Typing", budgetNaira: 3000, location: "Remote", urgent: false, poster: "Fatima Yusuf", distanceKm: 0 },
];

export interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}

export const chatThread: ChatMessage[] = [
  { id: "m1", from: "them", text: "Hi! I saw your task. I can reach the New Lecture Hall in 10 mins 🏃", time: "2:14 PM" },
  { id: "m2", from: "me", text: "Perfect. It's the red file on the front desk.", time: "2:15 PM" },
  { id: "m3", from: "them", text: "Got it. Should I return the original to you or leave it with the guard?", time: "2:17 PM" },
  { id: "m4", from: "me", text: "Keep it with you — I'll meet you at the gate after class.", time: "2:18 PM" },
  { id: "m5", from: "them", text: "See you then 👍", time: "2:19 PM" },
];

export interface Review {
  id: string;
  from: string;
  task: string;
  text: string;
  stars: number;
  trustDelta: number;
}

export const reviews: Review[] = [
  { id: "r1", from: "Amina Bello", task: "Print my assignment — 60 pages", text: "Fast and reliable. Saved my deadline!", stars: 5, trustDelta: 8 },
  { id: "r2", from: "Tola Adeyemi", task: "Deliver my charger to the library", text: "Delivered in 10 minutes. Legends only.", stars: 5, trustDelta: 9 },
  { id: "r3", from: "Kelechi Obi", task: "Laundry pickup & drop-off", text: "Clean, on time, zero drama.", stars: 4, trustDelta: 6 },
];

export interface WalletActivity {
  id: string;
  label: string;
  amountNaira: number;
  direction: "in" | "out";
  time: string;
  highlight?: boolean;
}

export const walletActivity: WalletActivity[] = [
  { id: "w1", label: "Task payment released", amountNaira: 1500, direction: "in", time: "Now", highlight: true },
  { id: "w2", label: "Escrow secured — printing task", amountNaira: 1500, direction: "out", time: "12:06 PM" },
  { id: "w3", label: "Delivered charger — paid", amountNaira: 800, direction: "in", time: "11:40 AM" },
  { id: "w4", label: "Wallet funded", amountNaira: 5000, direction: "in", time: "9:15 AM" },
];

export interface Notification {
  id: string;
  title: string;
  body: string;
  kind: "task" | "payment" | "chat" | "rating";
  time: string;
}

export const notifications: Notification[] = [
  { id: "n1", title: "New task near you", body: "Print my assignment — 60 pages · ₦1,500", kind: "task", time: "Just now" },
  { id: "n2", title: "Payment released", body: "₦1,500 added to your wallet", kind: "payment", time: "2m ago" },
  { id: "n3", title: "New message", body: "Amina: See you then 👍", kind: "chat", time: "4m ago" },
  { id: "n4", title: "New 5★ review", body: "Amina rated you 5 stars", kind: "rating", time: "6m ago" },
  { id: "n5", title: "Task completed", body: "Deliver my charger — marked done", kind: "task", time: "11m ago" },
];

export const taskCategories = ["Printing", "Laundry", "Delivery", "Errands", "Moving", "Typing"];

export const naira = (n: number, decimals = 0) =>
  "₦" + n.toLocaleString("en-NG", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });