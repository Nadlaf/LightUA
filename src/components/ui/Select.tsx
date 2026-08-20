import type { ComponentProps } from 'react';
import { useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<ComponentProps<'select'>, 'children' | 'id'> {
  label: string;
  /** Text for the empty option; also what shows while nothing is chosen. */
  placeholder: string;
  options: readonly SelectOption[];
}

const Select = ({ label, placeholder, options, className, ...rest }: SelectProps) => {
  const id = useId();

  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-2 block text-[0.85rem] text-muted">
        {label}
      </label>

      <div className="relative">
        <select
          id={id}
          className={`w-full cursor-pointer appearance-none rounded-xl border border-edge bg-card px-4 py-3.5 text-base text-main outline-none transition-[border-color,background] duration-200 focus:border-primary disabled:cursor-not-allowed disabled:bg-element disabled:text-muted ${className ?? ''}`}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* A glyph rather than a background-image: it inherits the theme colour,
            which a data-URI SVG stroke cannot. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[0.7rem] text-muted"
        >
          ▼
        </span>
      </div>
    </div>
  );
};

export default Select;
