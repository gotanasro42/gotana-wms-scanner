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
- **DB** pri mene = appka bezi na novej databaze. Od 21.10.2026 appka bezi **vzdy** na novej DB
  (Supabase), uvodna obrazovka "Prepojenie Skladu" (vkladanie /exec odkazu) bola odstranena.
- Kratky odkaz na appku: **takoy-sklad.netlify.app** (samostatna stranka, len presmeruje sem).
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

## Kupovane spolu (od 10/2026)
Pod kartou produktu po naskenovani NS appka ukaze 10 produktov, ktore sa najcastejsie kupovali
v tych istych objednavkach (poslednych 12 mesiacov, len predane, bez stornovanych poloziek).
- Data: Supabase tabulka `ns_spolu` (top 10 na kazde SKU), appka cita pohlad `ns_spolu_detail`
  (doplna nazov, obrazok, zasobu, podpracovisko, denny priemer z `katalog`).
- Prepocet: funkcia `prepocitaj_ns_spolu()`, plan `prepocet-ns-spolu` kazdu nedelu 2:10.
- Vynechane: NS-5369 (Ochrana proti poskodeniu - sluzba), objednavky s 1 alebo viac ako 30 polozkami.
- Percento = v kolkych objednavkach s tymto NS bol aj dany produkt.

## Vzory (od 10/2026)
Statistiky -> Produkty -> tlacidlo **Vzory**: najpredavanejsie vzory za zvolene obdobie. Zdroj: **Vsetko / Na objednavku (MAT) / Sklad (NT-, NS- vlastna potlac)**.
- Kluc je **cislo vzoru** (Magento `grafika_id` = koncovka ABRA kodu MAT-0001-234). Nazvy su v kazdom jazyku ine, preto sa zoskupuje podla cisla.
- Jeden riadok = jeden vzor (cislo, nazov, obrazok, metre, objednavky). Klik rozbali rozpis (latky MAT a produkty zo skladu). Zoradenie metre/objednavky, "Zobrazit dalsich 30".
- MAT: `objednavky_polozky.grafika_id` (Magento product_id vzoru) + `vzory_grafiky` (product_id -> cislo, nazov, obrazok). Edge Function `sync-grafika`, plan `vzory-doplnanie` kazdych 5 min.
- Sklad: tabulka `sklad_vzory` (sku -> cislo = Magento `ob_kod`, dodavatel = ID atributu `dodavatel`, latka = ID atributu `material`; nazvy latok v `ciselnik_material` - pri novej latke doplnit nazov, inak sa ukaze "latka N"). Berie sa len dodavatel Takoy-tlac (149), Takoy-tlac-dlhsi proces (6220), takoy-pigment (6263), Takoy pigment dlhsi proces (8060), Takoy-tlac-pigment (7902). Edge Function `sync-vzory-sklad`, plan `vzory-sklad-doplnanie` kazdych 5 min (predavane NT-/NS- SKU za 400 dni, obnova po 30 dnoch).
- Zobrazenie: funkcia `dash_top_vzory(od, do, sku, zdroj)`.
- Sklad ABRA podla vzoru (MAT-0001-100) zatial nie je napojeny.

## Stitok z rolky (od 10/2026)
Skenovat NS vie precitat aj papierovy stitok z rolky. QR ma tvar `ID;NS-kod;metraz;cislo` (napr. `88574;NS-16261;3.7;2`).
Appka vyhlada produkt podla NS kodu a na vrchu karty ukaze zelenu zahlavie s metrazou zo stitku. Rucne dopisana
metraz (napr. 1,3 m) sa skenerom precitat neda. Vyznam 4. cisla v QR zatial nie je potvrdeny, appka ho nezobrazuje.

## Stitky roliek (od 10/2026)
Skenovat -> tlacidlo **STITKY ROLIEK** (pod Hromadnym prijmom). Samostatna evidencia zvyskov latok, **mimo skladu**:
nic sa nepridava ani neodpisuje zo skladovych poloziek.
- Data: Supabase tabulka `stitky_rolky` (ns, metraz, stitok_id, udaj4, zdroj QR/RUCNE, skenoval, vytvorene, exportovane).
- Rovnake NS aj rovnaka metraz sa mozu opakovat, nie je to chyba. Jedine, ze ten isty stitok v zabere dvakrat po sebe (do 4 s) sa ignoruje.
- Zapis aj rucne: NS + metraz. Kazdy zaznam sa da zmazat (kos pri riadku).
- Export: **Stiahnut Excel** (CSV so strednikmi, otvori sa v Exceli s diakritikou) alebo tlacidlo Zdielat (mail, Disk...). Filter Dnes / Nevyexportovane / Vsetko; po exporte sa zaznamy oznacia ako vyexportovane.

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

