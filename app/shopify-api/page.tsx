'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const APP_URL = 'https://agents.dropshipacademy.nl/shopify-api';
const REDIRECT_URL = 'https://agents.dropshipacademy.nl/shopify-api/callback';
const ALL_SCOPES = `read_all_orders,read_analytics,read_analytics_annotations,write_analytics_annotations,read_app_proxy,write_app_proxy,read_apps,read_assigned_fulfillment_orders,write_assigned_fulfillment_orders,read_audit_events,read_customer_events,read_cart_transforms,write_cart_transforms,read_all_cart_transforms,read_validations,write_validations,read_cash_tracking,write_cash_tracking,read_channels,write_channels,read_checkout_kit_enhanced_buyer_events,read_checkout_and_accounts_configurations,write_checkout_and_accounts_configurations,read_checkout_branding_settings,write_checkout_branding_settings,write_checkouts,read_checkouts,read_companies,write_companies,read_custom_fulfillment_services,write_custom_fulfillment_services,read_custom_pixels,write_custom_pixels,read_customers,write_customers,read_customer_data_erasure,write_customer_data_erasure,read_customer_payment_methods,read_customer_merge,write_customer_merge,read_delivery_customizations,write_delivery_customizations,read_price_rules,write_price_rules,read_discounts,write_discounts,read_discounts_allocator_functions,write_discounts_allocator_functions,read_discovery,write_discovery,write_draft_orders,read_draft_orders,read_files,write_files,read_fulfillment_constraint_rules,write_fulfillment_constraint_rules,read_fulfillments,write_fulfillments,read_gift_card_transactions,write_gift_card_transactions,read_gift_cards,write_gift_cards,write_inventory,read_inventory,write_inventory_shipments,read_inventory_shipments,write_inventory_shipments_received_items,read_inventory_shipments_received_items,write_inventory_transfers,read_inventory_transfers,read_legal_policies,write_legal_policies,read_delivery_option_generators,write_delivery_option_generators,read_locales,write_locales,write_locations,read_locations,read_marketing_integrated_campaigns,write_marketing_integrated_campaigns,write_marketing_events,read_marketing_events,read_markets,write_markets,read_markets_home,write_markets_home,read_merchant_managed_fulfillment_orders,write_merchant_managed_fulfillment_orders,read_metaobject_definitions,write_metaobject_definitions,read_metaobjects,write_metaobjects,read_online_store_navigation,write_online_store_navigation,read_online_store_pages,write_online_store_pages,write_order_edits,read_order_edits,read_orders,write_orders,write_packing_slip_templates,read_packing_slip_templates,write_payment_mandate,read_payment_mandate,read_payment_notifications,write_payment_notifications,read_payment_terms,write_payment_terms,read_payment_customizations,write_payment_customizations,read_privacy_settings,write_privacy_settings,read_product_feeds,write_product_feeds,read_product_listings,write_product_listings,read_products,write_products,read_publications,write_publications,read_purchase_options,write_purchase_options,write_reports,read_reports,read_resource_feedbacks,write_resource_feedbacks,read_returns,write_returns,read_script_tags,write_script_tags,read_shopify_payments_provider_accounts_sensitive,read_shipping,write_shipping,read_shopify_payments_accounts,read_shopify_payments_payouts,read_shopify_payments_bank_accounts,read_shopify_payments_disputes,write_shopify_payments_disputes,read_content,write_content,read_store_credit_account_transactions,write_store_credit_account_transactions,read_store_credit_accounts,write_own_subscription_contracts,read_own_subscription_contracts,write_theme_code,read_themes,write_themes,read_third_party_fulfillment_orders,write_third_party_fulfillment_orders,read_translations,write_translations,read_pixels,write_pixels`.split(',');

const groupDefinitions = [
  { id: 'products', title: 'Producten & voorraad', hint: 'Producten, listings, publicaties, voorraad en locaties', match: ['product', 'publication', 'inventory', 'location', 'purchase_option'] },
  { id: 'orders', title: 'Orders & fulfillment', hint: 'Orders, verzending, retouren en fulfillment', match: ['order', 'fulfillment', 'return', 'shipping', 'delivery_option', 'packing_slip'] },
  { id: 'customers', title: 'Klanten & B2B', hint: 'Klanten, bedrijven, klantdata en store credit', match: ['customer', 'companies', 'store_credit', 'subscription_contract'] },
  { id: 'marketing', title: 'Kortingen & markten', hint: 'Kortingen, marketing, kanalen en markten', match: ['discount', 'price_rule', 'marketing', 'market', 'channel', 'discovery'] },
  { id: 'content', title: 'Content & thema', hint: 'Content, bestanden, thema, vertalingen en pixels', match: ['content', 'file', 'theme', 'translation', 'locale', 'online_store', 'metaobject', 'script_tag', 'pixel', 'legal_polic'] },
  { id: 'checkout', title: 'Checkout & betalingen', hint: 'Checkout, validaties, delivery en payment settings', match: ['checkout', 'cart_transform', 'validation', 'delivery_customization', 'payment_customization', 'payment_term', 'payment_mandate', 'payment_notification', 'privacy_setting'] },
  { id: 'finance', title: 'Financiën', hint: 'Shopify Payments, payouts, disputes en gift cards', match: ['shopify_payments', 'cash_tracking', 'gift_card'] },
  { id: 'platform', title: 'Apps & analytics', hint: 'Analytics, app proxy, rapporten en overige platformrechten', match: [] },
] as const;

function groupForScope(scope: string) {
  return groupDefinitions.find((group) => group.id !== 'platform' && group.match.some((part) => scope.includes(part)))?.id || 'platform';
}
const bundles = groupDefinitions.map((group) => ({ ...group, scopes: ALL_SCOPES.filter((scope) => groupForScope(scope) === group.id) }));
const allBundleIds = bundles.map((bundle) => bundle.id);

function normalizeShop(value: string) {
  const input = value.trim();
  if (!input) return { domain: '', error: '' };
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    if (host === 'admin.shopify.com') {
      const match = url.pathname.match(/^\/store\/([a-z0-9][a-z0-9-]*)(?:\/|$)/i);
      return match ? { domain: `${match[1].toLowerCase()}.myshopify.com`, error: '' } : { domain: '', error: 'Kopieer een Admin-URL waarin /store/winkelnaam staat.' };
    }
    if (/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i.test(host)) return { domain: host, error: '' };
    return { domain: '', error: 'Gebruik je Shopify Admin-URL of je .myshopify.com-domein.' };
  } catch { return { domain: '', error: 'Deze URL wordt niet herkend. Kopieer hem opnieuw uit Shopify.' }; }
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(value); setCopied(true); window.setTimeout(() => setCopied(false), 1600); }
  return <button type="button" className="copy" onClick={copy} disabled={!value}>{copied ? 'Gekopieerd ✓' : label}</button>;
}

type HelpKey = 'app' | 'scopes' | 'admin-url' | 'client-id' | 'install' | 'token';
const helpContent: Record<HelpKey, { title: string; intro: string; steps: string[]; video: string }> = {
  app: { title: 'Waar maak je de app?', intro: 'Je begint altijd in de Shopify Admin van de store die je wilt koppelen.', steps: ['Klik linksonder op Instellingen.', 'Open Apps en verkoopkanalen.', 'Klik Apps ontwikkelen en daarna Apps bouwen in Dev Dashboard.', 'Maak een app en vervolgens een nieuwe versie.'], video: 'Video: app aanmaken' },
  scopes: { title: 'Waar plak je de scopes?', intro: 'De scopes horen in de versie van je app, onder API-toegang.', steps: ['Open je app in het Dev Dashboard.', 'Open de versie of klik Versie aanmaken.', 'Ga naar API-toegang en kies Bereiken selecteren.', 'Selecteer de gekopieerde scopes en klik rechtsboven op Vrijgeven.'], video: 'Video: scopes en versie vrijgeven' },
  'admin-url': { title: 'Waar vind je de Shopify Admin-URL?', intro: 'Dit is gewoon de URL die boven in je browser staat terwijl je Shopify beheert.', steps: ['Open de juiste Shopify-store.', 'Kopieer de volledige URL uit de adresbalk.', 'Een URL zoals admin.shopify.com/store/jouw-store/apps/... is goed.', 'Plak hem in stap 2; wij halen automatisch het permanente winkeldomein eruit.'], video: 'Video: Admin-URL kopiëren' },
  'client-id': { title: 'Waar vind je de Client ID?', intro: 'De Client ID staat bij de inloggegevens van de app in het Shopify Dev Dashboard.', steps: ['Open Apps in het Dev Dashboard.', 'Klik op de app die je zojuist hebt gemaakt.', 'Open Instellingen en daarna Credentials of Inloggegevens.', 'Kopieer alleen de Client ID. Deel je Client secret nog nergens.'], video: 'Video: Client ID vinden' },
  install: { title: 'Waar installeer je de app?', intro: 'Je installeert via de persoonlijke link die stap 2 voor je maakt.', steps: ['Klik op Maak mijn installatielink.', 'Klik daarna op Open in Shopify.', 'Controleer bovenaan of de juiste store staat geselecteerd.', 'Bekijk de rechten en klik onderaan op Installeren.'], video: 'Video: app installeren' },
  token: { title: 'Hoe krijg je de API-token?', intro: 'Na Installeren brengt Shopify je automatisch terug naar onze beveiligde terugkeerpagina.', steps: ['Open in het Dev Dashboard de Credentials van dezelfde app.', 'Kopieer de Client secret.', 'Plak hem alleen in het beveiligde veld op de terugkeerpagina.', 'Klik Token maken en sla de token direct op als secret van deze store.'], video: 'Video: token veilig ophalen' },
};

function HelpButton({ topic, open }: { topic: HelpKey; open: (topic: HelpKey) => void }) {
  return <button type="button" className="help-button" onClick={() => open(topic)}><span>?</span> Meer uitleg</button>;
}

function HelpModal({ topic, close }: { topic: HelpKey | null; close: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!topic) return;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = oldOverflow; window.removeEventListener('keydown', onKey); };
  }, [topic, close]);
  if (!topic) return null;
  const content = helpContent[topic];
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}><section className="help-modal" role="dialog" aria-modal="true" aria-labelledby="help-title"><button ref={closeRef} type="button" className="modal-close" onClick={close} aria-label="Sluiten">×</button><p className="eyebrow">EXTRA UITLEG</p><h2 id="help-title">{content.title}</h2><p className="modal-intro">{content.intro}</p><ol>{content.steps.map((step) => <li key={step}>{step}</li>)}</ol><div className="mini-video"><span>▶</span><div><strong>{content.video}</strong><small>Ruimte voor jouw korte instructievideo</small></div></div></section></div>;
}

export default function ShopifyApiPage() {
  const [shopInput, setShopInput] = useState('');
  const [clientId, setClientId] = useState('');
  const [selected, setSelected] = useState<string[]>(allBundleIds);
  const [authorizationUrl, setAuthorizationUrl] = useState('');
  const [helpTopic, setHelpTopic] = useState<HelpKey | null>(null);
  const shop = useMemo(() => normalizeShop(shopInput), [shopInput]);
  const scopes = useMemo(() => bundles.filter((bundle) => selected.includes(bundle.id)).flatMap((bundle) => bundle.scopes).join(','), [selected]);
  const scopeCount = scopes ? scopes.split(',').length : 0;
  const canGenerate = Boolean(shop.domain && clientId.trim() && scopes);

  function toggle(id: string) { setAuthorizationUrl(''); setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function generateAuthorizationUrl() {
    if (!canGenerate) return;
    const state = crypto.randomUUID();
    sessionStorage.setItem('dsa-shopify-oauth', JSON.stringify({ state, shop: shop.domain, clientId: clientId.trim(), scopes, createdAt: Date.now() }));
    const url = new URL(`https://${shop.domain}/admin/oauth/authorize`);
    url.searchParams.set('client_id', clientId.trim()); url.searchParams.set('scope', scopes); url.searchParams.set('redirect_uri', REDIRECT_URL); url.searchParams.set('state', state);
    setAuthorizationUrl(url.toString());
  }
  const openHelp = (topic: HelpKey) => setHelpTopic(topic);
  return <main>
    <header className="site-header"><a href="https://agents.dropshipacademy.nl/" className="brand"><span>DSA</span> Agents & Skills</a><span className="status"><i /> Shopify API</span></header>
    <section className="hero compact-hero"><p className="eyebrow">SHOPIFY API · 4 KORTE STAPPEN</p><h1>Je Shopify API-token.<br/><em>In vier duidelijke stappen.</em></h1><p>Volg de video of doe de vier acties hieronder. De pagina maakt de juiste OAuth-link en brengt je na installatie terug voor je token.</p><div className="hero-video"><div className="video-play">▶</div><div><strong>Volledige videohandleiding</strong><span>16:9 ruimte voor jouw video</span></div></div><div className="route-grid" aria-label="Vier stappen"><div><b>01</b><strong>App maken</strong><span>URL&apos;s, scopes, vrijgeven</span></div><div><b>02</b><strong>Link maken</strong><span>Admin-URL + Client ID</span></div><div><b>03</b><strong>Installeren</strong><span>Openen en goedkeuren</span></div><div><b>04</b><strong>Token opslaan</strong><span>Secret invullen, klaar</span></div></div></section>
    <section className="wizard-shell" id="stappen">
      <article className="wizard-step"><div className="step-number">01</div><div className="step-body"><div className="step-title"><div><p className="eyebrow dark">EENMALIG IN SHOPIFY</p><h2>Maak de app klaar</h2></div><HelpButton topic="app" open={openHelp} /></div>
        <ol className="short-steps"><li><b>Ga naar</b><span>Instellingen → Apps en verkoopkanalen → Apps ontwikkelen → Apps bouwen in Dev Dashboard.</span></li><li><b>Maak aan</b><span>Klik <strong>App aanmaken</strong>, geef hem een naam en klik daarna <strong>Versie aanmaken</strong>.</span></li><li><b>Vul in</b><span>Kopieer de App-URL, omleidings-URL en scopes hieronder naar de nieuwe versie.</span></li><li><b>Publiceer</b><span>Klik rechtsboven op <strong>Vrijgeven</strong>. Zonder vrijgegeven versie werkt de installatielink niet.</span></li></ol>
        <div className="values-stack"><div><span>APP-URL</span><code>{APP_URL}</code><CopyButton value={APP_URL} label="Kopieer" /></div><div><span>TOEGESTANE OMLEIDINGS-URL</span><code>{REDIRECT_URL}</code><CopyButton value={REDIRECT_URL} label="Kopieer" /></div></div>
        <div className="scope-picker"><div className="picker-head"><div><strong>Kies de API-rechten</strong><p>Alle 8 groepen staan standaard aan. Dit zijn alle {ALL_SCOPES.length} Admin API-scopes die het huidige Dev Dashboard toont.</p></div><div className="picker-actions"><HelpButton topic="scopes" open={openHelp} /><button type="button" onClick={() => { setSelected(selected.length === bundles.length ? [] : allBundleIds); setAuthorizationUrl(''); }}>{selected.length === bundles.length ? 'Wis alles' : 'Selecteer alle 8'}</button></div></div><div className="bundle-grid">{bundles.map((bundle) => <button type="button" aria-pressed={selected.includes(bundle.id)} className={selected.includes(bundle.id) ? 'bundle active' : 'bundle'} key={bundle.id} onClick={() => toggle(bundle.id)}><i aria-hidden="true">{selected.includes(bundle.id) ? '✓' : '+'}</i><span><strong>{bundle.title}</strong><small>{bundle.hint} · {bundle.scopes.length} scopes</small></span></button>)}</div><div className="scope-output"><span>{scopeCount} SHOPIFY ADMIN API-SCOPES</span><code>{scopes || 'Selecteer minimaal één groep'}</code><CopyButton value={scopes} label={`Kopieer ${scopeCount} scopes`} /></div><div className="publish-callout"><span>LAATSTE KLIK IN DEZE STAP</span><strong>Klik rechtsboven op Vrijgeven</strong><p>Pas daarna kan Shopify deze rechten tijdens de installatie tonen.</p></div><p className="scope-warning"><strong>Testomgeving:</strong> de lijst bevat ook beschermde scopes. Shopify kan voor sommige rechten aanvullende goedkeuring of winkelinstellingen vragen. Verwijder een groep als Shopify Vrijgeven blokkeert.</p></div>
      </div></article>
      <article className="wizard-step dark-step"><div className="step-number">02</div><div className="step-body"><div className="step-title"><div><p className="eyebrow">MAAK DE INSTALLATIELINK</p><h2>Vul twee dingen in</h2></div></div><div className="link-form"><label><span>1 · Shopify Admin-URL</span><small>Shopify Admin → kopieer de volledige URL uit je adresbalk</small><div className="field-help"><input value={shopInput} onChange={(event) => { setShopInput(event.target.value); setAuthorizationUrl(''); }} placeholder="https://admin.shopify.com/store/jouw-store/apps/..." autoComplete="off" /><HelpButton topic="admin-url" open={openHelp} /></div></label>{shop.error && <p className="field-message error">{shop.error}</p>}{shop.domain && <p className="field-message success">Store herkend: <strong>{shop.domain}</strong></p>}<label><span>2 · Client ID</span><small>Dev Dashboard → jouw app → Instellingen → Credentials → Client ID</small><div className="field-help"><input value={clientId} onChange={(event) => { setClientId(event.target.value); setAuthorizationUrl(''); }} placeholder="Plak hier je Client ID" autoComplete="off" /><HelpButton topic="client-id" open={openHelp} /></div></label><p className="microcopy">Gebruik hier alleen de Client ID. Je Client secret blijft geheim tot de laatste stap.</p><button type="button" className="authorize" disabled={!canGenerate} onClick={generateAuthorizationUrl}>Maak mijn installatielink <span>→</span></button>{authorizationUrl && <div className="generated-link"><span>JOUW INSTALLATIELINK IS KLAAR</span><code>{authorizationUrl}</code><div><CopyButton value={authorizationUrl} label="Kopieer link" /><a href={authorizationUrl}>Open in Shopify →</a></div></div>}</div></div></article>
      <article className="wizard-step"><div className="step-number">03</div><div className="step-body"><div className="step-title"><div><p className="eyebrow dark">IN SHOPIFY</p><h2>Open de link en installeer</h2></div><HelpButton topic="install" open={openHelp} /></div><div className="single-action"><b>Waar klik je?</b><p>Klik bij de gemaakte link op <strong>Open in Shopify</strong>. Controleer de store, bekijk de rechten en klik onderaan de Shopify-pagina op <strong>Installeren</strong>.</p></div></div></article>
      <article className="wizard-step final-step"><div className="step-number">04</div><div className="step-body"><div className="step-title"><div><p className="eyebrow dark">AUTOMATISCH TERUG</p><h2>Vul je secret in en kopieer de token</h2></div><HelpButton topic="token" open={openHelp} /></div><div className="single-action"><b>Na Installeren kom je automatisch terug.</b><p>Vul op de terugkeerpagina je <strong>Client secret</strong> in en klik op <strong>Token maken</strong>. Kopieer de token direct naar de beveiligde secret-invoer van je project.</p></div><aside className="security"><strong>Nooit delen of hergebruiken</strong><p>Zet een Client secret of access token nooit in chat, screenshots, e-mail, Git of logs. Gebruik je meerdere stores? Bewaar per token altijd het bijbehorende <code>.myshopify.com</code>-domein.</p></aside></div></article>
    </section>
    <footer><span>DSA Agents & Skills</span><p>Shopify Admin API · OAuth offline access token</p></footer><HelpModal topic={helpTopic} close={() => setHelpTopic(null)} />
  </main>;
}
