type IconProps = {
  className?: string;
};

export const iconTelefono = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6.6 10.8a15.5 15.5 0 006.6 6.6l2.2-2.2a1 1 0 011-.24
      11.7 11.7 0 003.7.6 1 1 0 011 1V20a1 1 0 01-1 1C10.3 21
      3 13.7 3 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.3.2 2.5.6
      3.7a1 1 0 01-.25 1L6.6 10.8z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);