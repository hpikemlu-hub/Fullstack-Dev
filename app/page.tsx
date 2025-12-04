'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserSession } from '@/lib/auth-helpers';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const session = getUserSession();
    
    if (session) {
      // Redirect to dashboard if logged in
      router.push('/dashboard');
    } else {
      // Redirect to login if not logged in
      router.push('/auth/login');
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Workload Management System</h1>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}