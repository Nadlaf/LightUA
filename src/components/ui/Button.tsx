import type { ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'icon';

interface ButtonProps extends ComponentProps<'button'> {
  /**
   * Explicit variant rather than a set of boolean flags. `ghost` and `icon` are
   * intentionally minimal so callers supply colour and size through className.
   * `icon` also declares no `transition-colors`: a caller that animates anything
   * on hover brings its own, because a variant class would otherwise beat it.
   */
  variant: ButtonVariant;
}

const BASE =
  'focus-ring inline-flex cursor-pointer items-center justify-center disabled:cursor-not-allowed';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'rounded-[10px] bg-primary px-6 py-2.5 font-semibold text-white transition-colors hover:bg-primary-hover',
  secondary:
    'rounded-[10px] border border-edge px-6 py-2.5 font-semibold text-muted transition-colors hover:border-main hover:text-main',
  ghost: 'p-0 font-medium transition-colors',
  icon: 'shrink-0',
};

const Button = ({ variant, className, type = 'button', ...rest }: ButtonProps) => (
  <button type={type} className={`${BASE} ${VARIANTS[variant]} ${className ?? ''}`} {...rest} />
);

export default Button;
