// WHAT: Post task page — redirect to the full task creation flow
// WHY: Centralises task creation at /tasks/create
// FUTURE: Add inline quick-task form for simple tasks

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PostPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/tasks/create');
  }, [router]);

  return null;
}
