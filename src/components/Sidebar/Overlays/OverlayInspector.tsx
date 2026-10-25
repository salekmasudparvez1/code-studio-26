import React from 'react';
import { PenLine } from 'lucide-react';
import { Overlay, OverlayPatch, OVERLAY_FONTS } from '../../../types/overlay';
import { SectionTitle } from '../../common/SectionTitle';
import { Card } from '../../common/Card';
import { Input } from '../../common/Input';
import { Textarea } from '../../common/Textarea';
import { Select } from '../../common/Select';
import { Slider } from '../../common/Slider';

interface OverlayInspectorProps {
  overlay: Overlay | null;
  totalDuration: number;
  onChange: (id: string, updates: OverlayPatch) => void;
}

export const OverlayInspector: React.FC<OverlayInspectorProps> = ({
  overlay,
  totalDuration,
  onChange,
}) => {
  return (
    <div className="sidebar-section">
      <SectionTitle icon={<PenLine size={14} />} title="Overlay Settings" />
      <Card>
        {!overlay ? (
          <div className="empty-state">Select an overlay to edit font, color, and timing.</div>
        ) : (
          <div className="inspector-fields">
            <Input
              label="Name"
              value={overlay.name}
              onChange={(event) => onChange(overlay.id, { name: event.target.value })}
            />

            <div className="flex-row">
              <Input
                label="Start (sec)"
                type="number"
                min={0}
                max={totalDuration}
                step={0.1}
                value={Number(overlay.startTime.toFixed(2))}
                onChange={(event) =>
                  onChange(overlay.id, {
                    startTime: Math.max(0, Number(event.target.value) || 0),
                  })
                }
              />
              <Input
                label="End (sec)"
                type="number"
                min={0}
                max={Math.max(totalDuration, overlay.startTime + 0.2)}
                step={0.1}
                value={Number(overlay.endTime.toFixed(2))}
                onChange={(event) =>
                  onChange(overlay.id, {
                    endTime: Math.max(
                      overlay.startTime + 0.2,
                      Number(event.target.value) || overlay.startTime + 0.2
                    ),
                  })
                }
              />
            </div>

            <Slider
              label="Opacity"
              min={0.1}
              max={1}
              step={0.05}
              value={overlay.opacity}
              onChange={(event) => onChange(overlay.id, { opacity: Number(event.target.value) })}
              valueDisplay={<span>{Math.round(overlay.opacity * 100)}%</span>}
            />

            {(overlay.kind === 'text' ||
              overlay.kind === 'arrow' ||
              overlay.kind === 'ellipse' ||
              overlay.kind === 'rect') && (
              <div className="flex-row">
                <Input
                  label="X"
                  type="number"
                  value={Math.round(overlay.x)}
                  onChange={(event) =>
                    onChange(overlay.id, { x: Number(event.target.value) || 0 })
                  }
                />
                <Input
                  label="Y"
                  type="number"
                  value={Math.round(overlay.y)}
                  onChange={(event) =>
                    onChange(overlay.id, { y: Number(event.target.value) || 0 })
                  }
                />
              </div>
            )}

            {overlay.kind === 'text' && (
              <>
                <Textarea
                  label="Text"
                  rows={3}
                  value={overlay.text}
                  onChange={(event) => onChange(overlay.id, { text: event.target.value })}
                />
                <Select
                  label="Font"
                  value={overlay.fontFamily}
                  onChange={(event) => onChange(overlay.id, { fontFamily: event.target.value })}
                  options={OVERLAY_FONTS}
                />
                <div className="flex-row">
                  <Input
                    label="Size"
                    type="number"
                    min={12}
                    max={160}
                    value={overlay.fontSize}
                    onChange={(event) =>
                      onChange(overlay.id, { fontSize: Math.max(12, Number(event.target.value) || 42) })
                    }
                  />
                  <Input
                    label="Color"
                    type="color"
                    value={overlay.color.startsWith('#') ? overlay.color : '#ffffff'}
                    onChange={(event) => onChange(overlay.id, { color: event.target.value })}
                  />
                </div>
                <Input
                  label="Background"
                  type="color"
                  value={
                    overlay.background && overlay.background.startsWith('#')
                      ? overlay.background
                      : '#0f172a'
                  }
                  onChange={(event) => onChange(overlay.id, { background: event.target.value })}
                />
                <label className="overlay-clear-bg">
                  <input
                    type="checkbox"
                    checked={!overlay.background}
                    onChange={(event) =>
                      onChange(overlay.id, {
                        background: event.target.checked ? null : '#0f172a',
                      })
                    }
                  />
                  Transparent background
                </label>
              </>
            )}

            {(overlay.kind === 'path' ||
              overlay.kind === 'highlight' ||
              overlay.kind === 'arrow' ||
              overlay.kind === 'ellipse' ||
              overlay.kind === 'rect') && (
              <div className="flex-row">
                <Input
                  label="Stroke"
                  type="color"
                  value={overlay.stroke.startsWith('#') ? overlay.stroke : '#facc15'}
                  onChange={(event) => onChange(overlay.id, { stroke: event.target.value })}
                />
                <Input
                  label="Width"
                  type="number"
                  min={1}
                  max={80}
                  value={overlay.strokeWidth}
                  onChange={(event) =>
                    onChange(overlay.id, { strokeWidth: Math.max(1, Number(event.target.value) || 6) })
                  }
                />
              </div>
            )}

            {(overlay.kind === 'ellipse' || overlay.kind === 'rect') && (
              <>
                <Input
                  label="Fill"
                  type="color"
                  value={overlay.fill && overlay.fill.startsWith('#') ? overlay.fill : '#facc15'}
                  onChange={(event) => onChange(overlay.id, { fill: event.target.value })}
                />
                <label className="overlay-clear-bg">
                  <input
                    type="checkbox"
                    checked={!overlay.fill}
                    onChange={(event) =>
                      onChange(overlay.id, { fill: event.target.checked ? null : '#facc15' })
                    }
                  />
                  No fill
                </label>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
