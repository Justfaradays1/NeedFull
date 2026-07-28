declare module "compression" {
  export default function compression(options?: any): any;
}

declare module "multer" {
  interface Multer {
    single(fieldname: string): any;
    array(fieldname: string, maxCount?: number): any;
    fields(fields: Array<{ name: string; maxCount?: number }>): any;
    none(): any;
  }

  interface MulterOptions {
    dest?: string;
    storage?: any;
    limits?: { fileSize?: number };
    fileFilter?: (
      req: any,
      file: any,
      cb: (error: Error | null, acceptFile?: boolean) => void,
    ) => void;
    preservePath?: boolean;
  }

  function multer(options?: MulterOptions): Multer;
  namespace multer {
    function memoryStorage(): any;
    function diskStorage(options: any): any;
  }

  export = multer;
}
