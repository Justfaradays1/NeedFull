import { Accordion } from '@/components/ui/accordion';

const FAQ_ITEMS = [
  {
    title: 'What is NeedFull?',
    content: (
      <div className="space-y-2">
        <p>NeedFull is a campus marketplace connecting students who need help with students who want to earn. Post a task, get matched with a verified student on your campus, and pay securely through our escrow system — only when the job is done.</p>
      </div>
    ),
  },
  {
    title: 'How does NeedFull work?',
    content: (
      <div className="space-y-2">
        <p>It&apos;s simple. Sign up with your student email, verify your account, then either post a task or browse available tasks near you. When you find a match, the task budget goes into escrow. Once the runner completes the task and you confirm, payment is released instantly.</p>
      </div>
    ),
  },
  {
    title: 'Who can use NeedFull?',
    content: (
      <div className="space-y-2">
        <p>Any university student can use NeedFull. Whether you need help with a task or want to earn money in your free time, NeedFull is built for students, by people who understand campus life. We are currently live at FUOYE and expanding to more universities.</p>
      </div>
    ),
  },
  {
    title: 'How do I post a task?',
    content: (
      <div className="space-y-2">
        <p>Click &ldquo;Post a Task&rdquo; from the dashboard, describe what you need done, set your budget, and publish. Runners in your area will see your task and can apply. You can review their profiles, trust scores, and reviews before accepting anyone.</p>
      </div>
    ),
  },
  {
    title: 'How much does it cost to post a task?',
    content: (
      <div className="space-y-2">
        <p>Posting a task is completely free. You only fund the wallet when you accept a runner — and that money sits in escrow until the task is completed. NeedFull takes a small service fee only when a task is successfully completed.</p>
      </div>
    ),
  },
  {
    title: 'Can I cancel a posted task?',
    content: (
      <div className="space-y-2">
        <p>Yes, you can cancel a task before you accept any runner. Once you accept a runner and the payment is in escrow, cancellation requires mutual agreement or our dispute process. This protects both parties from wasted effort.</p>
      </div>
    ),
  },
  {
    title: 'How are payments handled?',
    content: (
      <div className="space-y-2">
        <p>Payments are handled through our escrow system. When you accept a runner for your task, the task budget moves from your wallet into escrow — a protected holding account. Neither party can access these funds until the task is marked complete and confirmed.</p>
      </div>
    ),
  },
  {
    title: 'When is my money released?',
    content: (
      <div className="space-y-2">
        <p>Your money is released from escrow the moment you confirm the task is complete. The runner receives the funds in their wallet instantly. If there&apos;s an issue, you can open a dispute and our team will review both sides.</p>
      </div>
    ),
  },
  {
    title: 'Is my payment secure?',
    content: (
      <div className="space-y-2">
        <p>Absolutely. Every payment is protected by our escrow system. The runner does not receive your payment until you confirm the task is done. If something goes wrong, you have the option to dispute and get a refund. Your money is never at risk.</p>
      </div>
    ),
  },
  {
    title: 'How are helpers verified?',
    content: (
      <div className="space-y-2">
        <p>Every user signs up with their student email. Beyond that, runners build their reputation through our trust score system — each completed task adds to their score, and each review contributes to their profile. You can always see a runner&apos;s full history before accepting their application.</p>
      </div>
    ),
  },
  {
    title: 'What happens if something goes wrong?',
    content: (
      <div className="space-y-2">
        <p>We have a dispute resolution process for any issues. If a task isn&apos;t completed as agreed, you can open a dispute from the task page. Our team reviews the evidence from both sides and makes a fair decision. Funds remain locked in escrow throughout the process.</p>
      </div>
    ),
  },
  {
    title: 'How does the Trust Score work?',
    content: (
      <div className="space-y-2">
        <p>Your trust score starts at 50 and increases with every successfully completed task. Positive reviews, on-time delivery, and good communication all boost your score. A higher trust score unlocks better tasks and builds confidence with task posters. Scores below 30 may limit certain features.</p>
      </div>
    ),
  },
  {
    title: 'How do I become a helper?',
    content: (
      <div className="space-y-2">
        <p>Sign up and complete your profile with a bio, skills, and photo. Once your trust score reaches 30 (just a few completed tasks), you can enable runner mode and start applying to tasks. Browse the feed, find tasks that match your skills, and submit your application.</p>
      </div>
    ),
  },
  {
    title: 'Can I choose which tasks to accept?',
    content: (
      <div className="space-y-2">
        <p>Yes, you have full control. Browse available tasks and only apply to the ones that fit your schedule, skills, and interests. There is no obligation to accept any task. You decide how much or how little you want to work.</p>
      </div>
    ),
  },
  {
    title: 'How do I receive payments?',
    content: (
      <div className="space-y-2">
        <p>Payments go directly into your NeedFull wallet as soon as the task poster confirms completion. You can withdraw your earnings to your bank account at any time. There are no minimum withdrawal limits, and funds typically arrive within 24 hours.</p>
      </div>
    ),
  },
  {
    title: 'Can businesses use NeedFull?',
    content: (
      <div className="space-y-2">
        <p>Yes, businesses on or near campus can post tasks too. Whether you need event staff, delivery runners, or research assistance, NeedFull gives you access to verified students ready to work. Business accounts with recurring needs can contact us for custom arrangements.</p>
      </div>
    ),
  },
  {
    title: 'Can I hire students for recurring work?',
    content: (
      <div className="space-y-2">
        <p>Currently, each task is posted individually. We are developing a recurring task feature that will let you hire the same runner for regular work. In the meantime, you can message runners you&apos;ve worked with before and create new tasks for them directly.</p>
      </div>
    ),
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="px-4 py-20 sm:px-6 lg:px-8" style={{ backgroundColor: 'var(--color-section-alt)' }}>
      <div className="mx-auto max-w-3xl">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-section-label inline-flex items-center rounded-full bg-brand-light px-3.5 py-1 text-brand">FAQ</span>
          <h2 className="mt-4 font-display text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
            Frequently asked questions
          </h2>
          <p className="text-section-desc mt-3" style={{ color: 'var(--color-muted)' }}>
            Everything you need to know about NeedFull.
          </p>
        </div>

        <div className="mt-12 space-y-10">
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 sm:text-sm">General</h3>
            <Accordion items={FAQ_ITEMS.slice(0, 3)} />
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 sm:text-sm">Posting Tasks</h3>
            <Accordion items={FAQ_ITEMS.slice(3, 6)} />
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 sm:text-sm">Payments</h3>
            <Accordion items={FAQ_ITEMS.slice(6, 9)} />
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 sm:text-sm">Trust &amp; Safety</h3>
            <Accordion items={FAQ_ITEMS.slice(9, 12)} />
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 sm:text-sm">Student Helpers</h3>
            <Accordion items={FAQ_ITEMS.slice(12, 15)} />
          </div>
          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400 sm:text-sm">Businesses</h3>
            <Accordion items={FAQ_ITEMS.slice(15)} />
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="rounded-2xl border border-card-border bg-surface p-8 shadow-card sm:p-10">
            <h3 className="font-display text-lg font-bold text-gray-900 sm:text-xl">Still have questions?</h3>
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              We&apos;re here to help. Reach out and we&apos;ll get back to you within a few hours.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="/chat"
                className="inline-flex items-center gap-2 rounded-[10px] bg-brand px-6 py-3 text-sm font-bold text-white shadow-card transition-all duration-150 hover:bg-brand-mid active:scale-[0.97] sm:text-base"
              >
                Chat with Us
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </a>
              <a
                href="mailto:support@needfull.app"
                className="inline-flex items-center gap-2 rounded-[10px] border px-6 py-3 text-sm font-semibold transition-all duration-150 hover:bg-white/10 active:scale-[0.97] sm:text-base"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
              >
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
