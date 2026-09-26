'use client';

import { useState } from 'react';
import { Heart } from 'lucide-react';

import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FavoriteButton({
  productId,
  label,
  className,
}: {
  productId: string;
  label: string;
  className?: string;
}) {
  const { favoriteIds, toggleFavorite } = useAuth();
  const saved = favoriteIds.includes(productId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function toggle() {
    setBusy(true);
    setError('');
    try {
      await toggleFavorite(productId);
    } catch {
      setError('Không thể cập nhật yêu thích.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className={cn(
          'rounded-full bg-white/88 shadow-sm backdrop-blur',
          className,
        )}
        onClick={() => void toggle()}
        disabled={busy}
        aria-pressed={saved}
        aria-label={`${saved ? 'Bỏ yêu thích' : 'Yêu thích'} ${label}`}
      >
        <Heart className={saved ? 'fill-accent text-accent' : ''} />
      </Button>
      {error ? <span className="sr-only" role="alert">{error}</span> : null}
    </>
  );
}
