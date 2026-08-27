'use client';

import { useMemo, useState } from 'react';

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

export default function ShopifyApiPage() {
  const [shopInput, setShopInput] = useState('');
  const [clientId, setClientId] = useState('');
  const [selected, setSelected] = useState<string[]>(allBundleIds);
  const [authorizationUrl, setAuthorizationUrl] = useState('');
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
  const aiPrompt = `Help mij deze Shopify-koppeling in één keer af te ronden via ${APP_URL}. Geef per bericht één kort actieblok met alle kliks die ik achter elkaar kan doen. Pauzeer alleen wanneer ik iets moet invullen, kopiëren of wanneer mijn scherm afwijkt. Laat mij nooit een Client secret of access token in de chat zetten. Mijn doel: app aanmaken, de URL's en alle gekozen Admin API-scopes invullen, versie vrijgeven, installatielink maken, app goedkeuren en de offline access token veilig opslaan.`;

  return <main>
    <header className="site-header"><a href="https://agents.dropshipacademy.nl/" className="brand"><span>DSA</span> Agents & Skills</a><span className="status"><i /> Shopify API</span></header>
    <section className="hero compact-hero"><p className="eyebrow">SHOPIFY API · 4 KORTE STAPPEN</p><h1>Van Shopify-app naar API-token.</h1><p>Vul de vaste gegevens in, maak je installatielink en laat Shopify je automatisch terugbrengen. Meer is het niet.</p><div className="progress-line" aria-label="Vier stappen"><span className="active">1 · App</span><span>2 · Link</span><span>3 · Installeren</span><span>4 · Token</span></div></section>
    <section className="ai-strip"><div><span>LOOP JE VAST?</span><strong>Kopieer één prompt naar je AI-tool</strong><p>De AI-tool geeft acties in korte blokken en stopt alleen als jij iets moet invullen.</p></div><CopyButton value={aiPrompt} label="Kopieer prompt" /></section>
    <section className="wizard-shell" id="stappen">
      <article className="wizard-step"><div className="step-number">01</div><div className="step-body"><p className="eyebrow dark">EENMALIG IN SHOPIFY</p><h2>Maak de app klaar</h2>
        <ol className="short-steps"><li><b>Ga naar</b><span>Instellingen → Apps en verkoopkanalen → Apps ontwikkelen → Apps bouwen in Dev Dashboard.</span></li><li><b>Maak aan</b><span>Klik <strong>App aanmaken</strong>, geef hem een naam en klik daarna <strong>Versie aanmaken</strong>.</span></li><li><b>Vul in</b><span>Kopieer de App-URL, omleidings-URL en scopes hieronder naar de nieuwe versie.</span></li><li><b>Publiceer</b><span>Klik rechtsboven op <strong>Vrijgeven</strong>. Zonder vrijgegeven versie werkt de installatielink niet.</span></li></ol>
        <div className="values-stack"><div><span>APP-URL</span><code>{APP_URL}</code><CopyButton value={APP_URL} label="Kopieer" /></div><div><span>TOEGESTANE OMLEIDINGS-URL</span><code>{REDIRECT_URL}</code><CopyButton value={REDIRECT_URL} label="Kopieer" /></div></div>
        <div className="scope-picker"><div className="picker-head"><div><strong>Kies de API-rechten</strong><p>Alle 8 groepen staan standaard aan. Dit zijn alle {ALL_SCOPES.length} Admin API-scopes die het huidige Dev Dashboard toont.</p></div><button type="button" onClick={() => { setSelected(selected.length === bundles.length ? [] : allBundleIds); setAuthorizationUrl(''); }}>{selected.length === bundles.length ? 'Wis alles' : 'Selecteer alle 8'}</button></div><div className="bundle-grid">{bundles.map((bundle) => <button type="button" aria-pressed={selected.includes(bundle.id)} className={selected.includes(bundle.id) ? 'bundle active' : 'bundle'} key={bundle.id} onClick={() => toggle(bundle.id)}><i aria-hidden="true">{selected.includes(bundle.id) ? '✓' : '+'}</i><span><strong>{bundle.title}</strong><small>{bundle.hint} · {bundle.scopes.length} scopes</small></span></button>)}</div><div className="scope-output"><span>{scopeCount} SHOPIFY ADMIN API-SCOPES</span><code>{scopes || 'Selecteer minimaal één groep'}</code><CopyButton value={scopes} label={`Kopieer ${scopeCount} scopes`} /></div><p className="scope-warning"><strong>Testomgeving:</strong> de lijst bevat ook beschermde scopes. Shopify kan voor sommige rechten aanvullende goedkeuring of winkelinstellingen vragen. Verwijder een groep als Shopify Vrijgeven blokkeert.</p></div>
      </div></article>
      <article className="wizard-step dark-step"><div className="step-number">02</div><div className="step-body"><p className="eyebrow">MAAK DE INSTALLATIELINK</p><h2>Vul twee dingen in</h2><div className="link-form"><label><span>1 · Shopify Admin-URL</span><input value={shopInput} onChange={(event) => { setShopInput(event.target.value); setAuthorizationUrl(''); }} placeholder="https://admin.shopify.com/store/jouw-store/apps/..." autoComplete="off" /></label>{shop.error && <p className="field-message error">{shop.error}</p>}{shop.domain && <p className="field-message success">Store herkend: <strong>{shop.domain}</strong></p>}<label><span>2 · Client ID</span><input value={clientId} onChange={(event) => { setClientId(event.target.value); setAuthorizationUrl(''); }} placeholder="Dev Dashboard → Instellingen → Credentials" autoComplete="off" /></label><p className="microcopy">Gebruik hier alleen de Client ID. Je Client secret blijft geheim tot de laatste stap.</p><button type="button" className="authorize" disabled={!canGenerate} onClick={generateAuthorizationUrl}>Maak mijn installatielink <span>→</span></button>{authorizationUrl && <div className="generated-link"><span>JOUW INSTALLATIELINK IS KLAAR</span><code>{authorizationUrl}</code><div><CopyButton value={authorizationUrl} label="Kopieer link" /><a href={authorizationUrl}>Open in Shopify →</a></div></div>}</div></div></article>
      <article className="wizard-step"><div className="step-number">03</div><div className="step-body"><p className="eyebrow dark">IN SHOPIFY</p><h2>Controleer en installeer</h2><div className="single-action"><b>Open de installatielink</b><p>Shopify toont de store en alle gevraagde rechten. Controleer bovenin of dit jouw store is en klik onderaan op <strong>Installeren</strong>. Je hoeft de app dus niet eerst ergens anders te installeren.</p></div></div></article>
      <article className="wizard-step final-step"><div className="step-number">04</div><div className="step-body"><p className="eyebrow dark">AUTOMATISCH TERUG</p><h2>Vul je secret in en kopieer de token</h2><div className="single-action"><b>Na Installeren kom je automatisch op onze terugkeerpagina.</b><p>Vul daar je <strong>Client secret</strong> in. De pagina wisselt de Shopify-code om voor je offline access token. Kopieer de token direct naar de beveiligde secret-invoer van je project.</p></div><aside className="security"><strong>Nooit delen of hergebruiken</strong><p>Zet een Client secret of access token nooit in chat, screenshots, e-mail, Git of logs. Gebruik je meerdere stores? Bewaar per token altijd het bijbehorende <code>.myshopify.com</code>-domein.</p></aside></div></article>
    </section>
    <footer><span>DSA Agents & Skills</span><p>Shopify Admin API · OAuth offline access token</p></footer>
  </main>;
}
