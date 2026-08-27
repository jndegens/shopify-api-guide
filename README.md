# Shopify API-token generator — Dropship Academy

Een korte Nederlandstalige pagina waarmee studenten een Shopify-app configureren en via de authorization-code-flow een permanente offline Admin API-token maken.

Productie: `https://agents.dropshipacademy.nl/shopify-api`

## Gebruikersflow

1. Maak in het Shopify Dev Dashboard een app en versie aan.
2. Configureer de App-URL en exacte toegestane omleidings-URL die de pagina toont.
3. Kies scopes en geef de versie vrij.
4. Plak de Shopify Admin-URL en Client ID in de generator.
5. Keur de installatie in Shopify goed.
6. Vul de Client secret pas op de callbackpagina in.
7. Kopieer de uitgegeven offline token naar de secretopslag van het juiste AI-project.

De pagina accepteert ook lange Admin-URL's zoals `https://admin.shopify.com/store/winkelnaam/apps/...` en zet die lokaal om naar `winkelnaam.myshopify.com`.

## Beveiligingsgrenzen

- De browser maakt voor iedere koppeling een willekeurige `state` en controleert die na terugkeer.
- De server controleert de Shopify HMAC voordat hij een code uitwisselt.
- De uitwisseling accepteert uitsluitend geldige `*.myshopify.com`-hosts.
- Client secret en access token worden niet door de applicatiecode opgeslagen of gelogd.
- Callback- en tokenantwoorden sturen `Cache-Control: no-store`.
- Studenten moeten tokens per permanent winkeldomein labelen en nooit in chat, Git, screenshots of e-mail delen.

De callback is geen webhook: hij voltooit alleen de OAuth-installatie. Webhooks zijn afzonderlijke Shopify-meldingen voor latere gebeurtenissen.

## Screenshots

De pagina bevat drie duidelijke tijdelijke screenshotvakken. Vervang die door echte, door Dropship Academy aangeleverde Shopify-screenshots; er worden bewust geen nagemaakte dashboards gebruikt.

## Lokaal draaien en controleren

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Officiële Shopify-documentatie

- [Standalone/API-only apps authenticeren](https://shopify.dev/docs/apps/build/authentication-authorization/authenticate-standalone-apps)
- [Apps maken in het Dev Dashboard](https://shopify.dev/docs/apps/build/dev-dashboard/create-apps-using-dev-dashboard)
- [Access tokens](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens)
- [Shopify API access scopes](https://shopify.dev/docs/api/usage/access-scopes)
