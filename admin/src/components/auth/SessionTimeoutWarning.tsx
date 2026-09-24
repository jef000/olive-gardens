import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function SessionTimeoutWarning({ remainingMs, onExtend, onLogout }: { remainingMs: number; onExtend: () => void; onLogout: () => void }) {
  const [remaining, setRemaining] = useState(remainingMs);
  useEffect(() => {
    const id = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1000)), 1000);
    return () => window.clearInterval(id);
  }, [remainingMs]);
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="session-timeout-title" className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 id="session-timeout-title" className="text-xl font-semibold">Your session is about to expire</h2>
        <p className="mt-2 text-gray-600">You will be signed out in {Math.ceil(remaining / 1000)} seconds.</p>
        <div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={onLogout}>Log out</Button><Button onClick={onExtend}>Extend session</Button></div>
      </div>
    </div>
  );
}
