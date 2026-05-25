import React from "react";

type ButtonProps = {
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ className, children, ...props }: ButtonProps) => {
  return (
    <button
      className={`px-4 py-2 rounded-md bg-black text-white hover:bg-black/90 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};