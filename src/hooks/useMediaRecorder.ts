import { useState, useRef, useCallback } from 'react';
import { Cell } from '../types/cell';
import { Overlay } from '../types/overlay';
import { renderCanvasStage } from '../utils/canvasRenderer';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface UseMediaRecorderOptions {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  cells: Cell[];
  overlays?: Overlay[];
  totalDuration: number;
  fps: number;
  onTimeUpdate: (time: number) => void;
  onRecordingStateChange?: (recording: boolean) => void;
}

export type ExportFormat = 'mp4' | 'webm';
export type ExportResolution = '1080p' | '2k' | '4k';

export interface ExportSettings {
  format: ExportFormat;
  resolution: ExportResolution;
  fps: number;
}

const resolutionSizes: Record<ExportResolution, { width: number; height: number }> = {
  '1080p': { width: 1920, height: 1080 },
  '2k': { width: 2560, height: 1440 },
  '4k': { width: 3840, height: 2160 },
};

async function convertWebmToMp4(webm: Blob): Promise<Blob> {
  const ffmpeg = new FFmpeg();
  const cdnBase = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${cdnBase}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${cdnBase}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  await ffmpeg.writeFile('input.webm', await fetchFile(webm));
  await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', 'output.mp4']);
  const data = await ffmpeg.readFile('output.mp4');
  await ffmpeg.deleteFile('input.webm');
  await ffmpeg.deleteFile('output.mp4');
  await ffmpeg.terminate();
  return new Blob([new Uint8Array(data as Uint8Array)], { type: 'video/mp4' });
}

export function useMediaRecorder({
  canvasRef,
  cells,
  overlays = [],
  totalDuration,
  fps,
  onTimeUpdate,
  onRecordingStateChange,
}: UseMediaRecorderOptions) {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isAutoExporting, setIsAutoExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const isRecordingRef = useRef<boolean>(false);
  const isPausedRef = useRef<boolean>(false);
  const frameLoopRef = useRef<number | null>(null);
  const elapsedBeforePauseRef = useRef(0);
  const startedAtRef = useRef(0);
  const recordFrameRef = useRef<((now: number) => void) | null>(null);
  const cellsRef = useRef(cells);
  const overlaysRef = useRef(overlays);
  cellsRef.current = cells;
  overlaysRef.current = overlays;

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    isRecordingRef.current = false;
    isPausedRef.current = false;
    setIsPaused(false);
    if (frameLoopRef.current !== null) {
      cancelAnimationFrame(frameLoopRef.current);
      frameLoopRef.current = null;
    }
    setIsRecording(false);
    setIsAutoExporting(false);
    setExportProgress(0);
    onRecordingStateChange?.(false);
  }, [onRecordingStateChange]);

  const startRecording = useCallback(
    async (
      renderPreview = true,
      settings: ExportSettings = { format: 'mp4', resolution: '1080p', fps }
    ) => {
      const size = resolutionSizes[settings.resolution];
      const canvas = renderPreview
        ? canvasRef.current
        : Object.assign(document.createElement('canvas'), {
            width: size.width,
            height: size.height,
          });
      if (!canvas) return;

      if (!canvas.captureStream || !window.MediaRecorder) {
        alert(
          'This browser does not support canvas recording. Try a modern Chromium or Chrome browser.'
        );
        return;
      }

      const stream = canvas.captureStream(settings.fps);

      // Prioritize pure video MP4 codecs when MP4 is requested
      const mp4Candidates = [
        'video/mp4;codecs=avc1',
        'video/mp4;codecs=avc1.42E01E',
        'video/mp4',
      ];
      const webmCandidates = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm',
      ];

      const mimeTypes = [
        ...(settings.format === 'mp4' ? mp4Candidates : []),
        ...webmCandidates,
      ];

      const mimeType = mimeTypes.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const recorderIsMp4 = mimeType.startsWith('video/mp4');

      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      } catch (e: unknown) {
        const err = e as Error;
        alert(`Could not start video recording: ${err.message}`);
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      recorderRef.current = recorder;
      chunksRef.current = [];
      isRecordingRef.current = true;
      isPausedRef.current = false;
      setIsPaused(false);
      elapsedBeforePauseRef.current = 0;
      setIsRecording(true);
      setIsAutoExporting(!renderPreview);
      setExportProgress(0);
      onRecordingStateChange?.(true);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const recordedBlob = new Blob(chunksRef.current, {
          type: recorder.mimeType || (recorderIsMp4 ? 'video/mp4' : 'video/webm'),
        });

        let finalBlob = recordedBlob;
        let finalFormat: 'mp4' | 'webm' = recorderIsMp4 ? 'mp4' : 'webm';

        // If user requested MP4 but browser only supports WebM recording (e.g. Firefox)
        if (settings.format === 'mp4' && !recorderIsMp4) {
          try {
            setExportProgress(98);
            finalBlob = await convertWebmToMp4(recordedBlob);
            finalFormat = 'mp4';
          } catch (error) {
            console.warn('In-browser FFmpeg conversion error, downloading as webm:', error);
            finalBlob = recordedBlob;
            finalFormat = 'webm';
            alert(
              'Your browser does not support native MP4 recording. Video saved as .webm. Use Chrome/Chromium for direct MP4 export, or convert with FFmpeg.'
            );
          }
        }

        const url = URL.createObjectURL(finalBlob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `coding-animation.${finalFormat}`;
        anchor.click();

        setTimeout(() => URL.revokeObjectURL(url), 30000);
        stream.getTracks().forEach((track) => track.stop());

        isRecordingRef.current = false;
        isPausedRef.current = false;
        setIsPaused(false);
        setIsRecording(false);
        setIsAutoExporting(false);
        setExportProgress(100);
        onRecordingStateChange?.(false);
      };

      recorder.start();

      // Render frame-by-frame loop during recording
      const duration = totalDuration;

      const recordFrame = (now: number) => {
        if (!isRecordingRef.current || isPausedRef.current) return;

        const t = elapsedBeforePauseRef.current + (now - startedAtRef.current) / 1000;
        const currentT = Math.min(t, duration);

        if (renderPreview) onTimeUpdate(currentT);
        renderCanvasStage(
          canvas,
          cellsRef.current,
          currentT,
          settings.fps,
          overlaysRef.current
        );

        if (!renderPreview) {
          setExportProgress(
            Math.min(
              99,
              Math.max(1, Math.floor((currentT / Math.max(duration, 0.001)) * 100))
            )
          );
        }

        if (t < duration && isRecordingRef.current) {
          frameLoopRef.current = requestAnimationFrame(recordFrame);
        } else if (isRecordingRef.current) {
          setTimeout(() => {
            if (recorder && recorder.state !== 'inactive') {
              recorder.stop();
            }
          }, 150);
        }
      };

      recordFrameRef.current = recordFrame;
      startedAtRef.current = performance.now();
      frameLoopRef.current = requestAnimationFrame(recordFrame);
    },
    [canvasRef, cells, overlays, totalDuration, fps, onTimeUpdate, onRecordingStateChange]
  );

  const autoExport = useCallback(
    (settings: ExportSettings) => {
      if (isRecordingRef.current) return;
      void startRecording(false, settings);
    },
    [startRecording]
  );

  const togglePause = useCallback(() => {
    if (!isRecordingRef.current || !recorderRef.current) return;

    if (isPausedRef.current) {
      isPausedRef.current = false;
      setIsPaused(false);
      startedAtRef.current = performance.now();
      if (recorderRef.current.state === 'paused') recorderRef.current.resume();
      if (recordFrameRef.current) {
        frameLoopRef.current = requestAnimationFrame(recordFrameRef.current);
      }
      return;
    }

    elapsedBeforePauseRef.current +=
      (performance.now() - startedAtRef.current) / 1000;
    isPausedRef.current = true;
    setIsPaused(true);
    if (recorderRef.current.state === 'recording') recorderRef.current.pause();
    if (frameLoopRef.current !== null) {
      cancelAnimationFrame(frameLoopRef.current);
      frameLoopRef.current = null;
    }
  }, []);

  return {
    isRecording,
    startRecording,
    autoExport,
    stopRecording,
    togglePause,
    isPaused,
    isAutoExporting,
    exportProgress,
  };
}
