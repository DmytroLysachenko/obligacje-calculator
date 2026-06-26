/**
 * Downloads a string as a file in the browser.
 * Adds BOM for proper UTF-8 detection in Excel.
 */
export function downloadFile(content: string, fileName: string, contentType: string) {
  const anchor = document.createElement('a');
  const file = new Blob([`\ufeff${content}`], { type: contentType });
  anchor.href = URL.createObjectURL(file);
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

export function downloadJsonFile(payload: unknown, fileName: string) {
  const anchor = document.createElement('a');
  const file = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  anchor.href = URL.createObjectURL(file);
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}
