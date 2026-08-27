'use client';

import { useMemo, useState } from 'react';

type ScopeGroup = { id: string; title: string; summary: string; level?: 'normal' | 'sensitive' | 'approval'; scopes: { id: string; label: string; detail: string }[] };
const CALLBACK = 'https://jouw-ai-tool.nl/api/shopify/callback';
const SUPPORT_PROMPT = `Ik koppel een Shopify-store aan een AI-tool via een app in het Shopify Dev Dashboard. Begeleid mij stap voor stap vanaf de plek waar ik nu vastloop.

Veiligheidsregels:
- Vraag eerst om mijn Shopify Admin-URL en zet die om naar het permanente winkelnaam.myshopify.com-domein.
- Toon dat domein en laat mij de juiste store bevestigen vóór installatie of een wijziging.
- Vraag nooit om een Client secret, access token of authorization code in deze chat. Verwijs voor geheimen naar de beveiligde secret-invoer van mijn tool.
- Mijn App-URL en exacte HTTPS callback-URL moeten door mijn eigen AI-tool/backend worden aangeleverd. Een callback is geen webhook.
- Adviseer de minimaal benodigde Shopify-scopes voor mijn taak; leg gevoelige rechten apart uit.
- Als ik een foutmelding deel, vraag om de exacte tekst of een screenshot waarop secrets en persoonsgegevens zijn afgeschermd.
- Controleer na installatie eerst read-only de shopnaam, het myshopifyDomain en de toegekende scopes. Schrijf pas na mijn bevestiging.

Vraag nu: “Bij welke stap ben je en wat zie je precies?”`;
const groups: ScopeGroup[] = [
  { id: 'products', title: 'Producten & listings', summary: 'Catalogus, collecties, varianten en publicatiekanalen.', scopes: [
    { id: 'write_products', label: 'Producten beheren', detail: 'Lezen en schrijven van producten, varianten en collecties.' },
    { id: 'read_product_listings', label: 'Listings lezen', detail: 'Ziet welke producten op verkoopkanalen gepubliceerd zijn.' },
    { id: 'read_publications', label: 'Publicaties lezen', detail: 'Controleert beschikbare verkoopkanalen en publicaties.' },
    { id: 'write_publications', label: 'Publicaties beheren', detail: 'Publiceert producten naar beschikbare kanalen.' },
  ]},
  { id: 'inventory', title: 'Voorraad & locaties', summary: 'Voorraadaantallen en de locaties waar voorraad ligt.', scopes: [
    { id: 'write_inventory', label: 'Voorraad beheren', detail: 'Leest en wijzigt inventory items en voorraadniveaus.' },
    { id: 'read_locations', label: 'Locaties lezen', detail: 'Vindt de juiste Shopify-locatie voor een voorraadmutatie.' },
  ]},
  { id: 'orders', title: 'Orders & fulfillment', summary: 'Orders, conceptorders en fulfilment bij eigen locaties.', level: 'sensitive', scopes: [
    { id: 'write_orders', label: 'Orders beheren', detail: 'Orders van de laatste 60 dagen lezen en aanpassen.' },
    { id: 'write_draft_orders', label: 'Conceptorders beheren', detail: 'Conceptorders maken, lezen en wijzigen.' },
    { id: 'write_fulfillments', label: 'Fulfillmentservices beheren', detail: 'Fulfillmentservices lezen en wijzigen.' },
    { id: 'write_merchant_managed_fulfillment_orders', label: 'Eigen fulfillmentorders', detail: 'Fulfillmentorders van eigen locaties beheren.' },
  ]},
  { id: 'customers', title: 'Klanten & B2B', summary: 'Klantprofielen, segmenten en bedrijfsaccounts.', level: 'sensitive', scopes: [
    { id: 'write_customers', label: 'Klanten beheren', detail: 'Klant-, segment- en bedrijfsdata lezen en wijzigen.' },
    { id: 'read_customer_merge', label: 'Klantduplicaten lezen', detail: 'Bekijkt mogelijke samenvoegingen van klantprofielen.' },
    { id: 'write_customer_merge', label: 'Klanten samenvoegen', detail: 'Voert goedgekeurde samenvoegingen uit.' },
  ]},
  { id: 'marketing', title: 'Kortingen & marketing', summary: 'Kortingsregels, prijsregels en marketingevents.', scopes: [
    { id: 'write_discounts', label: 'Kortingen beheren', detail: 'Kortingscodes en automatische kortingen beheren.' },
    { id: 'write_price_rules', label: 'Prijsregels beheren', detail: 'Prijsregels voor kortingscodes lezen en wijzigen.' },
    { id: 'write_marketing_events', label: 'Marketingevents beheren', detail: 'Marketingactiviteiten registreren en bijwerken.' },
  ]},
  { id: 'content', title: 'Content & storefront', summary: 'Pagina’s, blogs, bestanden, thema’s en vertalingen.', scopes: [
    { id: 'write_content', label: 'Winkelcontent beheren', detail: 'Pagina’s, blogs, artikelen en redirects beheren.' },
    { id: 'write_files', label: 'Bestanden beheren', detail: 'Afbeeldingen en algemene bestanden uploaden en wijzigen.' },
    { id: 'write_themes', label: 'Thema’s beheren', detail: 'Thema-assets wijzigen. Alleen selecteren als dit echt nodig is.' },
    { id: 'write_translations', label: 'Vertalingen beheren', detail: 'Vertalingen voor winkelresources beheren.' },
  ]},
  { id: 'shipping', title: 'Markten & verzending', summary: 'Markten, verzendinstellingen en lokalisatie.', scopes: [
    { id: 'write_markets', label: 'Markten beheren', detail: 'Internationale markten en hun configuratie beheren.' },
    { id: 'write_shipping', label: 'Verzending beheren', detail: 'Carrier services en verzendregio’s beheren.' },
    { id: 'write_locales', label: 'Talen beheren', detail: 'Publicatie van winkeltalen beheren.' },
  ]},
  { id: 'finance', title: 'Financiën', summary: 'Uitbetalingen en geschillen van Shopify Payments.', level: 'approval', scopes: [
    { id: 'read_shopify_payments_payouts', label: 'Uitbetalingen lezen', detail: 'Payouts, saldo en transacties bekijken.' },
    { id: 'read_shopify_payments_disputes', label: 'Geschillen lezen', detail: 'Shopify Payments-disputes bekijken.' },
    { id: 'read_shopify_payments_dispute_evidences', label: 'Bewijsstukken lezen', detail: 'Informatie bij betaalgeschillen bekijken.' },
  ]},
];
const starter = ['write_products', 'read_product_listings', 'write_inventory', 'read_locations'];
const allScopes = groups.flatMap((group) => group.scopes.map((scope) => scope.id));

type ShopResult = { domain: string; source: 'admin' | 'myshopify' } | { error: string };

function normalizeShop(value: string): ShopResult {
  const input = value.trim();
  if (!input) return { error: 'Plak een Shopify Admin-URL of .myshopify.com-domein.' };

  try {
    const candidate = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const url = new URL(candidate);
    const hostname = url.hostname.toLowerCase().replace(/^www\./, '');

    if (hostname === 'admin.shopify.com') {
      const match = url.pathname.match(/^\/store\/([a-z0-9][a-z0-9-]*)(?:\/|$)/i);
      if (!match) return { error: 'Deze Admin-URL bevat geen herkenbare /store/winkelnaam.' };
      return { domain: `${match[1].toLowerCase()}.myshopify.com`, source: 'admin' };
    }

    const match = hostname.match(/^([a-z0-9][a-z0-9-]*)\.myshopify\.com$/i);
    if (match) return { domain: `${match[1].toLowerCase()}.myshopify.com`, source: 'myshopify' };

    return { error: 'Gebruik een admin.shopify.com/store/… URL of het permanente .myshopify.com-domein.' };
  } catch {
    return { error: 'Deze URL kon niet worden gelezen. Kopieer hem opnieuw uit Shopify Admin.' };
  }
}

function CopyButton({ value, children = 'Kopieer' }: { value: string; children?: React.ReactNode }) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setStatus('copied');
    } catch {
      setStatus('error');
    }
    window.setTimeout(() => setStatus('idle'), 2400);
  }

  const label = status === 'copied' ? 'Gekopieerd ✓' : status === 'error' ? 'Kopiëren mislukt — selecteer handmatig' : children;
  return <button className="copy-button" type="button" onClick={copy} disabled={!value} aria-live="polite">{label}</button>;
}

function MiniScreen({ kind }: { kind: 'admin-apps' | 'admin-development' | 'create' | 'config' | 'install' }) {
  if (kind === 'admin-apps' || kind === 'admin-development') return <ShopifyFrame host="admin.shopify.com"><div className="admin-shot"><div className="admin-top"><b className="shopify-wordmark">▰ shopify</b><div className="admin-search">⌕&nbsp;&nbsp; Zoeken <kbd>⌘ K</kbd></div><span>◉</span><span>♟</span><b className="store-top">◉ Base44 Store</b></div><section className="settings-dialog"><aside><div className="store-card"><span className="store-avatar">≋</span><div><b>Base44 Store</b><small>voorbeeld.myshopify.com</small></div></div><div className="settings-search">⌕&nbsp; Zoeken</div>{['⌂|Algemeen','▣|Abonnement','▤|Facturering','♣|Gebruikers','◈|Betalingen','▾|Checkout','●|Klantaccounts','◆|Verzending en bezorging','♜|Belastingen en douanerechten','⌖|Locaties','◇|Markten','▦|Apps','▦|Verkoopkanalen','▱|Domeinen','✣|Klantgebeurtenissen','♟|Meldingen'].map((item) => { const [icon,label] = item.split('|'); return <span className={label === 'Apps' ? 'active' : ''} key={label}><i>{icon}</i>{label}</span>; })}</aside><div className="settings-main"><button className="close-x" tabIndex={-1}>×</button>{kind === 'admin-apps' ? <><div className="apps-title-row"><h4><span>▦</span> Apps</h4><div><button className="secondary-button" tabIndex={-1}>Apps ontwikkelen</button><button className="shopify-black" tabIndex={-1}>Shopify App Store</button></div></div><section className="installed-card"><b>Geïnstalleerd</b>{['API keys DSA','DSA Agents','Theme Access'].map((name)=><div key={name}><span className="app-tile">▦</span><strong>{name}</strong><span>•••</span></div>)}</section><p className="more-info">Meer informatie over apps</p><i className="callout c1">1</i></> : <><h4 className="development-title"><span>▦</span> › App-ontwikkeling</h4><section className="development-card"><div><h5>Apps bouwen en beheren in je Dev Dashboard</h5><p>Dev Dashboard is je nieuwe thuisbasis voor app-ontwikkeling en biedt meer capaciteiten en tools dan verouderde gepersonaliseerde apps.</p><p className="development-actions"><button tabIndex={-1}>Apps bouwen in Dev Dashboard</button><button className="plain-button" tabIndex={-1}>Meer informatie</button></p></div><div className="dashboard-illustration"><b>✣</b><i /><i /><i /></div></section><i className="callout c2">2</i></>}</div></section></div></ShopifyFrame>;

  if (kind === 'create') return <ShopifyFrame host="dev.shopify.com"><div className="dev-shot"><DevRail active="Apps" /><div className="dev-page"><DevTop /><a className="back-link">‹ Terug naar apps</a><h4>Een app aanmaken</h4><section className="dev-card cli-card"><h5>Starten met Shopify CLI</h5><p>Bouw lokaal met Shopify CLI en verbind je project daarna met het Dev Dashboard.</p><code>npm init @shopify/app@latest</code></section><div className="or"><span>OF</span></div><section className="dev-card create-card"><h5>Starten vanuit het Dev Dashboard</h5><p>Voeg bereiken toe om snel API-inloggegevens te genereren.</p><label>App-naam<div className="dev-input"><span>AI Store Connector</span><small>18/30</small></div></label><button className="shopify-black" tabIndex={-1}>App aanmaken</button></section><i className="callout c1">1</i><i className="callout c2">2</i></div></div></ShopifyFrame>;

  if (kind === 'config') return <ShopifyFrame host="dev.shopify.com"><div className="dev-shot"><DevRail active="Apps" /><div className="dev-page config-page"><DevTop /><div className="dev-page-head"><div><a className="back-link">‹ Terug naar versielijstpagina</a><h4>Versie aanmaken</h4></div><button className="shopify-black" tabIndex={-1}>Vrijgeven</button></div><p className="based-on">Gebaseerd op <b>ai-store-connector-1</b> <span>Actief</span></p><section className="dev-card form-card"><h5>URL’s</h5><label>App-URL<div className="dev-input">https://jouw-ai-tool.nl/shopify</div></label><label className="dev-check"><input type="checkbox" readOnly /> App in het Shopify-beheercentrum insluiten</label><label>URL voor voorkeuren <small>Optioneel</small><div className="dev-input placeholder">https://</div></label></section><section className="dev-card form-card"><h5>Webhooks</h5><label>API-versie<div className="dev-input select">2026-07 <span>⌄</span></div></label></section><section className="dev-card form-card access-card"><h5>API-toegang</h5><label>Bereiken<div className="dev-input">write_products, write_inventory, read_locations…</div></label><button className="secondary-button" tabIndex={-1}>Bereiken selecteren</button><label>Toegestane omleidings-URL’s<div className="dev-input">{CALLBACK}</div></label></section><i className="callout c1">1</i><i className="callout c2">2</i><i className="callout c3">3</i></div></div></ShopifyFrame>;

  return <ShopifyFrame host="dev.shopify.com"><div className="dev-shot"><DevRail active="Apps" /><div className="dev-page install-page"><DevTop /><div className="app-name-row"><span className="app-tile large">AI</span><div><small>App</small><b>AI Store Connector</b></div><span>⌄</span></div><div className="overview-head"><div><h4>Overzicht</h4><p>Bekijk activiteit, versies en installaties van je app.</p></div><button className="shopify-black" tabIndex={-1}>App installeren</button></div><div className="metrics"><section><small>API-status</small><b>Gezond</b><span className="green-dot">●</span></section><section><small>Installaties</small><b>0 actief</b></section></div><section className="dev-card install-card"><h5>App installeren</h5><p>Selecteer de winkel waarop je deze app wilt installeren.</p><label>Winkel<div className="dev-input select"><span>jouw-winkel.myshopify.com</span><span>⌄</span></div></label><div className="permission-note">De app vraagt toegang tot de bereiken uit je vrijgegeven versie.</div><button className="shopify-black" tabIndex={-1}>Installeren</button></section><i className="callout c1">1</i><i className="callout c2">2</i></div></div></ShopifyFrame>;
}

function ShopifyFrame({ host, children }: { host: string; children: React.ReactNode }) {
  return <figure className="shopify-frame" role="img" aria-label={`Privacy-veilige weergave van de actuele Shopify-interface op ${host}`}><div aria-hidden="true"><div className="browser-chrome"><span /><span /><span /><div>🔒 {host}</div></div>{children}</div><figcaption>Actuele, privacy-veilige reconstructie · accountgegevens en geheimen zijn afgeschermd.</figcaption></figure>;
}

function DevTop() {
  return <div className="dev-top"><b><span className="shopify-glyph small">S</span> Dev Dashboard</b><button tabIndex={-1}>Voorbeeldorganisatie⌄</button><span>?</span><span>◉</span></div>;
}

function DevRail({ active }: { active: string }) {
  return <aside className="dev-rail"><b className="shopify-glyph">S</b>{['▦|Apps', '◇|Winkels', '▱|Assortimenten'].map((item) => { const [icon, label] = item.split('|'); return <div className={label === active ? 'active' : ''} key={label}><span>{icon}</span><small>{label}</small></div>; })}</aside>;
}

export default function ShopifyApiGuide() {
  const [scopes, setScopes] = useState<string[]>(starter);
  const [shopInput, setShopInput] = useState('jouw-winkel.myshopify.com');
  const [confirmed, setConfirmed] = useState(false);
  const shopResult = useMemo(() => normalizeShop(shopInput), [shopInput]);
  const normalizedShop = 'domain' in shopResult ? shopResult.domain : '';
  const scopeLine = useMemo(() => allScopes.filter((scope) => scopes.includes(scope)).join(','), [scopes]);
  const sensitiveCount = groups.filter((group) => group.level).flatMap((group) => group.scopes).filter((scope) => scopes.includes(scope.id)).length;
  function toggle(scope: string) { setScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]); }
  function toggleGroup(group: ScopeGroup) { const ids = group.scopes.map((scope) => scope.id); const complete = ids.every((scope) => scopes.includes(scope)); setScopes((current) => complete ? current.filter((scope) => !ids.includes(scope)) : Array.from(new Set([...current, ...ids]))); }

  return <main>
    <header className="topbar"><a className="brand" href="https://agents.dropshipacademy.nl/"><img src="https://slides.dropshipacademy.nl/assets/dsa-logo-white.png" alt="Dropship Academy" /><span>Agents & Skills</span></a><nav aria-label="Pagina"><a href="#stappen">Stappen</a><a href="#rechten">Rechten</a><a href="#veilig">Veiligheid</a><a href="#problemen">Problemen</a></nav><span className="status-pill"><i /> Shopify 2026</span></header>

    <section className="hero" id="top"><div className="eyebrow">Shopify × jouw AI-tool</div><h1>Verbind een Shopify-store.<br /><em>Zonder geheimen te lekken.</em></h1><p className="lede">Maak een app in Shopify, kies de juiste API-rechten en laat jouw AI-tool de koppeling veilig afronden. Deze pagina neemt nooit je sleutel of secret aan.</p><div className="hero-actions"><a className="primary" href="#stappen">Start de handleiding <span>↓</span></a><span className="time">± 15 minuten · geen code nodig</span></div><div className="boundary"><strong>Belangrijk:</strong> dit is een instructiepagina, geen OAuth-server of wachtwoordkluis. De callback-URL en beveiligde secret-invoer komen altijd van jouw eigen AI-tool.</div></section>

    <section className="ai-help" aria-labelledby="ai-help-title"><div className="ai-help-copy"><span className="passport-label">Hulp nodig?</span><h2 id="ai-help-title">Laat je AI-tool veilig meekijken.</h2><p>Plak deze prompt in Claude, ChatGPT of de AI-tool waarmee je werkt. Hij helpt verder zonder om je secrets te vragen.</p><CopyButton value={SUPPORT_PROMPT}>Kopieer hulpprompt</CopyButton></div><pre><code>{SUPPORT_PROMPT}</code></pre></section>

    <section className="passport-wrap" aria-labelledby="passport-title"><div className="passport-copy"><span className="passport-label">Winkelpaspoort</span><h2 id="passport-title">Welke store koppel je?</h2><p>Plak je Shopify Admin-URL óf het permanente <code>.myshopify.com</code>-domein. De converter verwijdert automatisch pagina- en app-paden.</p></div><div className="passport-form"><label htmlFor="shop-domain">Shopify Admin-URL of winkeldomein</label><input id="shop-domain" value={shopInput} placeholder="https://admin.shopify.com/store/jouw-winkel/apps/…" aria-invalid={!normalizedShop} aria-describedby="shop-result" onInput={(event) => { setShopInput(event.currentTarget.value); setConfirmed(false); }} /><div id="shop-result" className={`shop-result ${normalizedShop ? 'shop-result-valid' : 'shop-result-error'}`} aria-live="polite">{normalizedShop ? <><span>{shopResult.source === 'admin' ? 'Admin-URL herkend en opgeschoond' : 'Permanent winkeldomein herkend'}</span><strong>{normalizedShop}</strong></> : <span>{shopResult.error}</span>}</div><label className="confirm-row"><input type="checkbox" checked={confirmed} disabled={!normalizedShop} onChange={(event) => setConfirmed(event.target.checked)} /><span>Ik heb in Shopify gecontroleerd dat <strong>{normalizedShop || 'deze winkel'}</strong> de juiste winkel is.</span></label><span className={confirmed ? 'verified' : 'unverified'}>{confirmed ? '✓ Winkel bevestigd' : normalizedShop ? 'Bevestig vóór je installeert' : 'Eerst een geldige winkel invoeren'}</span></div><p className="passport-rule">AI-regel: sla alleen het opgeschoonde <code>{normalizedShop || 'winkelnaam.myshopify.com'}</code>-domein op en koppel elke tokenreferentie aan dit domein én het project. Bij een andere of onduidelijke store: stop en vraag eerst om bevestiging.</p></section>

    <section className="guide" id="stappen"><header className="section-head"><p className="kicker">Van nul naar koppeling</p><h2>Negen stappen. Eén veilige route.</h2><p>Shopify noemt dit een app. Je bouwt geen complete software; je maakt de beveiligde toegang waarmee jouw AI-tool mag werken.</p></header>
      <article className="step step-wide"><div className="step-copy"><span className="step-number">01</span><p className="kicker">Voor je begint</p><h3>Vraag de URL’s aan jouw AI-tool</h3><p>Je hebt twee HTTPS-adressen nodig: een <strong>App-URL</strong> en een exacte <strong>omleidings- of callback-URL</strong>. De AI-tool moet deze server-route beheren.</p><div className="code-card"><span>Voorbeeld callback — niet blind overnemen</span><code>{CALLBACK}</code><CopyButton value={CALLBACK}>Kopieer voorbeeld</CopyButton></div><div className="note warning"><b>Callback ≠ webhook.</b> Shopify stuurt na toestemming een tijdelijke code naar de callback. Een webhook meldt gebeurtenissen zoals een nieuwe order. Voor OAuth is geen Postgres nodig; een database of secret vault is wél nodig om de verkregen store-token versleuteld te bewaren.</div></div><div className="flow-card" aria-label="OAuth-stroomschema"><div>1 · Jij kiest store</div><span>→</span><div>2 · Shopify vraagt toestemming</div><span>→</span><div>3 · Callback ontvangt code</div><span>→</span><div>4 · Server wisselt code voor token</div></div></article>
      <article className="step"><div className="step-copy"><span className="step-number">02</span><p className="kicker">Shopify Admin</p><h3>Open het Dev Dashboard</h3><p>Ga in de juiste store naar <strong>Instellingen → Apps → Apps ontwikkelen → Apps bouwen in Dev Dashboard.</strong></p><ul className="checklist"><li>Controleer rechtsboven de store en organisatie.</li><li>Klik alleen door wanneer die overeenkomen met je winkelpaspoort.</li></ul></div><div className="screen-sequence"><MiniScreen kind="admin-apps" /><MiniScreen kind="admin-development" /></div></article>
      <article className="step reverse"><div className="step-copy"><span className="step-number">03</span><p className="kicker">Nieuwe app</p><h3>Maak een herkenbare app aan</h3><p>Klik <strong>App aanmaken</strong>, kies <strong>Starten vanuit het Dev Dashboard</strong> en gebruik bijvoorbeeld <code>AI Store Connector</code>. De naam mag anders, maar zet liefst je project of team erin.</p><p className="note">Selecteer de organisatie die eigenaar is van de store. Daarna klik je opnieuw op <strong>App aanmaken</strong>.</p></div><MiniScreen kind="create" /></article>
      <article className="step"><div className="step-copy"><span className="step-number">04</span><p className="kicker">Versie configureren</p><h3>Vul URL’s exact in</h3><p>Open de eerste appversie. Vul bij <strong>App-URL</strong> de basis-URL van jouw AI-tool in en bij <strong>Toegestane omleidings-URL’s</strong> de callback die de tool gaf.</p><ul className="checklist"><li>Gebruik <code>https://</code>.</li><li>Pad, hoofdletters en slash moeten exact overeenkomen.</li><li>Laat “Insluiten in Shopify-beheercentrum” uit voor een externe AI-tool, tenzij de tool expliciet anders zegt.</li><li>Kies de stabiele webhook API-versie die jouw tool ondersteunt.</li></ul></div><MiniScreen kind="config" /></article>
    </section>

    <section className="scope-section" id="rechten"><div className="scope-intro"><p className="kicker">Stap 05 · Rechtenbouwer</p><h2>Kies per taak. Kopieer één regel.</h2><p>Een <code>write_</code>-recht bevat volgens Shopify ook het bijbehorende leesrecht. Vraag niet meer toegang dan nodig.</p><div className="scope-summary"><strong>{scopes.length}</strong><span>geselecteerde rechten</span>{sensitiveCount > 0 && <small>⚠ {sensitiveCount} gevoelige rechten</small>}</div><button className="select-all" onClick={() => setScopes(scopes.length === allScopes.length ? [] : allScopes)}>{scopes.length === allScopes.length ? 'Alles deselecteren' : 'Volledige winkelbediening selecteren'}</button><p className="fineprint">“Alles” is bewust geen standaard. Shopify kan voor beschermde klantdata of bepaalde financiële scopes extra goedkeuring eisen.</p></div><div className="scope-builder">
      {groups.map((group) => { const complete = group.scopes.every((scope) => scopes.includes(scope.id)); return <section className={`scope-group ${group.level ? `level-${group.level}` : ''}`} key={group.id}><header><div><span>{group.level === 'sensitive' ? 'Beschermde data' : group.level === 'approval' ? 'Mogelijk extra toestemming' : 'Taakgroep'}</span><h3>{group.title}</h3><p>{group.summary}</p></div><button type="button" onClick={() => toggleGroup(group)}>{complete ? 'Wis groep' : 'Selecteer alles'}</button></header>{group.scopes.map((scope) => <label className="scope-row" key={scope.id}><input type="checkbox" checked={scopes.includes(scope.id)} onChange={() => toggle(scope.id)} /><span><strong>{scope.label}</strong><small>{scope.detail}</small></span><code>{scope.id}</code></label>)}</section>; })}
      <div className="copy-box"><span>Plak deze regel bij API access → Bereiken selecteren</span><code>{scopeLine || 'Selecteer minimaal één taak'}</code><CopyButton value={scopeLine}>Kopieer Shopify-bereiken</CopyButton></div></div></section>

    <section className="guide continue-guide">
      <article className="step reverse"><div className="step-copy"><span className="step-number">06</span><p className="kicker">Vrijgeven</p><h3>Release de appversie</h3><p>Plak de gemaakte regel in <strong>API access → Bereiken selecteren</strong>. Controleer de URL’s en klik <strong>Vrijgeven</strong>. Je mag de automatisch voorgestelde versienaam gebruiken; een lege beschrijving is prima.</p><div className="note">Later een scope toevoegen? Maak en release een nieuwe versie. De store moet nieuwe toegang opnieuw goedkeuren.</div></div><div className="release-card"><span>CONTROLE VOOR RELEASE</span><label><input type="checkbox" readOnly checked /> Callback is exact</label><label><input type="checkbox" readOnly checked /> Minimale scopes gekozen</label><label><input type="checkbox" readOnly checked /> Geen secret gedeeld</label><button tabIndex={-1}>Vrijgeven</button></div></article>
      <article className="step"><div className="step-copy"><span className="step-number">07</span><p className="kicker">Installeren</p><h3>Kies en bevestig de store</h3><p>Klik linksboven op de appnaam en kies <strong>App installeren</strong>. Selecteer de store uit je winkelpaspoort, bekijk de gevraagde rechten en klik <strong>Installeren</strong>.</p><div className="note warning"><b>Meerdere stores?</b> Nooit gokken. Laat de actieve store zichtbaar zien en vraag vóór elke wijziging om bevestiging. Alleen binnen een project dat aantoonbaar aan één store is gekoppeld, hoeft die vraag niet telkens terug te komen.</div></div><MiniScreen kind="install" /></article>
      <article className="step reverse"><div className="step-copy"><span className="step-number">08</span><p className="kicker">Credentials</p><h3>Geef Client ID en secret veilig door</h3><p>Open in het Dev Dashboard de <strong>appinstellingen</strong>. De AI-tool kan om de Client ID en Client secret vragen. Vul ze uitsluitend in het beveiligde secret-formulier van die tool in.</p><ul className="never-list"><li>Nooit in ChatGPT, Slack, e-mail of een ticket.</li><li>Nooit in frontendcode, screenshots, Git of logs.</li><li>Nooit één store-token hergebruiken voor een andere store.</li></ul></div><div className="credential-stack"><article><span className="safe">Identificatie</span><h4>Client ID</h4><p>Publieke app-identificatie. Nog steeds alleen invoeren waar de tool erom vraagt.</p></article><article><span className="danger">Geheim</span><h4>Client secret</h4><p>Bewijst de identiteit van de app. Alleen server-side en versleuteld bewaren.</p></article><article><span className="temporary">Eenmalig</span><h4>Authorization code</h4><p>Korte code op de callback. De server valideert state + HMAC en wisselt hem om.</p></article><article><span className="danger">Storegeheim</span><h4>Access token</h4><p>Geeft API-toegang binnen de gekozen scopes en hoort bij precies één store.</p></article></div></article>
      <article className="step"><div className="step-copy"><span className="step-number">09</span><p className="kicker">Controleren</p><h3>Begin met een onschuldige lezing</h3><p>Laat de AI-tool na installatie eerst de shopnaam en toegekende scopes opvragen. Vergelijk het teruggegeven <code>myshopify.com</code>-domein met je winkelpaspoort. Pas daarna mag er geschreven worden.</p><div className="success-box"><b>Koppeling geslaagd wanneer:</b><span>✓ installatie actief</span><span>✓ juiste winkel teruggegeven</span><span>✓ verwachte scopes aanwezig</span><span>✓ read-only test slaagt</span></div></div><div className="verify-card"><span>READ-ONLY CHECK</span><code>query {'{'} shop {'{'} name myshopifyDomain {'}'} {'}'}</code><div><i /> Store gevonden</div><div><i /> Domein komt overeen</div><div><i /> Scopes gecontroleerd</div></div></article>
    </section>

    <section className="safety" id="veilig"><div className="section-head"><p className="kicker">Opslagregels voor AI-tools</p><h2>Bewaar een referentie, niet het geheim.</h2><p>De interface toont bijvoorbeeld <code>secret://shopify/project-x/store-y</code>. Alleen de beveiligde backend kan die referentie naar een versleutelde token vertalen.</p></div><div className="safety-grid"><article><span>Versleuteld</span><h3>Secret vault</h3><p>Encryptie tijdens transport én opslag. Sleutels niet naast gewone projectdata bewaren.</p></article><article><span>Gebonden</span><h3>Store + project</h3><p>Bewaar shop domain, Shopify store ID, app ID, scopes en projectreferentie naast de tokenreferentie.</p></article><article><span>Beperkt</span><h3>Toegang & audit</h3><p>Alleen noodzakelijke serverfuncties mogen ontsleutelen. Log wie welke store-actie startte, nooit de token.</p></article><article><span>Herstelbaar</span><h3>Rotatie & intrekken</h3><p>Ondersteun opnieuw koppelen, secret-rotatie en direct blokkeren na uninstall of een 401.</p></article></div></section>

    <section className="troubleshoot" id="problemen"><div className="section-head"><p className="kicker">Als iets niet werkt</p><h2>Vier fouten die je snel herkent.</h2></div><div className="problem-grid"><article><b>redirect_uri mismatch</b><p>De callback verschilt. Kopieer hem opnieuw; controleer HTTPS, pad, hoofdletters en trailing slash.</p></article><article><b>403 / ontbrekende scope</b><p>Voeg alleen het vereiste recht toe, release een nieuwe versie en laat opnieuw goedkeuren.</p></article><article><b>Verkeerde store</b><p>Stop elke schrijfactie. Verwijder de verkeerde credentialreferentie en koppel opnieuw vanuit het juiste winkelpaspoort.</p></article><article><b>401 / token ingetrokken</b><p>Behandel de token als ongeldig. Log geen tokenwaarde; start een nieuwe installatie of OAuth-koppeling.</p></article></div></section>

    <section className="sources"><div><p className="kicker">Officiële bron</p><h2>Bij twijfel wint Shopify.</h2><p>Bijgewerkt op 27 augustus 2026. Shopify kan labels en scopes wijzigen.</p></div><div className="source-links"><a href="https://shopify.dev/docs/apps/build/authentication-authorization" target="_blank" rel="noreferrer">Authenticatie & autorisatie ↗</a><a href="https://shopify.dev/docs/apps/build/authentication-authorization/manage-access-scopes" target="_blank" rel="noreferrer">Access scopes beheren ↗</a><a href="https://shopify.dev/docs/api/usage/access-scopes" target="_blank" rel="noreferrer">Volledige scopesreferentie ↗</a><a href="https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens" target="_blank" rel="noreferrer">Access tokens ↗</a></div></section>
    <footer><a className="brand" href="https://agents.dropshipacademy.nl/"><img src="https://slides.dropshipacademy.nl/assets/dsa-logo-white.png" alt="Dropship Academy" /><span>Agents & Skills</span></a><p>Deel nooit een Client secret of access token met deze pagina.</p><a href="#top">Naar boven ↑</a></footer>
  </main>;
}
