import React, { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  id,
  className = "",
  ...props
}) => {
  const inputId =
    id ||
    (label ? `input-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div className="input-group">
      {label && <label htmlFor={inputId}>{label}</label>}
      <input
        id={inputId}
        className={`form-input ${className}`.trim()}
        {...props}
      />
      {helperText && <span className="helper-text">{helperText}</span>}
    </div>
  );
};
