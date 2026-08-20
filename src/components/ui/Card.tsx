import type { ComponentProps, ReactNode } from 'react';

/** One canonical padding and radius, so panels can no longer disagree. */
const CARD = 'rounded-3xl bg-card p-[30px] text-main shadow-card transition-[background] duration-300';

const CardRoot = ({ className, ...rest }: ComponentProps<'div'>) => (
  <div className={`${CARD} ${className ?? ''}`} {...rest} />
);

const CardHeader = ({ children }: { children: ReactNode }) => (
  <div className="mb-6 flex items-center gap-2.5">{children}</div>
);

const CardTitle = ({ children }: { children: ReactNode }) => (
  <h2 className="text-[1.25rem] font-bold">{children}</h2>
);

const Card = Object.assign(CardRoot, {
  Header: CardHeader,
  Title: CardTitle,
});

export default Card;
