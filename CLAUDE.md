# Gotana WMS Scanner – pokyny pre Claude

Skladová appka a Štatistiky pre e-shop Takoy (GOTANA s.r.o.). Podrobnosti o každej funkcii sú v `DOKUMENTACIA.md` –
**pred úpravou si prečítaj príslušnú sekciu**, po úprave do nej dopíš novú sekciu (čo, ako, kde v DB, dátum).

## Používateľ
- Andrej, vedie prevádzku – **nie je technik**. Píš po slovensky, stručne, bez žargónu (technický pojem vysvetli 1 vetou).
- Daj priame odporúčanie, nie zoznam možností. Pri číslach presné a overené výsledky.
- Skripty, SQL a nasadenie robíš ty, nie on. Nedávaj mu príkazy do terminálu.
- **Nič dôležité neodosielaj / nemaž bez jeho potvrdenia** (maily, mazanie dát, platby). Úpravy appky smieš rovno otestovať a nasadiť.
- Heslá a tokeny nech nikdy nepíše do chatu – pripomeň mu to.

## Súbory a nasadenie
- `index.html` = skladová appka (skenovanie NS, pozície, hromadný príjem, štítky roliek, počítadlo roliek, hlasové ovládanie).
- `statistiky.html` = Štatistiky (predaj, marže, krajiny, produkty, chatbot).
- Jednosúborové stránky, Tailwind sa builduje na Netlify (`tw-in.css`, `tailwind.config.js`).
- **Push do `main` = okamžité nasadenie na Netlify.** Pred pushom: `node --check` na inline skripty a test v headless Chrome
  (playwright, `/usr/bin/google-chrome`, šírka telefónu 360–380 px, Supabase volania podvrhnúť cez `page.route`).
- Commity po slovensky bez diakritiky, krátko čo a prečo.

## Supabase (projekt `gduarwvhxlffrasuuxqw`, gotana-wms-scanner)
- Hlavné tabuľky: `polozky` (sklad), `katalog` (~75 000 produktov z Magenta), `historia` (zápisy skladu s menom),
  `predaj_den` / `predaj_zmeny` (štatistiky), `nakupne_ceny_abra`, `chat_log`, `aktivita`, `hlas_log`.
- **Nemazať** `polozky`, `katalog`, `historia` ani ich primárne kľúče.
- **Šetri Disk IO** (projekt mal problém s IO budgetom): žiadne časté cron joby, zapisovať len zmeny, veľké prepočty po dávkach,
  nové logovanie dávkovo. Pred novým cron jobom zváž frekvenciu.
- Edge funkcie: `sync-katalog`, `sync-zasoby`, `sync-grafika`, `chatbot` (Claude Sonnet, správca vidí financie, ostatní nie –
  pohľady `chat_zak.*`), `pocitaj-rolky`.
- Kľúče: v appke je len `anon` kľúč (verejný, to je v poriadku). `service_role`, Magento token a Anthropic kľúč sú len v Supabase Secrets –
  nikdy ich nedávať do kódu ani do GitHubu.

## Nákupné ceny a marže
- Funkcia `nakup_cena(sku, den)`: Magento -> ABRA (`nakupne_ceny_abra`). ST, poukazy, Mystery box = 0; TR = cena pôvodnej látky;
  ZB = 0,5 × pôvodná látka; MAT = cena za meter z ABRY.
- Chýbajúce ceny sa dopĺňajú z ABRA Flexi (konektor beží na Andrejovom počítači) – každý pondelok príde pripomienka.

## Pravidlá úprav
- Malé, cielené zmeny; nemeniť blok `====== SUPABASE ======` v `index.html` bez dôvodu.
- Po vložení skontrolovať, že súbor nie je prázdny ani zdvojený (1× `<html>`).
- V JS nepísať `\uXXXX` escapy cez nástroje (menia sa na znaky) – použiť napr. `\p{Mn}` s príznakom `u`.
- Mobil je hlavné zariadenie: kompaktné, čitateľné (min. 11–12 px), nič nesmie pretekať do šírky.
