import type { IncomingMessage, ServerResponse } from 'node:http';

export function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean>;
export function readJsonBody(req: IncomingMessage): Promise<any>;
export function sendJson(res: ServerResponse, statusCode: number, data: any, extraHeaders?: Record<string, string>): void;
