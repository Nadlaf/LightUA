interface GithubIconProps {
  size?: number;
  color?: string;
  className?: string;
}

const GithubIcon = ({ size = 24, color = 'currentColor', className }: GithubIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 2-2.64-.5-5.36-.5-8 0-2-2-3-2-3-2-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.6.6-.9 1.5-1 2.5v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default GithubIcon;
