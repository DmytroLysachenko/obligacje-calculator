/**
 * Converts an array of objects into a CSV string and triggers a download.
 * Uses semicolon as separator for better compatibility with European Excel locales (like Poland).
 */
export function exportToCSV(data: Record<string, string | number | boolean | null | undefined>[], fileName: string) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const separator = ';';
  
  const csvRows = [
    headers.join(separator), // Header row
    ...data.map(row => 
      headers.map(header => {
        const val = row[header];
        if (val === null || val === undefined) return '';
        
        const stringVal = String(val);
        // Escape quotes and wrap in quotes if contains separator, newline or quotes
        if (stringVal.includes(separator) || stringVal.includes('\n') || stringVal.includes('"')) {
          return `"${stringVal.replace(/"/g, '""')}"`;
        }
        return stringVal;
      }).join(separator)
    )
  ];

  const csvString = csvRows.join('\r\n');
  // Add BOM for proper UTF-8 detection in Excel
  const blob = new Blob(['\ufeff' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
