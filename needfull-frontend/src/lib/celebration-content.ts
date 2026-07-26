export type CelebrationRole = 'poster' | 'runner';

export type CelebrationAction =
  | 'register'
  | 'task_posted'
  | 'escrow_locked'
  | 'task_completed'
  | 'task_accepted'
  | 'payment_released'
  | 'student_verified'
  | 'runner_approved'
  | 'application_submitted'
  | 'deposit_submitted'
  | 'withdrawal_submitted';

export type CelebrationIcon = 'celebration' | 'success' | 'verified' | 'payment';

export interface CelebrationConfig {
  icon: CelebrationIcon;
  title: string;
  description: string;
  confetti?: boolean;
  primaryLabel?: string;
  primaryHref?: string;
  primaryAction?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
  secondaryAction?: () => void;
}

type ContentMap = Record<CelebrationAction, Partial<Record<CelebrationRole, CelebrationConfig>>>;

const CONTENT: ContentMap = {
  register: {
    poster: {
      icon: 'celebration',
      title: 'Welcome to NeedFull!',
      description:
        "You're now part of a trusted campus community. Post tasks, hire skilled students, and get things done quickly.",
      confetti: true,
      primaryLabel: 'Start Exploring',
      primaryHref: '/feed',
    },
    runner: {
      icon: 'celebration',
      title: 'Welcome to NeedFull!',
      description:
        "You're now part of a trusted campus community. Post tasks, hire skilled students, and get things done quickly.",
      confetti: true,
      primaryLabel: 'Start Exploring',
      primaryHref: '/feed',
    },
  },

  task_posted: {
    poster: {
      icon: 'success',
      title: 'Task Posted Successfully',
      description:
        "Your task is now live and visible to eligible runners. You'll be notified when applications start coming in.",
      primaryLabel: 'View Task',
      secondaryLabel: 'Back to Feed',
      secondaryHref: '/feed',
    },
  },

  escrow_locked: {
    poster: {
      icon: 'payment',
      title: 'Payment Locked in Escrow',
      description:
        'Your payment is securely held in escrow. The runner can only receive it once you confirm the task is complete.',
    },
    runner: {
      icon: 'payment',
      title: 'You Have a Job!',
      description:
        'The poster has accepted your application and locked payment in escrow. Time to get to work!',
      confetti: true,
      primaryLabel: 'View Task',
    },
  },

  task_completed: {
    runner: {
      icon: 'success',
      title: 'Excellent Work!',
      description:
        'You have successfully completed the task. The poster will review and release payment once satisfied.',
      confetti: true,
      primaryLabel: 'Back to My Tasks',
      primaryHref: '/tasks',
    },
    poster: {
      icon: 'success',
      title: 'Task Completed!',
      description:
        'Your runner has marked the task as complete. Review their work and release payment from escrow.',
      primaryLabel: 'Review Task',
      secondaryLabel: 'Back to My Tasks',
      secondaryHref: '/tasks',
    },
  },

  task_accepted: {
    runner: {
      icon: 'celebration',
      title: 'You\'ve Been Selected!',
      description:
        'The poster has accepted your application. The task budget is now locked in escrow. Communicate with the poster to get started.',
      confetti: true,
      primaryLabel: 'View Task',
    },
    poster: {
      icon: 'success',
      title: 'Runner Accepted!',
      description:
        'You have accepted a runner for this task. The budget amount is now locked in escrow and will be released upon completion.',
      primaryLabel: 'View Task',
      secondaryLabel: 'Back to My Tasks',
      secondaryHref: '/tasks',
    },
  },

  payment_released: {
    runner: {
      icon: 'payment',
      title: 'Payment Received!',
      description:
        'The poster has released the payment. Your earnings have been credited to your wallet. Keep building your reputation!',
      confetti: true,
      primaryLabel: 'View Wallet',
      primaryHref: '/wallet',
    },
    poster: {
      icon: 'success',
      title: 'Payment Released',
      description:
        'The payment has been released to the runner. Thanks for using NeedFull — your task is now complete!',
      primaryLabel: 'Back to My Tasks',
      primaryHref: '/tasks',
    },
  },

  student_verified: {
    poster: {
      icon: 'verified',
      title: 'You\'re Now Verified!',
      description:
        'Your student identity has been successfully verified. Your trust score has increased, and you now have greater credibility and access to verification-based opportunities.',
      confetti: true,
      primaryLabel: 'View Profile',
      primaryHref: '/profile',
    },
    runner: {
      icon: 'verified',
      title: 'You\'re Now Verified!',
      description:
        'Your student identity has been successfully verified. Your trust score has increased, and you\'ll enjoy greater credibility with task posters.',
      confetti: true,
      primaryLabel: 'View Profile',
      primaryHref: '/profile',
    },
  },

  runner_approved: {
    runner: {
      icon: 'celebration',
      title: 'Runner Mode Activated!',
      description:
        'You are now an approved Runner. Browse available tasks, submit applications, earn money, and build your trust score within the NeedFull community.',
      confetti: true,
      primaryLabel: 'Browse Tasks',
      primaryHref: '/feed',
    },
  },

  deposit_submitted: {
    poster: {
      icon: 'payment',
      title: 'Transfer Submitted!',
      description: 'Your transfer confirmation has been received. We\'ll credit your wallet within 1–2 hours after verification.',
      primaryLabel: 'Return to Wallet',
      primaryHref: '/wallet',
    },
    runner: {
      icon: 'payment',
      title: 'Transfer Submitted!',
      description: 'Your transfer confirmation has been received. We\'ll credit your wallet within 1–2 hours after verification.',
      primaryLabel: 'Return to Wallet',
      primaryHref: '/wallet',
    },
  },

  withdrawal_submitted: {
    poster: {
      icon: 'success',
      title: 'Withdrawal Requested!',
      description: 'Your withdrawal request has been submitted. Funds will be sent to your bank account within 24 hours.',
      primaryLabel: 'Return to Wallet',
      primaryHref: '/wallet',
    },
    runner: {
      icon: 'success',
      title: 'Withdrawal Requested!',
      description: 'Your withdrawal request has been submitted. Funds will be sent to your bank account within 24 hours.',
      primaryLabel: 'Return to Wallet',
      primaryHref: '/wallet',
    },
  },

  application_submitted: {
    poster: {
      icon: 'success',
      title: 'Application Submitted',
      description:
        "Your application has been submitted successfully. The poster will review it and notify you of their decision.",
    },
    runner: {
      icon: 'success',
      title: 'Application Submitted',
      description:
        "Your application has been submitted successfully. The poster will review it and notify you of their decision.",
      primaryLabel: 'Back to Feed',
      primaryHref: '/feed',
    },
  },
};

export function getDefaultContent(role: CelebrationRole, action: CelebrationAction): CelebrationConfig {
  const content = CONTENT[action]?.[role] ?? CONTENT[action]?.poster;
  if (!content) {
    return {
      icon: 'success',
      title: 'Success!',
      description: 'Action completed successfully.',
      primaryLabel: 'Continue',
    };
  }
  return content;
}

export function inferRole(isRunner: boolean, isPosterForTask?: boolean): CelebrationRole {
  if (isPosterForTask) return 'poster';
  if (isRunner) return 'runner';
  return 'poster';
}
