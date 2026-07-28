declare global {
  namespace Express {
    namespace Multer {
      interface File {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination?: string;
        filename?: string;
        path?: string;
        buffer: Buffer;
      }
    }

    interface Request {
      user?: {
        id: string;
        role: "student" | "admin";
        email: string;
        fullName?: string;
      };
      rawBody?: Buffer;
      bodyString?: string;
      file?: Multer.File;
      files?: { [fieldname: string]: Multer.File[] } | Multer.File[];
    }
  }
}

export {};
