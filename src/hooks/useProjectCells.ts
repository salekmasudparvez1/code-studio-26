import { useState, useCallback } from 'react';
import { Cell, CellType, GraphType } from '../types/cell';
import {
  INITIAL_CELLS,
  createCodeCell,
  createGraphCell,
  createDelayCell,
  createBoardCell,
  createDecisionBoundaryCell,
  createNeuralNetworkCell,
  createCnnCell,
  createRnnCell,
  createLstmCell,
  createYoloCell,
  createMatplotlibCell,
  createClusteringCell,
  createGradientDescentCell,
} from '../constants/defaults';

export function useProjectCells(initialCells: Cell[] | undefined = INITIAL_CELLS) {
  const startingCells = initialCells && initialCells.length > 0 ? initialCells : INITIAL_CELLS;
  const [cells, setCells] = useState<Cell[]>(startingCells);
  const [activeCellId, setActiveCellId] = useState<string | null>(
    () => startingCells[0]?.id || null
  );

  const activeCell = cells.find((c) => c.id === activeCellId) || null;

  const addCell = useCallback((
    type: CellType,
    graphType?: GraphType,
    options?: { bgColor?: string; seconds?: number; name?: string },
  ) => {
    let newCell: Cell;

    if (type === 'code') {
      newCell = createCodeCell({
        name: 'model_training.py',
        source:
          'import torch\nimport torch.nn as nn\n\n# Deep Learning Model Pipeline\nmodel = nn.Sequential(\n    nn.Conv2d(3, 16, 3),\n    nn.ReLU(),\n    nn.AdaptiveAvgPool2d((1, 1)),\n    nn.Flatten(),\n    nn.Linear(16, 10)\n)\n\nprint("Model architecture ready!")',
      });
    } else if (type === 'graph') {
      if (graphType === 'ann' || graphType === 'neural-network') {
        newCell = createNeuralNetworkCell();
      } else if (graphType === 'cnn') {
        newCell = createCnnCell();
      } else if (graphType === 'rnn') {
        newCell = createRnnCell();
      } else if (graphType === 'lstm') {
        newCell = createLstmCell();
      } else if (graphType === 'yolo') {
        newCell = createYoloCell();
      } else if (graphType === 'matplotlib') {
        newCell = createMatplotlibCell();
      } else if (graphType === 'decision-boundary') {
        newCell = createDecisionBoundaryCell();
      } else if (graphType === 'clustering') {
        newCell = createClusteringCell();
      } else if (graphType === 'gradient-descent') {
        newCell = createGradientDescentCell();
      } else {
        newCell = createGraphCell({
          name: 'Metrics Bar Chart',
          graphType: 'bar',
          data: [14, 28, 22, 38, 26, 45, 32],
        });
      }
    } else if (type === 'board') {
      newCell = createBoardCell({
        seconds: options?.seconds ?? 8,
        bgColor: options?.bgColor ?? '#000000',
        ...(options?.name ? { name: options.name } : {}),
      });
    } else {
      newCell = createDelayCell({
        name: 'Pause',
        seconds: 3,
      });
    }

    setCells((prev) => [...prev, newCell]);
    setActiveCellId(newCell.id);
    return newCell;
  }, []);

  const updateCell = useCallback((id: string, updates: Partial<Cell>) => {
    setCells((prev) =>
      prev.map((cell) => {
        if (cell.id !== id) return cell;
        return { ...cell, ...updates } as Cell;
      })
    );
  }, []);

  const moveCell = useCallback((id: string, direction: 'up' | 'down') => {
    setCells((prev) => {
      const index = prev.findIndex((c) => c.id === id);
      if (index === -1) return prev;
      if (direction === 'up' && index === 0) return prev;
      if (direction === 'down' && index === prev.length - 1) return prev;

      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  }, []);

  const deleteCell = useCallback((id: string) => {
    setCells((prev) => {
      if (prev.length <= 1) return prev; // keep at least 1 cell
      const filtered = prev.filter((c) => c.id !== id);
      setActiveCellId((currentActive) => {
        if (currentActive === id) {
          return filtered[0]?.id || null;
        }
        return currentActive;
      });
      return filtered;
    });
  }, []);

  const importCells = useCallback((importedCells: Cell[]) => {
    if (importedCells.length === 0) {
      throw new Error('The notebook does not contain any cells.');
    }
    setCells(importedCells);
    setActiveCellId(importedCells[0].id);
  }, []);

  return {
    cells,
    setCells,
    activeCellId,
    activeCell,
    setActiveCellId,
    addCell,
    updateCell,
    moveCell,
    deleteCell,
    importCells,
  };
}
