declare module 'bwip-js' {
  function toBuffer(options: any): Promise<Buffer>;
  export = { toBuffer };
}

declare module 'pdfkit' {
  class PDFDocument {
    constructor(options?: any);
    pipe(stream: any): this;
    fontSize(size: number): this;
    font(name: string): this;
    text(text: string, x?: number, y?: number, options?: any): this;
    image(src: any, x?: number, y?: number, options?: any): this;
    addPage(options?: any): this;
    end(): void;
    on(event: string, callback: (...args: any[]) => void): this;
  }
  export = PDFDocument;
}
