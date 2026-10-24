import React from 'react';
import { Layers } from 'lucide-react';
import { Cell, CellType, GraphType } from '../../../types/cell';
import { SectionTitle } from '../../common/SectionTitle';
import { CellItem } from './CellItem';
import { AddCellButtons } from './AddCellButtons';

interface CellListProps {
  cells: Cell[];
  activeCellId: string | null;
  onSelectCell: (id: string, jumpToStart?: boolean) => void;
  onAddCell: (type: CellType, graphType?: GraphType) => void;
  onMoveCell: (id: string, direction: 'up' | 'down') => void;
  onDeleteCell: (id: string) => void;
  onImportCells: (cells: Cell[]) => void;
}

export const CellList: React.FC<CellListProps> = ({
  cells,
  activeCellId,
  onSelectCell,
  onAddCell,
  onMoveCell,
  onDeleteCell,
  onImportCells,
}) => {
  return (
    <div className="sidebar-section">
      <SectionTitle
        icon={<Layers size={14} />}
        title="Project Cells"
        badge={<span className="count-badge">{cells.length}</span>}
      />

      <div className="cell-list">
        {cells.map((cell, index) => (
          <CellItem
            key={cell.id}
            cell={cell}
            isActive={cell.id === activeCellId}
            canMoveUp={index > 0}
            canMoveDown={index < cells.length - 1}
            canDelete={cells.length > 1}
            onSelect={() => onSelectCell(cell.id, false)}
            onSelectStart={() => onSelectCell(cell.id, true)}
            onMoveUp={() => onMoveCell(cell.id, 'up')}
            onMoveDown={() => onMoveCell(cell.id, 'down')}
            onDelete={() => onDeleteCell(cell.id)}
          />
        ))}
      </div>

      <AddCellButtons onAddCell={onAddCell} onImportCells={onImportCells} />
    </div>
  );
};
