export type CsvRow = Record<string, string>;

export function parseCsv(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const headers = splitCsvLine(lines[0]).map((header) => header.trim());
  const rows = lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] ?? "").trim();
    });
    return row;
  });
  return { headers, rows };
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
      continue;
    }
    current += char;
  }
  result.push(current);
  return result;
}

export function toCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const escape = (value: unknown) => {
    const text = value == null ? "" : String(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  const lines = [headers.join(",")];
  rows.forEach((row) => {
    lines.push(headers.map((header) => escape(row[header])).join(","));
  });
  return lines.join("\n");
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
