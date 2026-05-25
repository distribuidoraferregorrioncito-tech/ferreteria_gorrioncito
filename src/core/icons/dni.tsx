type IconProps = {
  className?: string;
};

export const iconDni = ({ className }: IconProps) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Tarjeta DNI */}
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
      stroke="currentColor"
      strokeWidth="1.8"
    />

    {/* Foto */}
    <circle
      cx="8"
      cy="11"
      r="2"
      stroke="currentColor"
      strokeWidth="1.5"
    />

    {/* Líneas de texto */}
    <path
      d="M12 10H17"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />

    <path
      d="M12 13H16"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />

    <path
      d="M7 16H17"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);