# Shopify API-token generator — Dropship Academy

Een korte Nederlandstalige pagina waarmee studenten een Shopify-app configureren en via de authorization-code-flow een permanente offline Admin API-token maken.

Productie: `https://agents.dropshipacademy.nl/shopify-api`

## Gebruikersflow

De website groepeert alles in vier korte stappen:

1. Maak de app en versie aan, plak de vaste App-URL en omleidings-URL, kopieer de gewenste scopes en klik **Vrijgeven**.
2. Plak de Shopify Admin-URL en Client ID. De generator maakt de persoonlijke installatielink.
3. Open die link en keur de appinstallatie in Shopify goed.
4. Shopify stuurt je automatisch terug. Vul daar eenmalig de Client secret in en kopieer de permanente offline Admin API-token naar de secretopslag van het juiste project.

De pagina accepteert ook lange Admin-URL's zoals `https://admin.shopify.com/store/winkelnaam/apps/...` en zet die lokaal om naar `winkelnaam.myshopify.com`.

## Beveiligingsgrenzen

- De browser maakt voor iedere koppeling een willekeurige `state` en controleert die na terugkeer.
- De server controleert de Shopify HMAC voordat hij een code uitwisselt.
- De uitwisseling accepteert uitsluitend geldige `*.myshopify.com`-hosts.
- Client secret en access token worden niet door de applicatiecode opgeslagen of gelogd.
- Callback- en tokenantwoorden sturen `Cache-Control: no-store`.
- Studenten moeten tokens per permanent winkeldomein labelen en nooit in chat, Git, screenshots of e-mail delen.

De callback is geen webhook: hij voltooit alleen de OAuth-installatie. Webhooks zijn afzonderlijke Shopify-meldingen voor latere gebeurtenissen.

## Scopes

De scopekiezer bevat de 154 Admin API-scopes die op 27 augustus 2026 daadwerkelijk in Shopify Dev Dashboard werden getoond. Ze zijn voor studenten verdeeld over acht taakgroepen, maar blijven als één Shopify-regel kopieerbaar. Alle groepen staan standaard aan.

Sommige scopes zijn beschermd of vereisen aanvullende Shopify-goedkeuring. Als Shopify zo'n scope weigert, schakel je alleen de betreffende taakgroep uit. De niet-bestaande scope `read_shopify_payments_dispute_evidences` staat nadrukkelijk niet in de lijst.

## Opnemen van de uitlegvideo

Toon in de video alleen de vier genummerde stappen op de website. Neem nooit de Client secret of de uiteindelijke token op. Shopify-schermen veranderen regelmatig; gebruik daarom echte opnames uit de teststore in plaats van nagemaakte dashboardafbeeldingen.

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
