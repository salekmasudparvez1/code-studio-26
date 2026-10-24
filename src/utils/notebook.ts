import { createCodeCell } from '../constants/defaults';
import { Cell } from '../types/cell';

interface NotebookOutputEntry {
  output_type?: string;
  name?: string;
  text?: string | string[];
  data?: Record<string, unknown>;
  ename?: string;
  evalue?: string;
  traceback?: string[];
}

interface NotebookCell {
  cell_type?: string;
  source?: string | string[];
  metadata?: { name?: string };
  outputs?: NotebookOutputEntry[];
}

interface NotebookDocument {
  nbformat?: number;
  cells?: NotebookCell[];
  metadata?: { title?: string };
}

const asText = (value: unknown): string => {
  if (Array.isArray(value)) return value.join('');
  if (typeof value === 'string') return value;
  if (value === undefined || value === null) return '';
  return JSON.stringify(value, null, 2);
};

const outputFromCell = (outputs: NotebookOutputEntry[]): {
  text?: string;
  imageDataUrl?: string;
  mimeType?: string;
} | undefined => {
  const textParts: string[] = [];
  let imageDataUrl: string | undefined;
  let mimeType: string | undefined;

  for (const output of outputs) {
    if (output.output_type === 'error') {
      textParts.push(
        `Error: ${output.ename || 'Error'}: ${output.evalue || ''}`.trim(),
        ...(output.traceback || [])
      );
      continue;
    }

    if (output.text) textParts.push(asText(output.text));
    const data = output.data || {};
    const preferredText = data['text/plain'];
    if (preferredText) textParts.push(asText(preferredText));

    for (const type of ['image/png', 'image/jpeg', 'image/svg+xml']) {
      const value = data[type];
      if (typeof value === 'string') {
        imageDataUrl = value.startsWith('data:') ? value : `data:${type};base64,${value}`;
        mimeType = type;
        break;
      }
    }

    if (!preferredText && data['application/json']) {
      textParts.push(asText(data['application/json']));
    }
  }

  if (!textParts.length && !imageDataUrl) return undefined;
  return {
    text: textParts.join('\n').trim() || undefined,
    imageDataUrl,
    mimeType,
  };
};

export function parseNotebook(json: string, fileName = 'notebook.ipynb'): Cell[] {
  let notebook: NotebookDocument;
  try {
    notebook = JSON.parse(json) as NotebookDocument;
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  if (!Array.isArray(notebook.cells)) {
    throw new Error('The selected file is not a Jupyter notebook: cells are missing.');
  }

  const baseName = fileName.replace(/\.ipynb$/i, '');
  return notebook.cells.map((notebookCell, index) => {
    const source = asText(notebookCell.source);
    const cellType = notebookCell.cell_type || 'code';
    const extension = cellType === 'markdown' ? 'md' : 'py';
    const label = notebookCell.metadata?.name || `${baseName} [${index + 1}]`;
    const output = outputFromCell(notebookCell.outputs || []);

    return createCodeCell({
      name: `${label}.${extension}`,
      source,
      output,
      speed: 24,
      pause: output ? 2 : 1,
    });
  });
}
