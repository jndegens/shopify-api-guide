'use client';

import { useMemo, useState } from 'react';

type ScopeGroup = { id: string; title: string; summary: string; level?: 'normal' | 'sensitive' | 'approval'; scopes: { id: string; label: string; detail: string }[] };
const APP_URL = 'https://shopify.dev/apps/default-app-home';
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

  if (kind === 'config') return <ShopifyFrame host="dev.shopify.com"><div className="dev-shot"><DevRail active="Apps" /><div className="dev-page config-page"><DevTop /><div className="dev-page-head"><div><a className="back-link">‹ Terug naar versielijstpagina</a><h4>Versie aanmaken</h4></div><button className="shopify-black" tabIndex={-1}>Vrijgeven</button></div><p className="based-on">Gebaseerd op <b>ai-store-connector-1</b> <span>Actief</span></p><section className="dev-card form-card"><h5>URL’s</h5><label>App-URL<div className="dev-input">{APP_URL}</div></label><label className="dev-check"><input type="checkbox" readOnly /> App in het Shopify-beheercentrum insluiten</label><label>URL voor voorkeuren <small>Optioneel</small><div className="dev-input placeholder">https://</div></label></section><section className="dev-card form-card"><h5>Webhooks</h5><label>API-versie<div className="dev-input select">2026-07 <span>⌄</span></div></label></section><section className="dev-card form-card access-card"><h5>API-toegang</h5><label>Bereiken<div className="dev-input">write_products, write_inventory, read_locations…</div></label><button className="secondary-button" tabIndex={-1}>Bereiken selecteren</button></section><i className="callout c1">1</i><i className="callout c2">2</i><i className="callout c3">3</i></div></div></ShopifyFrame>;

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
  const [shopInput, setShopInput] = useState('');
  const shopResult = useMemo(() => normalizeShop(shopInput), [shopInput]);
  const normalizedShop = 'domain' in shopResult ? shopResult.domain : '';
  const scopeLine = useMemo(() => allScopes.filter((scope) => scopes.includes(scope)).join(','), [scopes]);
  const supportPrompt = useMemo(() => `Help mij mijn eigen Shopify-store veilig aan mijn AI-project te koppelen. Begeleid mij stap voor stap vanaf waar ik nu ben.

Mijn store: ${normalizedShop || '[plak eerst je Shopify Admin-URL op de pagina]'}
Gekozen Shopify-bereiken: ${scopeLine || '[kies eerst minimaal één taakgroep op de pagina]'}

Veiligheidsregels:
- Gebruik de client-credentials-flow voor mijn eigen Shopify-organisatie. Hiervoor is geen callback of omleidings-URL nodig.
- Vraag nooit om mijn Client secret of access token in deze chat. Verwijs voor geheimen naar de beveiligde secret-invoer van mijn AI-tool.
- Gebruik bij App-URL de Shopify-standaard ${APP_URL}.
- Laat de backend met Client ID en Client secret server-side een access token aanvragen. Dit token verloopt na 24 uur en moet automatisch opnieuw worden aangevraagd.
- Adviseer alleen de Shopify-scopes die nodig zijn voor mijn taak en leg gevoelige rechten apart uit.
- Vraag bij een fout om de exacte melding of een screenshot waarop secrets en persoonsgegevens zijn afgeschermd.
- Controleer na installatie eerst read-only de shopnaam, het myshopifyDomain en de toegekende scopes. Schrijf pas als de juiste store is bevestigd.

Vraag mij nu bij welke van de vijf stappen ik ben en wat ik precies zie.`, [normalizedShop, scopeLine]);
  const sensitiveCount = groups.filter((group) => group.level).flatMap((group) => group.scopes).filter((scope) => scopes.includes(scope.id)).length;
  function toggle(scope: string) { setScopes((current) => current.includes(scope) ? current.filter((item) => item !== scope) : [...current, scope]); }
  function toggleGroup(group: ScopeGroup) { const ids = group.scopes.map((scope) => scope.id); const complete = ids.every((scope) => scopes.includes(scope)); setScopes((current) => complete ? current.filter((scope) => !ids.includes(scope)) : Array.from(new Set([...current, ...ids]))); }

  return <main>
    <header className="topbar"><a className="brand" href="https://agents.dropshipacademy.nl/"><img src="https://slides.dropshipacademy.nl/assets/dsa-logo-white.png" alt="Dropship Academy" /><span>Agents & Skills</span></a><nav aria-label="Pagina"><a href="#stappen">Stappen</a><a href="#rechten">Rechten</a><a href="#veilig">Veiligheid</a><a href="#problemen">Problemen</a></nav><span className="status-pill"><i /> Shopify 2026</span></header>

    <section className="hero compact-hero" id="top"><div className="eyebrow">Shopify × jouw AI-tool</div><h1>Shopify koppelen.<br /><em>Zonder gedoe.</em></h1><p className="lede">Plak je winkel, kies wat de AI-tool mag doen en volg daarna vijf herkenbare Shopify-schermen. De koppeling blijft werken doordat je AI-tool automatisch een nieuw tijdelijk token aanvraagt.</p></section>

    <section className="setup-generator" aria-labelledby="setup-title"><div className="generator-head"><span className="passport-label">Jouw startpakket</span><h2 id="setup-title">Drie keuzes. Daarna helpt je AI-tool verder.</h2><p>Deze pagina ontvangt of bewaart geen API-geheimen.</p></div><div className="generator-grid"><article><span className="generator-number">1</span><h3>Plak je Shopify-URL</h3><label className="prompt-store" htmlFor="shop-domain"><span>Admin-URL of .myshopify.com</span><input id="shop-domain" value={shopInput} placeholder="https://admin.shopify.com/store/jouw-winkel/apps/…" aria-invalid={shopInput.length > 0 && !normalizedShop} aria-describedby="shop-result" onInput={(event) => setShopInput(event.currentTarget.value)} /><span id="shop-result" className={normalizedShop ? 'shop-valid' : 'shop-hint'} aria-live="polite">{normalizedShop ? `✓ Herkend: ${normalizedShop}` : shopInput ? shopResult.error : 'Ook lange Admin-URL’s worden automatisch opgeschoond.'}</span></label></article><article><span className="generator-number">2</span><h3>Kies wat de AI-tool mag</h3><div className="preset-grid">{groups.map((group) => { const complete = group.scopes.every((scope) => scopes.includes(scope.id)); return <button key={group.id} type="button" className={complete ? 'active' : ''} onClick={() => toggleGroup(group)} aria-pressed={complete}><span>{complete ? '✓' : '+'}</span>{group.title}</button>; })}</div><a className="detail-link" href="#rechten">Rechten per stuk bekijken ↓</a></article><article className="prompt-ticket"><span className="generator-number">3</span><h3>Kopieer je startprompt</h3><p><b>{normalizedShop || 'Je winkel'}</b><br />{scopes.length} Shopify-bereiken geselecteerd</p><CopyButton value={supportPrompt}>Kopieer prompt voor AI-tool</CopyButton><details><summary>Bekijk de prompt</summary><pre><code>{supportPrompt}</code></pre></details></article></div><div className="token-clarity"><b>Een blijvende koppeling, geen eeuwige losse key.</b><span>Je Client ID en Client secret blijven veilig opgeslagen; je AI-tool vernieuwt het access token automatisch.</span></div></section>

    <section className="guide" id="stappen"><header className="section-head"><p className="kicker">Klikroute in Shopify</p><h2>Vijf duidelijke stappen.</h2><p>Volg de nummers. De schermen zijn nagemaakt zoals je ze in Shopify tegenkomt.</p></header>
      <article className="step step-wide"><div className="step-copy"><span className="step-number">01</span><p className="kicker">Shopify Admin</p><h3>Open het Dev Dashboard</h3><p>Ga in je store naar <strong>Instellingen → Apps → Apps ontwikkelen → Apps bouwen in Dev Dashboard.</strong></p><div className="note warning">Deel nooit je Client secret of access token in een chat. Vul geheimen later alleen in het beveiligde secret-formulier van je AI-tool in.</div></div><div className="screen-sequence"><MiniScreen kind="admin-apps" /><MiniScreen kind="admin-development" /></div></article>
      <article className="step reverse"><div className="step-copy"><span className="step-number">02</span><p className="kicker">Nieuwe app</p><h3>Maak een herkenbare app aan</h3><p>Klik <strong>App aanmaken</strong>, kies <strong>Starten vanuit het Dev Dashboard</strong> en gebruik bijvoorbeeld <code>AI Store Connector</code>. De naam mag anders, maar zet liefst je project of team erin.</p><p className="note">Selecteer de organisatie die eigenaar is van de store. Daarna klik je opnieuw op App aanmaken.</p></div><MiniScreen kind="create" /></article>
      <article className="step"><div className="step-copy"><span className="step-number">03</span><p className="kicker">Rechten en release</p><h3>Kies de bereiken en geef vrij</h3><p>Maak een versie aan, laat de standaard App-URL staan en kies bij <strong>API-toegang</strong> de bereiken uit de rechtenbouwer hieronder. Klik daarna op <strong>Vrijgeven</strong>. De versienaam mag automatisch blijven; de beschrijving mag leeg.</p><div className="note">Geen webhook of omleidings-URL nodig voor deze koppeling met je eigen organisatie.</div></div><MiniScreen kind="config" /></article>
    </section>

    <section className="scope-section" id="rechten"><div className="scope-intro"><p className="kicker">Hoort bij stap 03</p><h2>Kies per taak. Kopieer één regel.</h2><p>Een <code>write_</code>-recht bevat volgens Shopify ook het bijbehorende leesrecht. Vraag niet meer toegang dan nodig.</p><div className="scope-summary"><strong>{scopes.length}</strong><span>geselecteerde rechten</span>{sensitiveCount > 0 && <small>⚠ {sensitiveCount} gevoelige rechten</small>}</div><button className="select-all" onClick={() => setScopes(scopes.length === allScopes.length ? [] : allScopes)}>{scopes.length === allScopes.length ? 'Alles deselecteren' : 'Alle taakgroepen op deze pagina selecteren'}</button><p className="fineprint">“Alles” is bewust geen standaard. Shopify kan voor beschermde klantdata of bepaalde financiële scopes extra goedkeuring eisen.</p></div><div className="scope-builder">
      {groups.map((group) => { const complete = group.scopes.every((scope) => scopes.includes(scope.id)); return <section className={`scope-group ${group.level ? `level-${group.level}` : ''}`} key={group.id}><header><div><span>{group.level === 'sensitive' ? 'Beschermde data' : group.level === 'approval' ? 'Mogelijk extra toestemming' : 'Taakgroep'}</span><h3>{group.title}</h3><p>{group.summary}</p></div><button type="button" onClick={() => toggleGroup(group)}>{complete ? 'Wis groep' : 'Selecteer alles'}</button></header>{group.scopes.map((scope) => <label className="scope-row" key={scope.id}><input type="checkbox" checked={scopes.includes(scope.id)} onChange={() => toggle(scope.id)} /><span><strong>{scope.label}</strong><small>{scope.detail}</small></span><code>{scope.id}</code></label>)}</section>; })}
      <div className="copy-box"><span>Plak deze regel bij API access → Bereiken selecteren</span><code>{scopeLine || 'Selecteer minimaal één taak'}</code><CopyButton value={scopeLine}>Kopieer Shopify-bereiken</CopyButton></div></div></section>

    <section className="guide continue-guide">
      <article className="step"><div className="step-copy"><span className="step-number">04</span><p className="kicker">Installeren</p><h3>Kies je store en installeer</h3><p>Klik linksboven op de appnaam en kies <strong>App installeren</strong>. Selecteer je store, bekijk de gevraagde rechten en klik <strong>Installeren</strong>.</p><div className="note warning"><b>Meerdere stores?</b> Laat de actieve store vóór elke wijziging zichtbaar bevestigen. Binnen een project dat aantoonbaar aan één store is gekoppeld hoeft dat niet telkens opnieuw.</div></div><MiniScreen kind="install" /></article>
      <article className="step reverse final-step"><div className="step-copy"><span className="step-number">05</span><p className="kicker">Veilig koppelen en controleren</p><h3>Geef je AI-tool de credentials</h3><p>Open de <strong>appinstellingen</strong>. Vul Client ID en Client secret uitsluitend in de beveiligde secret-invoer van je AI-tool in — nooit in de chat. Laat daarna eerst read-only de shopnaam, het domein en de scopes controleren. Pas na jouw bevestiging mag er geschreven worden.</p><ul className="never-list"><li>Nooit in chat, e-mail, screenshots, Git of logs.</li><li>Nooit credentials tussen stores hergebruiken.</li><li>Bij een tweede store altijd opnieuw het domein bevestigen.</li></ul></div><div className="final-check"><div className="credential-stack"><article><span className="safe">Identificatie</span><h4>Client ID</h4><p>Hoort bij deze app.</p></article><article><span className="danger">Geheim</span><h4>Client secret</h4><p>Alleen via beveiligde secret-invoer.</p></article><article><span className="danger">24 uur</span><h4>Access token</h4><p>Wordt automatisch vernieuwd.</p></article></div><div className="verify-card"><span>READ-ONLY CHECK</span><code>query {'{'} shop {'{'} name myshopifyDomain {'}'} {'}'}</code><div><i /> Store gevonden</div><div><i /> Domein komt overeen</div><div><i /> Scopes gecontroleerd</div></div></div></article>
    </section>

    <section className="safety" id="veilig"><div className="section-head"><p className="kicker">Opslagregels voor AI-tools</p><h2>Bewaar een referentie, niet het geheim.</h2><p>De interface toont bijvoorbeeld <code>secret://shopify/project-x/store-y</code>. Alleen de beveiligde backend kan die referentie openen. Bewaar Client ID en secret veilig en behandel het 24-uurs token als kortlevende cache.</p></div><div className="safety-grid"><article><span>Versleuteld</span><h3>Secret vault</h3><p>Encryptie tijdens transport én opslag. Secrets niet naast gewone projectdata bewaren.</p></article><article><span>Gebonden</span><h3>Store + project</h3><p>Bewaar shop domain, Shopify store ID, app ID, scopes en projectreferentie naast de credentialreferentie.</p></article><article><span>Beperkt</span><h3>Toegang & audit</h3><p>Alleen noodzakelijke serverfuncties mogen geheimen openen. Log wie welke store-actie startte, nooit credentials of tokens.</p></article><article><span>Herstelbaar</span><h3>Vernieuwen & roteren</h3><p>Vraag een nieuw token aan na verloop of een 401. Roteer het Client secret gecontroleerd.</p></article></div></section>

    <section className="troubleshoot" id="problemen"><div className="section-head"><p className="kicker">Als iets niet werkt</p><h2>Vier fouten die je snel herkent.</h2></div><div className="problem-grid"><article><b>Token verlopen</b><p>Een client-credentialstoken verloopt na 24 uur. Laat de backend een nieuw token aanvragen; voeg geen callback toe.</p></article><article><b>403 / ontbrekende scope</b><p>Voeg alleen het vereiste recht toe, release een nieuwe versie en laat opnieuw goedkeuren.</p></article><article><b>Verkeerde store</b><p>Stop elke schrijfactie. Verwijder de verkeerde credentialreferentie en koppel opnieuw met het juiste <code>myshopify.com</code>-domein.</p></article><article><b>401 / toegang ongeldig</b><p>Log geen tokenwaarde. Vraag server-side een nieuw token aan en controleer installatie en scopes.</p></article></div></section>

    <section className="sources"><div><p className="kicker">Officiële bron</p><h2>Bij twijfel wint Shopify.</h2><p>Bijgewerkt op 27 augustus 2026. Shopify kan labels, flows en scopes wijzigen.</p></div><div className="source-links"><a href="https://shopify.dev/docs/apps/build/dev-dashboard/create-apps-using-dev-dashboard" target="_blank" rel="noreferrer">Apps maken in Dev Dashboard ↗</a><a href="https://shopify.dev/docs/apps/build/authentication-authorization" target="_blank" rel="noreferrer">Authenticatie & autorisatie ↗</a><a href="https://shopify.dev/docs/apps/build/authentication-authorization/client-credentials-grant" target="_blank" rel="noreferrer">Client credentials ↗</a><a href="https://shopify.dev/docs/apps/build/authentication-authorization/manage-access-scopes" target="_blank" rel="noreferrer">Access scopes beheren ↗</a><a href="https://shopify.dev/docs/api/usage/access-scopes" target="_blank" rel="noreferrer">Volledige scopesreferentie ↗</a></div></section>
    <footer><a className="brand" href="https://agents.dropshipacademy.nl/"><img src="https://slides.dropshipacademy.nl/assets/dsa-logo-white.png" alt="Dropship Academy" /><span>Agents & Skills</span></a><p>Deel nooit een Client secret of access token met deze pagina.</p><a href="#top">Naar boven ↑</a></footer>
  </main>;
}
