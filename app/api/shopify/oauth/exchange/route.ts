import { NextRequest, NextResponse } from 'next/server';
const encoder = new TextEncoder();
const CALLBACK_ORIGIN = 'https://agents.dropshipacademy.nl';
const CALLBACK_PATH = '/shopify-api/callback';
function validShop(shop: string) { return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(shop); }
function hmacMessage(url: URL) { return [...url.searchParams.entries()].filter(([key]) => key !== 'hmac' && key !== 'signature').sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}=${value}`).join('&'); }
async function sign(secret: string, message: string) { const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']); const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message)); return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, '0')).join(''); }
function constantTimeEqual(left: string, right: string) { if (left.length !== right.length) return false; let mismatch = 0; for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index); return mismatch === 0; }
export async function POST(request: NextRequest) {
  const noStore = { 'cache-control': 'no-store, max-age=0', pragma: 'no-cache' };
  try {
    const body = await request.json() as { callbackUrl?: string; shop?: string; clientId?: string; clientSecret?: string };
    if (!body.callbackUrl || !body.shop || !body.clientId || !body.clientSecret || !validShop(body.shop)) return NextResponse.json({ error: 'De invoer is niet compleet of de store is ongeldig.' }, { status: 400, headers: noStore });
    const callback = new URL(body.callbackUrl);
    if (callback.origin !== CALLBACK_ORIGIN || callback.pathname !== CALLBACK_PATH) return NextResponse.json({ error: 'De terugkeer-URL hoort niet bij deze generator.' }, { status: 400, headers: noStore });
    const callbackShop = callback.searchParams.get('shop') || ''; const code = callback.searchParams.get('code') || ''; const receivedHmac = callback.searchParams.get('hmac') || '';
    if (callbackShop !== body.shop || !code || !/^[a-f0-9]{64}$/i.test(receivedHmac)) return NextResponse.json({ error: 'De Shopify-callback is onvolledig of hoort bij een andere store.' }, { status: 400, headers: noStore });
    const expectedHmac = await sign(body.clientSecret, hmacMessage(callback));
    if (!constantTimeEqual(expectedHmac, receivedHmac.toLowerCase())) return NextResponse.json({ error: 'De Shopify-handtekening klopt niet. Controleer je Client secret en probeer opnieuw.' }, { status: 401, headers: noStore });
    const shopifyResponse = await fetch(`https://${body.shop}/admin/oauth/access_token`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' }, body: new URLSearchParams({ client_id: body.clientId, client_secret: body.clientSecret, code, expiring: '0' }), signal: AbortSignal.timeout(30_000) });
    const token = await shopifyResponse.json() as { access_token?: string; scope?: string; error?: string; error_description?: string };
    if (!shopifyResponse.ok || !token.access_token) return NextResponse.json({ error: token.error_description || token.error || 'Shopify heeft de token niet uitgegeven. Controleer je appinstellingen.' }, { status: 400, headers: noStore });
    return NextResponse.json({ accessToken: token.access_token, scope: token.scope || '' }, { headers: noStore });
  } catch { return NextResponse.json({ error: 'De tokenuitwisseling kon niet worden voltooid. Probeer opnieuw.' }, { status: 500, headers: noStore }); }
}
