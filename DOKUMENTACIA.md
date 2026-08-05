# Gotana WMS Scanner - dokumentacia

**Appka:** jediny subor `index.html` v tomto repozitari -> automaticky sa nasadzuje na Netlify
(fanciful-rolypoly-98f63a.netlify.app). Subor `netlify.toml` zabezpecuje, ze sa vzdy nacita
najnovsia verzia (bez cachovania).

## Kde su data (od 8/2026)

| Co | Kde | Poznamka |
|---|---|---|
| Skladove polozky | Supabase, tabulka `polozky` | ~4600 kusov |
| Katalog produktov | Supabase, tabulka `katalog` | ~75 000, tiahne sa z Magenta |
| Historia pohybov | Supabase, tabulka `historia` | |
| Vzory pre AI | `index.json` + `nahlady.json` v repozitari | |
| Google Sheets | **uz sa nepouziva** | zostava ako zaloha k 5.8.2026 |
| Apps Script | **uz sa nepouziva** | nemazat, kym nova DB nepobezi par tyzdnov |

Supabase projekt: `gduarwvhxlffrasuuxqw`

## Preco sme presli zo Sheets na Supabase
Apps Script mal denny limit behu (~90 min) a pri dvoch ludoch naraz vznikali chyby
"ID uz existuje" a stratene zapisy. Nacitanie zoznamu trvalo 30+ sekund a casto skoncilo
chybou 404. V Supabase to trva 0,3 s a duplicitne ID databaza fyzicky nedovoli.

## Ovladacie prvky v hlavicke appky
- **DB** pri mene = appka bezi na novej databaze. Ak tam nie je, bezi na starych Sheets.
- **Ikona databazy** = prepnutie medzi novou DB a starymi Sheets (navrat je vzdy mozny).
- **Ikona mrakov (cloud_sync)** = okamzita aktualizacia katalogu z Magenta (1-2 min).
- **Ozubene koliesko** = zmena API adresy (uz netreba, dedicstvo starych Sheets).

## Katalog a podpracoviska
Nazvy produktov aj podpracoviska sa tiahnu **priamo z Magenta**, uz sa neprepisuju rucne v Sheets.
- Zabezpecuje to Supabase Edge Function `sync-katalog`.
- Magento token je ulozeny v Supabase -> Edge Functions -> Secrets ako `MAGENTO_TOKEN`.
  **Token nikdy nedavaj do appky ani do GitHubu** - appka je verejna stranka.
- Endpoint: read-only modul Takoy_AI (`/rest/V1/takoy/product-collection`), token nevie nic zmenit.
- Appka spusti synchronizaciu **sama raz za 20 hodin** na pozadi; rucne kedykolvek ikonou mrakov.

## Vzory (AI vyhladavanie podla fotky)
Indexer `build-index.mjs` bezi na PC (`C:\\Users\\Acer\\Desktop\\vzory`):
1. `node build-index.mjs` (PC nesmie zaspat, prvy beh dlho, potom uz len novinky)
2. vzniknute `index.json` a `nahlady.json` nahraj do repozitara (Add file -> Upload files -> commit do main)
Prefixy: NS-, NT-, VZOR-, HT-. Indexer prechadza produkty po kategoriach (obchadza limit 10 000).

## Ak nieco nefunguje
- **Appka ukazuje stare data / stare tlacidla** -> Ctrl+Shift+R, na mobile vymazat udaje stranky.
- **Zoznam prazdny** -> skontroluj, ci pri mene svieti DB; ak nie, prepni ikonou databazy.
- **Chyba pri zapise** -> pozri Supabase -> Table Editor -> polozky, ci tam zaznam je.
- **Katalog neaktualny** -> klikni ikonu mrakov v hlavicke.
- **Appka sa pokazila po uprave** -> GitHub -> Commits -> posledny funkcny commit -> Browse files
  -> index.html -> Raw -> skopiruj a commitni spat. Historia commitov = zaloha kazdej verzie.

## Pravidla pri upravach (dolezite)
- Meni sa vyhradne `index.html` cez GitHub. Po vlozeni VZDY skontrolovat, ze subor nie je prazdny
  ani zdvojeny (ma byt 1x `<html>`, parny pocet `<script>` znaciek).
- **Nemazat** v Supabase tabulky `polozky`, `katalog`, `historia` ani ich primarne kluce -
  prave primarny kluc brani duplicitam.
- **Nemenit** v `index.html` blok oznaceny `====== SUPABASE ======` bez rozmyslu - je to napojenie na DB.
- `service_role` kluc zo Supabase nikdy nikam nedavat. `anon` kluc v appke je v poriadku, na to sluzi.

## Historia vyvoja (skratene)
- Vzor Finder v1-v4: AI hladanie vzorov podla fotky, strankovanie, Podobne vzory, zoom pre jemne vzory.
- Podpracoviska: najprv rucne v Sheets, potom Apps Script, dnes automaticky z Magenta.
- 8/2026: prechod zo Sheets/Apps Script na Supabase (rychlost, subezne skenovanie, ziadne denne limity).

