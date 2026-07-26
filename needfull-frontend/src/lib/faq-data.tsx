export interface FaqItem {
  title: string;
  category: string;
  content: React.ReactNode;
}

export const FAQ_CATEGORIES = [
  "General",
  "Posting Tasks",
  "Payments",
  "Trust & Safety",
  "Student Helpers",
  "Businesses",
] as const;

export const ALL_FAQ: FaqItem[] = [
  {
    category: "General",
    title: "What is NeedFull?",
    content: (
      <div className="space-y-2">
        <p>NeedFull is a campus marketplace connecting students who need help with students who want to earn. Post a task, get matched with a verified student on your campus, and pay securely through our escrow system — only when the job is done.</p>
      </div>
    ),
  },
  {
    category: "General",
    title: "How does NeedFull work?",
    content: (
      <div className="space-y-2">
        <p>It&apos;s simple. Sign up with your student email, verify your account, then either post a task or browse available tasks near you. When you find a match, the task budget goes into escrow. Once the runner completes the task and you confirm, payment is released instantly.</p>
      </div>
    ),
  },
  {
    category: "General",
    title: "Who can use NeedFull?",
    content: (
      <div className="space-y-2">
        <p>Any university student can use NeedFull. Whether you need help with a task or want to earn money in your free time, NeedFull is built for students, by people who understand campus life. We are currently live at FUOYE and expanding to more universities.</p>
      </div>
    ),
  },
  {
    category: "Posting Tasks",
    title: "How do I post a task?",
    content: (
      <div className="space-y-2">
        <p>Click &ldquo;Post a Task&rdquo; from the dashboard, describe what you need done, set your budget, and publish. Runners in your area will see your task and can apply. You can review their profiles, trust scores, and reviews before accepting anyone.</p>
      </div>
    ),
  },
  {
    category: "Posting Tasks",
    title: "How much does it cost to post a task?",
    content: (
      <div className="space-y-2">
        <p>Posting a task is completely free. You only fund the wallet when you accept a runner — and that money sits in escrow until the task is completed. NeedFull takes a small service fee only when a task is successfully completed.</p>
      </div>
    ),
  },
  {
    category: "Posting Tasks",
    title: "Can I cancel a posted task?",
    content: (
      <div className="space-y-2">
        <p>Yes, you can cancel a task before you accept any runner. Once you accept a runner and the payment is in escrow, cancellation requires mutual agreement or our dispute process. This protects both parties from wasted effort.</p>
      </div>
    ),
  },
  {
    category: "Payments",
    title: "How are payments handled?",
    content: (
      <div className="space-y-2">
        <p>Payments are handled through our escrow system. When you accept a runner for your task, the task budget moves from your wallet into escrow — a protected holding account. Neither party can access these funds until the task is marked complete and confirmed.</p>
      </div>
    ),
  },
  {
    category: "Payments",
    title: "When is my money released?",
    content: (
      <div className="space-y-2">
        <p>Your money is released from escrow the moment you confirm the task is complete. The runner receives the funds in their wallet instantly. If there&apos;s an issue, you can open a dispute and our team will review both sides.</p>
      </div>
    ),
  },
  {
    category: "Payments",
    title: "Is my payment secure?",
    content: (
      <div className="space-y-2">
        <p>Absolutely. Every payment is protected by our escrow system. The runner does not receive your payment until you confirm the task is done. If something goes wrong, you have the option to dispute and get a refund. Your money is never at risk.</p>
      </div>
    ),
  },
  {
    category: "Trust & Safety",
    title: "How are helpers verified?",
    content: (
      <div className="space-y-2">
        <p>Every user signs up with their student email. Beyond that, runners build their reputation through our trust score system — each completed task adds to their score, and each review contributes to their profile. You can always see a runner&apos;s full history before accepting their application.</p>
      </div>
    ),
  },
  {
    category: "Trust & Safety",
    title: "What happens if something goes wrong?",
    content: (
      <div className="space-y-2">
        <p>We have a dispute resolution process for any issues. If a task isn&apos;t completed as agreed, you can open a dispute from the task page. Our team reviews the evidence from both sides and makes a fair decision. Funds remain locked in escrow throughout the process.</p>
      </div>
    ),
  },
  {
    category: "Trust & Safety",
    title: "How does the Trust Score work?",
    content: (
      <div className="space-y-2">
        <p>Your trust score starts at 50 and increases with every successfully completed task. Positive reviews, on-time delivery, and good communication all boost your score. A higher trust score unlocks better tasks and builds confidence with task posters. Scores below 30 may limit certain features.</p>
      </div>
    ),
  },
  {
    category: "Student Helpers",
    title: "How do I become a helper?",
    content: (
      <div className="space-y-2">
        <p>Sign up and complete your profile with a bio, skills, and photo. Once your trust score reaches 30 (just a few completed tasks), you can enable runner mode and start applying to tasks. Browse the feed, find tasks that match your skills, and submit your application.</p>
      </div>
    ),
  },
  {
    category: "Student Helpers",
    title: "Can I choose which tasks to accept?",
    content: (
      <div className="space-y-2">
        <p>Yes, you have full control. Browse available tasks and only apply to the ones that fit your schedule, skills, and interests. There is no obligation to accept any task. You decide how much or how little you want to work.</p>
      </div>
    ),
  },
  {
    category: "Student Helpers",
    title: "How do I receive payments?",
    content: (
      <div className="space-y-2">
        <p>Payments go directly into your NeedFull wallet as soon as the task poster confirms completion. You can withdraw your earnings to your bank account at any time. There are no minimum withdrawal limits, and funds typically arrive within 24 hours.</p>
      </div>
    ),
  },
  {
    category: "Businesses",
    title: "Can businesses use NeedFull?",
    content: (
      <div className="space-y-2">
        <p>Yes, businesses on or near campus can post tasks too. Whether you need event staff, delivery runners, or research assistance, NeedFull gives you access to verified students ready to work. Business accounts with recurring needs can contact us for custom arrangements.</p>
      </div>
    ),
  },
  {
    category: "Businesses",
    title: "Can I hire students for recurring work?",
    content: (
      <div className="space-y-2">
        <p>Currently, each task is posted individually. We are developing a recurring task feature that will let you hire the same runner for regular work. In the meantime, you can message runners you&apos;ve worked with before and create new tasks for them directly.</p>
      </div>
    ),
  },
];

export const LANDING_FAQ = ALL_FAQ.slice(0, 7);
