type IconProps = {
  className?: string;
};

export const iconHojaPaper = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="3"
      y="3"
      width="14"
      height="18"
      rx="3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />

    <line
      x1="6"
      y1="8"
      x2="14"
      y2="8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    <line
      x1="6"
      y1="11"
      x2="12"
      y2="11"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    <line
      x1="6"
      y1="14"
      x2="10"
      y2="14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    <line
      x1="6"
      y1="17"
      x2="8"
      y2="17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />

    <path
      d="M21.2 4.8C21.6 4.4 21.6 3.8 21.2 3.4C20.8 3 20.2 3 19.8 3.4L11 12.2V15H13.8L22.6 6.2C23 5.8 23 5.2 22.6 4.8L21.2 4.8Z"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />

    <line
      x1="18"
      y1="5.5"
      x2="20.5"
      y2="8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);