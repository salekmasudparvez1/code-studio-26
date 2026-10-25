import assert from 'node:assert/strict';
import { createServer } from 'vite';

const server = await createServer({
  server: { middlewareMode: true },
  appType: 'custom',
});

try {
  const overlays = await server.ssrLoadModule('/src/utils/overlays.ts');
  const overlayTypes = await server.ssrLoadModule('/src/types/overlay.ts');
  const projectFile = await server.ssrLoadModule('/src/utils/projectFile.ts');

  const {
    createDraftShape,
    createTextOverlay,
    defaultOverlayWindow,
    finalizeDraft,
    hitTestOverlay,
    isOverlayVisibleAt,
    reorderOverlays,
    translateOverlay,
    updateDraftShape,
  } = overlays;
  const { DEFAULT_OVERLAY_STYLE } = overlayTypes;
  const { parseProject, serializeProject } = projectFile;

  const text = createTextOverlay(
    { x: 120, y: 80 },
    DEFAULT_OVERLAY_STYLE,
    [],
    1,
    10
  );

  assert.equal(text.kind, 'text');
  assert.equal(text.text, 'Note');
  assert.equal(isOverlayVisibleAt(text, 1), true);
  assert.equal(isOverlayVisibleAt({ ...text, visible: false }, 1), false);
  assert.deepEqual(defaultOverlayWindow(8, 10, 4), { startTime: 8, endTime: 10 });

  const moved = translateOverlay(text, 10, 20);
  assert.equal(moved.kind, 'text');
  assert.equal(moved.x, 130);
  assert.equal(moved.y, 100);

  const arrow = createDraftShape(
    'arrow',
    { x: 10, y: 10 },
    DEFAULT_OVERLAY_STYLE,
    [text],
    0,
    12
  );
  const stretched = updateDraftShape(arrow, { x: 200, y: 80 });
  const finishedArrow = finalizeDraft(stretched);
  assert.ok(finishedArrow);
  assert.equal(finishedArrow.kind, 'arrow');

  const tiny = finalizeDraft(
    createDraftShape('rect', { x: 0, y: 0 }, DEFAULT_OVERLAY_STYLE, [], 0, 5)
  );
  assert.equal(tiny, null);

  const ordered = reorderOverlays([text, finishedArrow], finishedArrow.id, text.id);
  assert.equal(ordered[0].id, finishedArrow.id);
  assert.equal(ordered[0].zIndex, 1);

  const hit = hitTestOverlay([text], { x: 130, y: 95 }, 1);
  assert.equal(hit?.id, text.id);

  const projectJson = serializeProject({
    cells: [{ id: 'cell_1', type: 'delay', name: 'Pause', seconds: 2 }],
    overlays: [text],
    settings: {
      speed: 18,
      fps: 30,
      exportFormat: 'mp4',
      exportResolution: '1080p',
      exportFps: 30,
    },
  });
  const parsed = parseProject(projectJson);
  assert.equal(parsed.overlays.length, 1);
  assert.equal(parsed.cells[0].type, 'delay');

  let threw = false;
  try {
    parseProject('{"hello":true}');
  } catch {
    threw = true;
  }
  assert.equal(threw, true);

  console.log('Overlay unit tests passed.');
} finally {
  await server.close();
}
