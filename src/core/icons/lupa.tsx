type IconProps = {
  className?: string;
};

export const iconLupa = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10.5 3a7.5 7.5 0 105.3 12.8l3.4 3.4a1 1 0 001.4-1.4l-3.4-3.4A7.5 7.5 0 0010.5 3z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);