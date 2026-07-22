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
