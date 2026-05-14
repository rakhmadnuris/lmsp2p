'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BackButtonHandler() {
  const router = useRouter();

  useEffect(() => {
    // Push a dummy state so the first 'back' action triggers popstate
    window.history.pushState(null, '', window.location.href);

    const handlePopState = () => {
      const confirmSignOut = window.confirm('Apakah Anda yakin ingin keluar dari akun?');
      if (confirmSignOut) {
        router.push('/api/auth/logout');
      } else {
        // Push the state again to trap the next back button press
        window.history.pushState(null, '', window.location.href);
      }
    };

    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [router]);

  return null;
}
