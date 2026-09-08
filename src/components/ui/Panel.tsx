import type { ComponentProps } from 'react';

/**
 * The result-panel shell, shared by every state the panel can be in. Declares
 * only what all of them agree on, so nothing here collides with a caller's
 * class: `flex` sets display and callers set flex-direction, spacing, borders.
 */
const PANEL =
  'flex size-full min-h-[600px] items-center justify-center rounded-3xl bg-card shadow-card transition-[background] duration-300';

const Panel = ({ className, ...rest }: ComponentProps<'div'>) => (
  <div className={`${PANEL} ${className ?? ''}`} {...rest} />
);

export default Panel;
