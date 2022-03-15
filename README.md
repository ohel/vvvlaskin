# Virtuaalivaluuttaverotuslaskin (vvvlaskin)

## Tietoa suomeksi (Finnish info)

Työkalu virtuaalivaluuttojen myynneistä ilmoitettavien verojen laskemiseen. Katso alta sisäänmenotiedoston formaatti ja ajo-ohjeet.

Toiminta perustuu Verohallinnon ohjeisiin 3/2022:
* [Virtuaalivaluuttojen verotus](https://www.vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/48411/virtuaalivaluuttojen-verotus3/)
* [Käytännön ohjeita](https://www.vero.fi/tietoa-verohallinnosta/uutishuone/lehdist%C3%B6tiedotteet/2021/muista-ilmoittaa-virtuaalivaluutoista-saadut-tulot-veroilmoitukselle/)

Ostokustannus lasketaan mukaan virtuaalivaluuttayksikön hintaan tuottoja laskiessa, jotta yhdestä ostoerästä voi laskea myyntejä useassa erässä.

## Info in English (tietoa englanniksi)

A tool for calculating and creating a tax report from sales of virtual currencies according to Finnish legislation. The functionality is based on the instructions by Finnish Tax Administration as of 3/2022, see links in the Finnish info. See below for info on input file format and run instructions.

The buying costs are included in price per unit of virtual currency when calculating gains, so that a single buy transaction may be sold in multiple transactions.

## Input file format (sisäänmenotiedoston formaatti)

* JSONL file (JSONL-tiedosto)
* One transaction per line (tapahtuma per rivi)
* Mandatory properties (pakolliset arvot): timestamp, trtype, cur, amount, ppu, fee, subtotal, total
  * cur = currency (valuutta)
  * PPU = Price Per Unit of currency (valuuttayksikön hinta)
  * trtype: `b[uy]|s[ell]|t[ransfer]`
  * timestamp: YYYY-MM-DD HH:MM
  * cur: string
  * the rest (kaikki loput): number/float
* Optional properties (valinnaiset arvot): comment, vcfee, exchange, ref, ignore
  * vcfee = Virtual Currency fee, as opposed to *fee* which is in fiat currency (virtuaalivaluuttakustannus; eri kuin kustannus, joka on fiat-valuutassa)
  * ref = exchange transaction reference (pörssin viite)
  * vcfee: number/float
  * ignore: boolean
  * the rest (kaikki loput): string

Some calculation rules (laskentasääntöjä):
* For buys (ostoille): `<total> = <subtotal> + <fee>`
* For sales (myynneille): `<total> = <subtotal> - <fee>`
* If vcfee exists (jos vcfee on olemassa): `<transaction final amount> = <amount> - <vcfee>`, and (ja) `<final ppu> = <total> / <transaction final amount>`

An example line (esimerkkirivi):
`{ "timestamp": "2022-0x-yy xx:xx", "trtype": "buy", "cur": "XXX", "amount": 20.0, "ppu": 10.0, "fee": 2.99, "subtotal": 197.01, "total": 200, "exchange": "MegaXchange", "ref": "XYZ123", "comment": "Template", "ignore": true }`

See also the `example.jsonl` example file. (Katso myös esimerkkitiedosto `example.jsonl`.)

## How to run (kuinka ajaa)

1. `npm install`
2. `npm run example` to run an example (ajaaksesi esimerkin)

To calculate the report for a specific input file, year and currency, use a command like: `npm run build && node src/app.js input.jsonl 2022 BTC`, where *input.jsonl* has the transactions, *2022* is an optional year, and *BTC* an optional crypto currency code. List of currencies is in `src/currencies.ts`.
(Tulostaaksesi ilmoituksen tietylle tiedostolle, vuodelle ja valuutalle, käytä komentoa kuten edellä englanninkielisessä tekstissä; komennossa *input.jsonl* on tapahtumatiedosto, *2022* on valinnainen vuosi ja *BTC* on valinnainen valuuttakoodi. Lista valuutoista on tiedostossa `src/currencies.ts`.)

## Future plans (jatkosuunnitelmia)

Implement the couple of features marked TODO.
(Toteuta pari TODO-merkittyä ominaisuutta.)

A browser user interface, where one could see all the details from all the transactions and how the gains are computed, and see some overall statistics about their investments.
(Selainkäyttöliittymä, josta näkisi tiedot kaikista tapahtumista ja kuinka tuotot on laskettu, sekä jotain kokonaistilastoja sijoituksista.)
