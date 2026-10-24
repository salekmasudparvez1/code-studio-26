import React, { memo, useState } from "react";
import { ChevronDown, Layers } from "lucide-react";
import { Cell, CellType, GraphType } from "../../../types/cell";
import { SectionTitle } from "../../common/SectionTitle";
import { CellItem } from "./CellItem";
import { AddCellButtons } from "./AddCellButtons";

interface CellListProps {
  cells: Cell[];
  activeCellId: string | null;
  onSelectCell: (id: string, jumpToStart?: boolean) => void;
  onAddCell: (type: CellType, graphType?: GraphType) => void;
  onMoveCell: (id: string, direction: "up" | "down") => void;
  onDeleteCell: (id: string) => void;
  onImportCells: (cells: Cell[]) => void;
}

export const CellList: React.FC<CellListProps> = memo(
  ({
    cells,
    activeCellId,
    onSelectCell,
    onAddCell,
    onMoveCell,
    onDeleteCell,
    onImportCells,
  }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <section className="sidebar-section ">
        <div className="photoshop-cell-header">
          <SectionTitle
            icon={<Layers size={14} />}
            title="Project Cells"
            badge={<span className="count-badge">{cells.length}</span>}
          />

          <button
            type="button"
            className="photoshop-collapse-button"
            aria-label={
              isExpanded ? "Collapse project cells" : "Expand project cells"
            }
            aria-expanded={isExpanded}
            onClick={() => setIsExpanded((expanded) => !expanded)}
          >
            <ChevronDown
              size={15}
              className={isExpanded ? "" : "is-collapsed"}
            />
          </button>
        </div>

        {isExpanded && (
          <div className="photoshop-cell-content">
            <div
              className="cell-list photoshop-cell-list"
              role="list"
              aria-label="Project cells"
            >
              {cells.map((cell, index) => (
                <div
                  key={cell.id}
                  className={
                    cell.id === activeCellId
                      ? "photoshop-cell-row is-active"
                      : "photoshop-cell-row"
                  }
                  role="listitem"
                >
                  <CellItem
                    cell={cell}
                    isActive={cell.id === activeCellId}
                    canMoveUp={index > 0}
                    canMoveDown={index < cells.length - 1}
                    canDelete={cells.length > 1}
                    onSelect={() => onSelectCell(cell.id, false)}
                    onSelectStart={() => onSelectCell(cell.id, true)}
                    onMoveUp={() => onMoveCell(cell.id, "up")}
                    onMoveDown={() => onMoveCell(cell.id, "down")}
                    onDelete={() => onDeleteCell(cell.id)}
                  />
                </div>
              ))}
            </div>

            <div className="photoshop-cell-actions">
              <AddCellButtons
                onAddCell={onAddCell}
                onImportCells={onImportCells}
              />
            </div>
          </div>
        )}
      </section>
    );
  },
);

CellList.displayName = "CellList";
