export function exportToPng() {
  const stageEl = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement | null;
  if (!stageEl) {
    alert('画布未就绪');
    return;
  }

  const dataUrl = stageEl.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `wow-raid-plan-${new Date().toISOString().slice(0, 10)}.png`;
  a.click();
}
