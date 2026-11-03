import * as XLSX from 'xlsx';

export const exportToExcel = (
  sheetData: Record<string, any>[],
  fileName: string = 'Financial_Report',
  sheetName: string = 'Report'
) => {
  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export const exportToCSV = (
  sheetData: Record<string, any>[],
  fileName: string = 'Financial_Report'
) => {
  const worksheet = XLSX.utils.json_to_sheet(sheetData);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

