import React from "react";
import { Info } from "lucide-react";

export const ExportNotice: React.FC = () => {
  return (
    <div className="note-card">
      <div className="note-header">
        <Info size={14} className="note-icon" />
        <span className="note-title">Recording Tip</span>
      </div>
      <p className="note-text">
        Exports directly as <strong>MP4 (.mp4)</strong> in Chrome and Chromium browsers.
        Auto Export renders every frame at chosen resolution (1080p, 2K, 4K) without preview lag.
      </p>
      <code className="ffmpeg-snippet">
        ffmpeg -i coding-animation.webm -c:v libx264 -crf 20 output.mp4
      </code>
    </div>
  );
};
