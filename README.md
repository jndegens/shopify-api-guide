# Shopify API-handleiding — Dropship Academy

Een Nederlandstalige, visuele handleiding voor studenten en medewerkers die een Shopify-store veilig aan een AI-tool willen koppelen.

De pagina is bedoeld voor publicatie op:

`https://agents.dropshipacademy.nl/shopify-api`

## Wat de pagina bevat

- een veilige hulpprompt voor Claude, ChatGPT of een andere AI-tool;
- een URL-converter die ook lange Shopify Admin-URL's omzet naar het permanente `winkelnaam.myshopify.com`-domein;
- actuele, gesaneerde reconstructies van Shopify Admin en het Dev Dashboard;
- een interactieve rechtenbouwer met kopieerbare Shopify-scopes per taakgroep;
- een complete OAuth-uitleg van app aanmaken tot en met de read-only eindcontrole;
- expliciete regels voor meerdere stores, secretopslag, rotatie en auditlogs.

## Belangrijke veiligheidsgrens

Deze website is alleen een instructiepagina. De frontend vraagt geen Client Secret, authorization code of access token op en bewaart die ook niet.

De App-URL en toegestane omleidings-URL moeten worden geleverd door de backend van de AI-tool die de OAuth-koppeling afhandelt. De callback valideert `state` en HMAC, wisselt de tijdelijke code server-side om en bewaart de verkregen store-token versleuteld in een secret vault of beveiligde database.

Een OAuth-callback is geen webhook. Webhooks melden latere gebeurtenissen in Shopify; de callback voltooit de installatie en autorisatie.

## Lokaal draaien

Vereist Node.js 22.13 of nieuwer.

```bash
npm install
npm run dev
```

Open daarna `http://localhost:3001/shopify-api` of de poort die de ontwikkelserver toont.

## Controle

```bash
npm run lint
npm run build
```

## Visuele referenties

De Shopify-schermen zijn responsieve HTML/CSS-reconstructies van de actuele Nederlandstalige interface. De navigatie, kaartstructuur, labels, invoervelden en primaire acties volgen de echte Shopify Admin en het Dev Dashboard. Winkel- en accountgegevens zijn bewust vervangen of beperkt tot de toegestane Base44-demonstratienaam; geheimen worden nooit afgebeeld.

## Officiële documentatie

- [Authenticatie en autorisatie](https://shopify.dev/docs/apps/build/authentication-authorization)
- [Access scopes beheren](https://shopify.dev/docs/apps/build/authentication-authorization/manage-access-scopes)
- [Shopify access scopes](https://shopify.dev/docs/api/usage/access-scopes)
- [Access tokens](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens)

