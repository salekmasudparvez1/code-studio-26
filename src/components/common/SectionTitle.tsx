import React from "react";

interface SectionTitleProps {
  icon?: React.ReactNode;
  title: string;
  badge?: React.ReactNode;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  icon,
  title,
  badge,
}) => {
  return (
    <div className="section-title">
      {icon && <span className="section-title-icon">{icon}</span>}
      <span className="section-title-text">{title}</span>
      {badge && <span className="section-title-badge">{badge}</span>}
    </div>
  );
};
