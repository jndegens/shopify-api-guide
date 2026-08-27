'use client';

import { useMemo, useState } from 'react';

const APP_URL = 'https://agents.dropshipacademy.nl/shopify-api';
const REDIRECT_URL = 'https://agents.dropshipacademy.nl/shopify-api/callback';
const bundles = [
  { id: 'products', title: 'Producten & listings', scopes: ['write_products', 'read_product_listings', 'read_publications', 'write_publications'] },
  { id: 'inventory', title: 'Voorraad & locaties', scopes: ['write_inventory', 'read_locations'] },
  { id: 'orders', title: 'Orders & fulfillment', scopes: ['write_orders', 'write_draft_orders', 'write_fulfillments', 'write_merchant_managed_fulfillment_orders'] },
  { id: 'customers', title: 'Klanten & B2B', scopes: ['write_customers', 'read_customer_merge', 'write_customer_merge'] },
  { id: 'marketing', title: 'Kortingen & marketing', scopes: ['write_discounts', 'write_price_rules', 'write_marketing_events'] },
  { id: 'content', title: 'Content & thema', scopes: ['write_content', 'write_files', 'write_themes', 'write_translations'] },
  { id: 'markets', title: 'Markten & verzending', scopes: ['write_markets', 'write_shipping', 'write_locales'] },
  { id: 'finance', title: 'Financiën', scopes: ['read_shopify_payments_payouts', 'read_shopify_payments_disputes'] },
] as const;
const recommended = ['products', 'inventory', 'orders'];

function normalizeShop(value: string) {
  const input = value.trim();
  if (!input) return { domain: '', error: '' };
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'admin.shopify.com') {
      const match = url.pathname.match(/^\/store\/([a-z0-9][a-z0-9-]*)(?:\/|$)/i);
      return match ? { domain: `${match[1].toLowerCase()}.myshopify.com`, error: '' } : { domain: '', error: 'In deze Admin-URL ontbreekt /store/winkelnaam.' };
    }
    if (/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(host)) return { domain: host, error: '' };
    return { domain: '', error: 'Gebruik je Shopify Admin-URL of je permanente .myshopify.com-domein.' };
  } catch { return { domain: '', error: 'Deze URL wordt niet herkend. Kopieer hem opnieuw uit Shopify.' }; }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  return <button type="button" className="copy" onClick={copy} disabled={!value}>{copied ? 'Gekopieerd ✓' : label}</button>;
}

function ScreenshotSlot({ number, title, text }: { number: string; title: string; text: string }) {
  return <figure className="screenshot-slot"><div><b>{number}</b><span>Echte screenshot volgt</span></div><figcaption><strong>{title}</strong>{text}</figcaption></figure>;
}

export default function ShopifyApiPage() {
  const [shopInput, setShopInput] = useState('');
  const [clientId, setClientId] = useState('');
  const [selected, setSelected] = useState<string[]>(recommended);
  const shop = useMemo(() => normalizeShop(shopInput), [shopInput]);
  const scopes = useMemo(() => bundles.filter((bundle) => selected.includes(bundle.id)).flatMap((bundle) => [...bundle.scopes]).join(','), [selected]);
  const canStart = Boolean(shop.domain && clientId.trim() && scopes);
  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function startAuthorization() {
    if (!canStart) return;
    const state = crypto.randomUUID();
    sessionStorage.setItem('dsa-shopify-oauth', JSON.stringify({ state, shop: shop.domain, clientId: clientId.trim(), scopes, createdAt: Date.now() }));
    const url = new URL(`https://${shop.domain}/admin/oauth/authorize`);
    url.searchParams.set('client_id', clientId.trim()); url.searchParams.set('scope', scopes); url.searchParams.set('redirect_uri', REDIRECT_URL); url.searchParams.set('state', state);
    window.location.assign(url.toString());
  }
  const aiPrompt = `Help mij een permanente Shopify Admin API-token te maken voor mijn eigen store. Geef telkens één kort actieblok met meerdere simpele kliks en pauzeer alleen als ik iets moet invullen of terugsturen. Gebruik deze handleiding: ${APP_URL}. Laat mij nooit een Client secret of access token in de chat plakken; die voer ik alleen in het beveiligde veld op de pagina in.`;

  return <main>
    <header className="site-header"><a href="https://agents.dropshipacademy.nl/" className="brand"><span>DSA</span> Agents & Skills</a><span className="status"><i /> Shopify koppelen</span></header>
    <section className="hero"><p className="eyebrow">SHOPIFY API GENERATOR</p><h1>Je permanente Shopify API-token. Zonder gedoe.</h1><p>Deze handleiding gebruikt bewust Shopify&rsquo;s standalone OAuth-route: daarmee keur je de app zelf goed en ontvang je een offline token. De standaard eigen-organisatieroute levert namelijk een token op dat iedere 24 uur vernieuwd moet worden.</p><div className="hero-pills"><span>✓ Eigen store</span><span>✓ Permanente offline token</span><span>✓ Geen voorbeeld-domein</span></div></section>
    <section className="ai-strip"><div><span>HULP NODIG?</span><strong>Laat je AI-tool met je meekijken</strong><p>Deze prompt houdt de uitleg kort en vraagt nooit om je geheimen in de chat.</p></div><CopyButton value={aiPrompt} label="Kopieer AI-prompt" /></section>
    <section className="prepare" id="voorbereiden">
      <div className="section-heading"><span>01</span><div><p>ÉÉN KEER VOORBEREIDEN</p><h2>Maak de app aan in Shopify</h2></div></div>
      <ol className="click-route"><li><b>1</b><span>Open Shopify en ga naar <strong>Instellingen → Apps en verkoopkanalen → Apps ontwikkelen → Apps bouwen in Dev Dashboard.</strong></span></li><li><b>2</b><span>Klik <strong>App aanmaken</strong>, vul een herkenbare naam in en open daarna <strong>Versie aanmaken</strong>.</span></li><li><b>3</b><span>Vul de twee URL&rsquo;s hieronder in, voeg dezelfde bereiken toe die je in stap 02 kiest en klik rechtsboven op <strong>Vrijgeven</strong>. Open daarna <strong>Instellingen → Credentials</strong>. Daar staan je <strong>Client ID</strong> en <strong>Client secret</strong>.</span></li></ol>
      <div className="values-grid"><div><span>APP-URL</span><code>{APP_URL}</code><CopyButton value={APP_URL} label="Kopieer" /></div><div><span>TOEGESTANE OMLEIDINGS-URL</span><code>{REDIRECT_URL}</code><CopyButton value={REDIRECT_URL} label="Kopieer" /></div></div>
      <aside className="install-note"><b>Niet eerst via Home installeren.</b> Voor deze permanente standalone-route start de groene knop in stap 02 de goedkeuring. Shopify toont dan het installatiescherm. Controleer de store, klik <strong>Installeren</strong> of <strong>Toestaan</strong> en Shopify stuurt je automatisch terug. Open de app niet via het Shopify-voorbeelddomein.</aside>
      <div className="screenshot-grid"><ScreenshotSlot number="1" title="Dev Dashboard openen" text="Apps ontwikkelen en daarna Apps bouwen in Dev Dashboard." /><ScreenshotSlot number="2" title="App en versie aanmaken" text="Naam, App-URL, omleidings-URL en bereiken invullen." /><ScreenshotSlot number="3" title="Versie vrijgeven" text="Klik rechtsboven op Vrijgeven voordat je verdergaat." /></div>
    </section>
    <section className="generator" id="generator">
      <div className="section-heading light"><span>02</span><div><p>SHOPIFY KOPPELEN</p><h2>Vul twee dingen in</h2></div></div>
      <div className="form-card"><label><span>1 · Shopify Admin-URL of winkeldomein</span><input value={shopInput} onChange={(event) => setShopInput(event.target.value)} placeholder="https://admin.shopify.com/store/jouw-store/apps/..." autoComplete="off" /></label><div aria-live="polite">{shop.error && <p className="field-message error">{shop.error}</p>}{shop.domain && <p className="field-message success">Herkend als <strong>{shop.domain}</strong></p>}</div><label><span>2 · Client ID</span><input value={clientId} onChange={(event) => setClientId(event.target.value)} placeholder="Dev Dashboard → Instellingen → Credentials" autoComplete="off" /></label><p className="microcopy">Client ID en Client secret staan allebei onder Instellingen → Credentials. De Client ID is geen geheim. Bewaar de Client secret alvast veilig; die vul je na goedkeuring alleen in op onze terugkeerpagina.</p>
        <fieldset><legend>Wat moet de AI-tool kunnen?</legend><p>Selecteer één of meer blokken. Voeg exact dezelfde bereiken toe aan je vrijgegeven appversie.</p><div className="bundle-grid">{bundles.map((bundle) => <button type="button" aria-pressed={selected.includes(bundle.id)} className={selected.includes(bundle.id) ? 'bundle active' : 'bundle'} key={bundle.id} onClick={() => toggle(bundle.id)}><i aria-hidden="true">{selected.includes(bundle.id) ? '✓' : '+'}</i><span><strong>{bundle.title}</strong><small>{bundle.scopes.join(', ')}</small></span></button>)}</div></fieldset>
        <div className="scope-output"><span>GEKOZEN BEREIKEN</span><code>{scopes || 'Kies minimaal één taakgroep'}</code><CopyButton value={scopes} label="Kopieer scopes" /></div><button type="button" className="authorize" disabled={!canStart} onClick={startAuthorization}>Open Shopify en keur toegang goed <span>→</span></button>{!canStart && <p className="button-help">Vul eerst een geldige store, Client ID en minimaal één taakgroep in.</p>}
      </div>
    </section>
    <section className="after"><div className="section-heading"><span>03</span><div><p>NA GOEDKEURING</p><h2>De pagina brengt je automatisch terug</h2></div></div><div className="after-grid"><div><b>1</b><strong>Shopify toont de rechten</strong><p>Controleer je store en klik op Installeren of Toestaan.</p></div><div><b>2</b><strong>Vul je Client secret in</strong><p>Je vindt hem onder Dev Dashboard → Instellingen → Credentials. Vul hem alleen in op de beveiligde terugkeerpagina.</p></div><div><b>3</b><strong>Kopieer en verwijder de token</strong><p>Zet hem direct in de beveiligde secret-invoer van je AI-project en wis hem daarna van het scherm.</p></div></div><aside className="security"><strong>Veiligheidsregel</strong><p>De applicatiecode slaat je Client secret of token niet op en zet caching uit. De token blijft zichtbaar totdat jij hem van het scherm wist of de pagina sluit. Deel hem nooit in chat, e-mail, screenshots, Git of logs. Gebruik je meerdere stores? Label iedere token met het permanente <code>.myshopify.com</code>-domein.</p></aside></section>
    <footer><span>DSA Agents & Skills</span><p>Shopify API-koppeling voor je eigen store · OAuth offline access token</p></footer>
  </main>;
}
