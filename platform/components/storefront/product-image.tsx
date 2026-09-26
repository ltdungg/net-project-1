import { cn } from '@/lib/utils';

export function ProductImage({
  position,
  alt,
  src = '/product-atlas.png',
  backgroundSize = '300% 200%',
  className,
}: {
  position: string;
  alt: string;
  src?: string;
  backgroundSize?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('bg-[#f4eadb] bg-no-repeat', className)}
      style={{
        backgroundImage: `url(${src})`,
        backgroundPosition: position,
        backgroundSize,
      }}
    >
      <span className="sr-only">{alt}</span>
    </div>
  );
}
