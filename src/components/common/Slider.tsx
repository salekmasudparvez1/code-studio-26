import React, { InputHTMLAttributes } from "react";

interface SliderProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string;
  valueDisplay?: React.ReactNode;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  valueDisplay,
  id,
  className = "",
  ...props
}) => {
  const sliderId =
    id ||
    (label ? `slider-${label.toLowerCase().replace(/\s+/g, "-")}` : undefined);

  return (
    <div className="slider-group">
      {label && <label htmlFor={sliderId}>{label}</label>}
      <div className="slider-control-row">
        <input
          id={sliderId}
          type="range"
          className={`form-slider ${className}`.trim()}
          {...props}
        />
        {valueDisplay !== undefined && (
          <span className="slider-val">{valueDisplay}</span>
        )}
      </div>
    </div>
  );
};
