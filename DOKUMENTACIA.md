# Gotana WMS Scanner – dokumentácia a história

**Appka:** jediný súbor `index.html` v tomto GitHub repozitári → automaticky sa nasadzuje na Netlify (fanciful-rolypoly-98f63a.netlify.app).
**Databáza skladu:** Google Sheets (cez Apps Script API v appke – NEMENIŤ, funguje).
**Databáza vzorov (AI):** `index.json` (odtlačky grafík, ~15 MB) + `nahlady.json` (mapa SKU → obrázok) v tomto repozitári.

## Ako appka funguje
- **Skenovať** – QR/čiarové kódy, karta produktu, tlačidlo Podobné vzory (porovná grafiku s databázou bez fotenia).
- **Zoznam** – položky zo Sheets, hľadanie podľa kódu/pozície/názvu, náhľady z `nahlady.json`.
- **Vzor** – AI vyhľadávanie: fotka → CLIP model v prehliadači → porovnanie s `index.json`. Textové hľadanie funguje aj bez AI modelu.
- Fotka sa analyzuje v 4 pohľadoch (celá, 70 %, 45 %, 28 % výrez so zvýšeným kontrastom pre jemné vzory), berie sa najlepšia zhoda.

## Aktualizácia databázy vzorov (nové produkty!)
Nové produkty pribúdajú každý týždeň → raz týždenne spustiť indexer:
1. Na PC otvor priečinok `C:\Users\Acer\Desktop\vzory` v PowerShelli.
2. Spusti: `node build-index.mjs` (PC nesmie zaspať; pokračuje kde skončil – nové produkty len doindexuje).
3. Súbory `index.json` a `nahlady.json` nahraj do repozitára: GitHub → Add file → Upload files → **Commit directly to main**.
Indexer berie prefixy: **NS-, NT-, VZOR-, HT-**. Nový prefix = uprav `const SKU_PREFIXES = [...]` v `build-index.mjs`.

## Ak niečo nefunguje
- **Chýbajú náhľady/grafiky** → produkt nie je v `nahlady.json` (nový alebo iný prefix) → spusti indexer a nahraj nové JSON.
- **Vzor Finder chyba pri štarte** → skontroluj `index.json` v repozitári; obnov stránku.
- **Appka pokazená po úprave** → GitHub → Commits → posledný fungujúci commit → Browse files → index.html → Raw → skopíruj a commitni naspäť. História commitov = záloha.
- **Sheets databáza** – appka do nej len zapisuje/číta cez API; commity v GitHube ju neovplyvňujú.

## História vývoja
- v1–v2: záložka Vzor (CLIP v prehliadači), náhľady v Zozname, zoskupovanie duplikátov, kalibrované %.
- v3: textové hľadanie, oprava presnosti (EXIF + MAX zhoda), 20 výsledkov, priebežné načítavanie.
- v4: Načítať ďalšie podobné (po 20, max 60), Zobraziť viac pri texte, Podobné vzory na karte produktu, zoom+kontrast pre jemné vzory.
- v4.1: X tlačidlo vo Vzor Finderi; oprava hľadania v Zozname (renderGen).
- Indexer: takoy.sk GraphQL → CLIP odtlačky (patch16) → `index.json` + `nahlady.json`; retry/backoff + prehliadačové hlavičky (WAF).

## Technické detaily
- AI modul: koniec `index.html`, `<script type=module>`, funkcie s prefixom `vzor`.
- `index.json`: `{ model, q: 1000, items: [{sku, name, img, emb: [512 čísel]}] }`; podobnosť = skalárny súčin / q².
- Zoznam: `renderDb` po dávkach; `renderGen` ruší staré kreslenie.
- GitHub editor: po vložení celého súboru skontrolovať, že nie je zdvojený (2× `<html>` = poškodený).
-

## Podpracoviská (automatika)

Podpracovisko sa zobrazuje v appke na karte produktu (fialový štítok) aj v Zozname pri dátume. Cesta dát:
Magento → (raz týždenne skript) → stĺpec **Podpracovisko** v hárku **Katalog** v Google Sheets → Apps Script `getCatalog` → appka.

**Kde čo je:**
- **Apps Script** (Google Sheets → Rozšírenia → Apps Script): funkcie `aktualizujPodpracoviska` (spustiť ručne / týždenný spúšťač), `pokracujPodpracoviska` (pomocná, správa sa sama), `spracujPodpracoviska` (hlavná logika), `kdeSomSkoncil` a `kontrolaPodpracovisk` (diagnostika).
- **Token** k Magento API je uložený v Apps Script → Nastavenia projektu → Vlastnosti skriptu pod názvom `TAKOY_TOKEN`. **Nikdy ho nedávaj do GitHubu ani do kódu appky.**
- **API endpoint:** `https://takoy.sk/rest/V1/takoy/product-collection` — read-only modul Takoy_AI (ACL `Takoy_AI::product_collection`), token vie len čítať, nič nezmení.
- **Spúšťač:** Apps Script → Spúšťače → týždenne na `aktualizujPodpracoviska` (NIE na `pokracujPodpracoviska`).

**Ako to beží:** Apps Script má limit 6 minút na jeden beh, katalóg je väčší. Skript preto spracuje dávku (~4,5 min), zapíše ju, uloží si číslo strany a naplánuje pokračovanie o minútu. Takto sa reťazí, kým nepreíde celý katalóg (~150 strán po 500 produktov, spolu 10–20 minút). Výpisy z automatických pokračovaní sú v ľavom menu **Vykonania**, nie v okne editora.

**Kontrola stavu:** spusti `kdeSomSkoncil`. „Strana 1 + pokračovanie: nie“ = dobehlo celé. Ak strana stýcha na jednom čísle a pokračovanie nie je naplánované, spusti ručne `pokracujPodpracoviska` — nadväže tam, kde skončil.

**Nové podpracovisko v e-shope:** číselník ID → názov je napísaný priamo v skripte (premenná `mapa`). Keď pribudne nové, skript ho v logu vypíše ako neznáme ID a stačí doplniť riadok, napr. `'8500': 'V2-1'`. Zoznam k 7/2026: 6115 nezaradene, 6107 H2-1, 6108 H2-2, 6109 H2-3, 6121 H1-1, 6122 H1-2, 6123 H1-3, 6173 D1-1, 6174 D1-2, 6175 D1-3, 6198 H3-1, 6211 H3-2, 6269 H3-3, 6227 V1-1, 6262 V1-2, 8438 HT1-1.

**Ak niečo nefunguje:**
- **Chyba 522** = server e-shopu neodpovedal včas (ochrana Cloudflare). Skript to skúša 4× za sebou; ak padá stále, skús neskôr alebo daj vedieť IT.
- **Exceeded maximum execution time** = dávkovanie nefunguje; skontroluj, že sú v skripte všetky tri funkcie (`aktualizujPodpracoviska`, `pokracujPodpracoviska`, `spracujPodpracoviska`).
- **Štítok sa v appke nezobrazí** = appka má starú kópiu katalógu. Zavri appku a otvor znova, prípadne vymaž údaje stránky v prehliadači.
- **Po zmene Apps Scriptu** treba vždy: Nasadenie → Spravovať nasadenia → ✏️ → Verzia: Nová verzia → Nasadiť. Bez toho appka dostáva starú verziu.

**Formát dát:** `getCatalog` vracia pre produkt buď reťazec (len názov) alebo objekt `{n: názov, p: podpracovisko}`. Appka (`normalizujKatalog`) obidva formáty zvládne, takže staršia verzia Apps Scriptu appku nerozbije.
