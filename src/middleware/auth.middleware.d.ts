import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    user?: {
        id: number;
        email: string;
        role: string;
    };
}
export declare const authenticate: (req: AuthRequest, res: Response, next: NextFunction) => Response<any, Record<string, any>> | undefined;
export declare const authorizeAdmin: (req: AuthRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.middleware.d.ts.map