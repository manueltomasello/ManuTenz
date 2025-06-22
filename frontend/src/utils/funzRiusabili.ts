import * as XLSX from 'xlsx';

export function formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT');
  }
   export function sfumatura(color1: string, color2: string) {
    const ctx = document.createElement('canvas').getContext('2d')
    if (!ctx) return color1
    
    const sfumatura = ctx.createLinearGradient(0, 0, 0, 400)
    sfumatura.addColorStop(0, color1)
    sfumatura.addColorStop(1, color2)
    return sfumatura
  }
  export function generateColors(n: number): string[] {
    const step = 360 / n;
    return Array.from({ length: n }, (_, i) => `hsl(${step * i}, 80%, 60%)`);
  }

  export function exportToExcel(this: any) {
    let worksheet;
    let sheetName;
    let fileName;

    if (this.selectedConsultation === "costoRisorsa") {
    worksheet = XLSX.utils.json_to_sheet(this.costoRisorse);
    sheetName = 'Costo Risorsa';
    fileName = 'costo_risorsa.xlsx';
    } else if (this.selectedConsultation === "storicoInterventi") {
    worksheet = XLSX.utils.json_to_sheet(this.storicoInterventi);
    sheetName = 'Storico Interventi';
    fileName = 'storico_interventi.xlsx';
    } else if (this.selectedConsultation === "storicoRicambi") {
    worksheet = XLSX.utils.json_to_sheet(this.storicoRicambi);
    sheetName = 'Storico Ricambi';
    fileName = 'storico_ricambi.xlsx';
    } else if (this.selectedConsultation === "consumoComponenti") {
    worksheet = XLSX.utils.json_to_sheet(this.consumoComponenti);
    sheetName = 'Consumo Componenti';
    fileName = 'consumo_componenti.xlsx';
    } else if (this.selectedConsultation === "oreLavorateDip") {
    worksheet = XLSX.utils.json_to_sheet(this.oreLavorateDip);
    sheetName = 'Ore Dipendenti';
    fileName = 'ore_dipendenti.xlsx';
    } else if (this.selectedConsultation === "oreLavorateRis") {
    worksheet = XLSX.utils.json_to_sheet(this.oreLavorateRis);
    sheetName = 'Ore Risorse';
    fileName = 'ore_risorse.xlsx';
    } else {
    console.error('Consultazione non valida');
    return;
    }

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
  }

