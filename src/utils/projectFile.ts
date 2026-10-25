import { Cell } from '../types/cell';
import { Overlay } from '../types/overlay';
import { FpsOption } from '../types/animation';

type ExportFormat = 'mp4' | 'webm';
type ExportResolution = '1080p' | '2k' | '4k';

export const PROJECT_KIND = 'code-studio-project';
export const PROJECT_VERSION = 1;
export const PROJECT_STORAGE_KEY = 'code-studio-project-v1';

export interface ProjectSettings {
  speed: number;
  fps: FpsOption;
  exportFormat: ExportFormat;
  exportResolution: ExportResolution;
  exportFps: number;
}

export interface StudioProject {
  version: number;
  kind: typeof PROJECT_KIND;
  cells: Cell[];
  overlays: Overlay[];
  settings: ProjectSettings;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function serializeProject(project: Omit<StudioProject, 'kind' | 'version'>): string {
  const document: StudioProject = {
    version: PROJECT_VERSION,
    kind: PROJECT_KIND,
    cells: project.cells,
    overlays: project.overlays,
    settings: project.settings,
  };
  return JSON.stringify(document, null, 2);
}

export function parseProject(json: string): StudioProject {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error('The selected file is not valid JSON.');
  }

  if (!isObject(data)) {
    throw new Error('The selected file is not a Code Studio project.');
  }

  if (data.kind !== PROJECT_KIND) {
    throw new Error('The selected file is not a Code Studio project.');
  }

  if (!Array.isArray(data.cells) || data.cells.length === 0) {
    throw new Error('The project does not contain any animation cells.');
  }

  if (!Array.isArray(data.overlays)) {
    throw new Error('The project overlay list is missing or invalid.');
  }

  const settings = isObject(data.settings) ? data.settings : {};

  return {
    version: typeof data.version === 'number' ? data.version : PROJECT_VERSION,
    kind: PROJECT_KIND,
    cells: data.cells as Cell[],
    overlays: data.overlays as Overlay[],
    settings: {
      speed: Number(settings.speed) || 18,
      fps: (Number(settings.fps) as FpsOption) || 30,
      exportFormat: settings.exportFormat === 'webm' ? 'webm' : 'mp4',
      exportResolution:
        settings.exportResolution === '2k' || settings.exportResolution === '4k'
          ? settings.exportResolution
          : '1080p',
      exportFps: Number(settings.exportFps) || 30,
    },
  };
}

export function readStoredProject(): StudioProject | null {
  try {
    const raw = localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return null;
    return parseProject(raw);
  } catch {
    return null;
  }
}

export function writeStoredProject(project: Omit<StudioProject, 'kind' | 'version'>): void {
  try {
    localStorage.setItem(PROJECT_STORAGE_KEY, serializeProject(project));
  } catch (error) {
    console.warn('Unable to autosave project:', error);
  }
}
