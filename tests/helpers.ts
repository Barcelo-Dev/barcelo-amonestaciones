import { NextRequest } from 'next/server';
import { signSession } from '../src/lib/jwt';
import { COOKIE_NAME } from '../src/lib/auth';
import { SessionUser } from '../src/lib/types';

interface MakeRequestOptions {
  method?: string;
  body?: unknown;
  session?: SessionUser;
  formData?: FormData;
}

export function makeRequest(url: string, options: MakeRequestOptions = {}): NextRequest {
  const headers = new Headers();
  if (!options.formData) headers.set('content-type', 'application/json');
  if (options.session) {
    const token = signSession(options.session);
    headers.set('cookie', `${COOKIE_NAME}=${token}`);
  }
  const init: RequestInit = { method: options.method || 'GET', headers };
  if (options.formData) {
    init.body = options.formData;
  } else if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }
  return new NextRequest(new Request(url, init));
}

export const ADMIN: SessionUser = { username: 'admin', name: 'Administrador', role: 'admin' };
export const SUPERVISOR: SessionUser = { username: 'sup1', name: 'Supervisor Uno', role: 'supervisor' };
