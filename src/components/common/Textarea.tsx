import React, { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  helperText,
  id,
  className = "",
  rows = 5,
  ...props
}) => {
  const textareaId =
    id ||
    (label
      ? `textarea-${label.toLowerCase().replace(/\s+/g, "-")}`
      : undefined);

  return (
    <div className="input-group">
      {label && <label htmlFor={textareaId}>{label}</label>}
      <textarea
        id={textareaId}
        rows={rows}
        className={`form-textarea ${className}`.trim()}
        {...props}
      />
      {helperText && <span className="helper-text">{helperText}</span>}
    </div>
  );
};
