import React from "react";
import { Badge } from "../common/Badge";

export const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <img src="/logo.svg" alt="Code Studio" className="brand-logo-img" />
        {/* <div className="header-title-meta">
          <p>Multi‑Cell Animation & Video Studio</p>
        </div> */}
      </div>
      <div className="header-badges">
        <Badge variant="accent">Code Studio</Badge>
        <Badge variant="default">Author: Parvez</Badge>
      </div>
    </header>
  );
};
