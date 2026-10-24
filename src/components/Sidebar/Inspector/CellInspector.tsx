import React from 'react';
import { Settings } from 'lucide-react';
import { Cell, CodeCell, GraphCell, DelayCell } from '../../../types/cell';
import { SectionTitle } from '../../common/SectionTitle';
import { Card } from '../../common/Card';
import { CodeInspector } from './CodeInspector';
import { GraphInspector } from './GraphInspector';
import { DelayInspector } from './DelayInspector';

interface CellInspectorProps {
  activeCell: Cell | null;
  onUpdateCell: (id: string, updates: Partial<Cell>) => void;
}

export const CellInspector: React.FC<CellInspectorProps> = ({
  activeCell,
  onUpdateCell,
}) => {
  return (
    <div className="sidebar-section">
      <SectionTitle icon={<Settings size={14} />} title="Cell Settings" />

      <Card>
        {!activeCell ? (
          <div className="empty-state">Select a cell to edit</div>
        ) : (
          <>
            {activeCell.type === 'code' && (
              <CodeInspector
                cell={activeCell as CodeCell}
                onChange={(updates) => onUpdateCell(activeCell.id, updates)}
              />
            )}
            {activeCell.type === 'graph' && (
              <GraphInspector
                cell={activeCell as GraphCell}
                onChange={(updates) => onUpdateCell(activeCell.id, updates)}
              />
            )}
            {activeCell.type === 'delay' && (
              <DelayInspector
                cell={activeCell as DelayCell}
                onChange={(updates) => onUpdateCell(activeCell.id, updates)}
              />
            )}
          </>
        )}
      </Card>
    </div>
  );
};

