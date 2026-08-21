import type { ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';

interface ButtonProps extends ComponentProps<'button'> {
  /**
   * Explicit variant rather than a set of boolean flags. `ghost` and `icon` are
   * intentionally minimal so callers supply colour and size through className.
   */
  variant: ButtonVariant;
}

const BASE =
  'focus-ring inline-flex cursor-pointer items-center justify-center transition-colors disabled:cursor-not-allowed';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'rounded-[10px] bg-primary px-6 py-2.5 font-semibold text-white no-underline hover:bg-primary-hover',
  secondary:
    'rounded-[10px] border border-edge bg-transparent px-6 py-2.5 font-semibold text-muted hover:border-main hover:text-main',
  ghost: 'bg-transparent p-0 font-medium',
  icon: 'shrink-0 bg-transparent',
};

const Button = ({ variant, className, type = 'button', ...rest }: ButtonProps) => (
  <button type={type} className={`${BASE} ${VARIANTS[variant]} ${className ?? ''}`} {...rest} />
);

export default Button;
