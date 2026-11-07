import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

export interface CardExportOptions {
  element: HTMLElement;
  fileName?: string;
}

export const cardGeneratorService = {
  async generateQRCodeDataUrl(token: string): Promise<string> {
    return QRCode.toDataURL(token, {
      width: 256,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
  },

  async downloadCardAsPNG({ element, fileName = 'membership-card.png' }: CardExportOptions): Promise<string> {
    const canvas = await html2canvas(element, {
      scale: 3, // crisp high DPI for phones
      useCORS: true,
      backgroundColor: null,
    });

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    link.click();
    return dataUrl;
  },
};
