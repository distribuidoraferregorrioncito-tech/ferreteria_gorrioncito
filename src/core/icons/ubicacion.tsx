type IconProps = {
  className?: string;
};

export const iconUbicacion = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 21C12 21 19 15 19 10
      A7 7 0 1 0 5 10
      C5 15 12 21 12 21Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <circle
      cx="12"
      cy="10"
      r="2.5"
      stroke="currentColor"
      strokeWidth="1.8"
    />
  </svg>
);