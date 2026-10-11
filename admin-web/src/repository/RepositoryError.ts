import { ApiErrorData } from '../models/contracts';
// 实现层统一转为此错误，页面无需理解 HTTP 响应。
export class RepositoryError extends Error {
    public readonly code: number;
    public readonly details: ApiErrorData | null;
    public readonly traceId: string | null;
    constructor(code: number, message: string, details: ApiErrorData | null = null, traceId: string | null = null) {
        super(message);
        this.code = code;
        this.details = details;
        this.traceId = traceId;
        this.name = 'RepositoryError';
    }
}
