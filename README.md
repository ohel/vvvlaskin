# Virtuaalivaluuttaverotuslaskin (vvvlaskin)

## Tietoa suomeksi (info in Finnish)

Työkalu virtuaalivaluuttojen myynneistä ilmoitettavien verojen laskemiseen. Katso alta sisäänmenotiedoston formaatti ja ajo-ohjeet.

Toiminta perustuu Verohallinnon ohjeisiin 3/2022:
* [Virtuaalivaluuttojen verotus](https://www.vero.fi/syventavat-vero-ohjeet/ohje-hakusivu/48411/virtuaalivaluuttojen-verotus3/)
* [Käytännön ohjeita](https://www.vero.fi/tietoa-verohallinnosta/uutishuone/lehdist%C3%B6tiedotteet/2021/muista-ilmoittaa-virtuaalivaluutoista-saadut-tulot-veroilmoitukselle/)

Ostokustannus lasketaan mukaan virtuaalivaluuttayksikön hintaan tuottoja laskiessa, jotta yhdestä ostoerästä voi laskea myyntejä useassa erässä.

Huomaa, että tämä sovellus on tehty vain koska Verohallinto ei tarjoa mitään järkeviä työkaluja valmiiksi. Sovelluksen käyttö ei siis ole mitenkään virallisesti tuettu ja tapahtuu omalla vastuulla. Laskut voi kuitenkin tarkistaa itse helposti.

Siirtotyyppiset transaktiot ovat tällä hetkellä vain omaksi tiedoksesi, sillä Verohallinto vaatii merkitsemään arvon realisoitumisen aina kun valuuttaa vaihdetaan toiseen, efektiivisesti siirrot tulee siis kirjata myös myynti- ja ostotransaktioina.

## Info in English

A tool for calculating and creating a tax report from sales of virtual currencies according to Finnish legislation. The functionality is based on the instructions by Finnish Tax Administration as of 3/2022, see links in the Finnish info. See below for info on input file format and run instructions.

The buying costs are included in price per unit of virtual currency when calculating gains, so that a single buy transaction may be sold in multiple transactions.

Please note that this application is made only because the Tax Administration does not offer any reasonable tools. Therefore using this application is not officially endorsed and happens at your own risk. The calculations are easy to check by yourself, however.

Transactions of the transfer type are at the moment just notes to yourself as the Tax Administration requires realizing the value every time a currency is exchanged to another, effectively resulting in sell and buy transactions.

## Input file format

* JSONL file
* One transaction per line
* Mandatory properties: timestamp, trtype, cur, amount, total (except for transfer and loss transactions)
  * timestamp: YYYY-MM-DD HH:MM:[SS]
  * trtype: `b[uy]|s[ell]|t[ransfer]|l[oss]`
  * cur = currency: string
  * amount: number/float
* Optional properties: fee, ppu, subtotal, comment, vcfee, exchange, ref, ignore
  * PPU = Price Per Unit of currency
  * vcfee = Virtual Currency fee, as opposed to *fee* which is in fiat currency
  * ref = exchange transaction reference or block signature
  * ignore = ignores the line from calculations: boolean
  * comment, exchange, ref: string
  * the rest: number/float

Some calculation rules:
* For buys: `<total> = <subtotal> + <fee>` and `<transaction final amount> = <amount> - <vcfee>` (make sure the numbers match what you received)
* For sales: `<total> = <subtotal> - <fee>` and `<transaction final amount> = <amount> + <vcfee>` (make sure the numbers match what you lost)
* Final price per unit used in calculations is: `<final ppu> = <total> / <transaction final amount>`
* Transfer transactions are just for bookkeeping, they are not included in the calculations.
* Loss transactions are used to just fix your balances correct. Balance by loss cannot go negative, so use a big number to zero out your balance if you no longer own the currency.

An example line:
`{ "timestamp": "2022-0x-yy xx:xx", "trtype": "buy", "cur": "XXX", "amount": 20.0, "ppu": 10.0, "fee": 2.99, "subtotal": 197.01, "total": 200, "exchange": "MegaXchange", "ref": "XYZ123", "comment": "Template", "ignore": true }`

See also the `example.jsonl` example file.

## How to run

1. `npm install`
2. `npm run build` to build the app
3. `npm run example` to run an example
4. `npm run examplebalances` to show example balances

To calculate the report for a specific input file, year and currency, use a command like: `npm run build && node src/app.js input.jsonl 2022 BTC`, where *input.jsonl* has the transactions, *2022* is an optional year, and *BTC* an optional crypto currency code. List of currencies is in `src/currencies.ts`.

You may also print balances (total money put in, money got out, current gains and balances) for each currency and all combined with: `node src/app.js input.jsonl balances`.

Note: the gains in balances only matters if your balance is zero, i.e. everything bought is sold. Otherwise it's just "gains so far".

## Kuinka ajaa (how to run in Finnish)

1. `npm install`
2. `npm run build` valmistaaksesi ohjelmiston
3. `npm run example` ajaaksesi esimerkin
4. `npm run examplebalances` ajaaksesi esimerkin loppusummista

Tulostaaksesi ilmoituksen tietylle tiedostolle, vuodelle ja valuutalle, käytä komentoa kuten edellä englanninkielisessä tekstissä; komennossa *input.jsonl* on tapahtumatiedosto, *2022* on valinnainen vuosi ja *BTC* on valinnainen valuuttakoodi. Lista valuutoista on tiedostossa `src/currencies.ts`.

Voit myös tulostaa loppusummat (sisään laitettu raha, ulos saatu raha, voitot ja saldot) jokaiselle valuutalle ja kokonaisuudelle komennolla: `node src/app.js input.jsonl balances`.

Huomaa: tuotto loppusummissa on mielekäs vain jos saldo on nolla, eli kaikki ostettu on myyty. Muutoin kyseessä on vain "tuotto tähän asti".

## Future feature ideas

A browser user interface, where one could see all the details from all the transactions and how the gains are computed, and see some overall statistics about their investments.

## Esimerkkituloste / Example output (in Finnish)

`$ npm run example 2020`

    Kullekin myynnin hankintaosuudelle (myyntitapahtuma voi koostua useasta ostotapahtumasta) on laskettu tuotto/tappio Verohallinnon ohjeistuksen mukaisesti siten, että myyntihinnasta on vähennetty kyseisen osuuden hankintakustannus, kuitenkin vähintään 20% osuuden myyntihinnasta: hankintameno-olettamalla tuotto on enintään 80% myyntihinnasta. Tästä laskentatavasta johtuen laskuissa voi esiintyä pieniä pyöristysvirheitä tai eroja verrattuna kokonaismyyntihinnan ja hankintakulujen erotukseen. Tulosteissa desimaalierotin on piste. Laskut ja raportti on tehty sovelluksella: https://github.com/ohel/vvvlaskin

    Virtuaalivaluuttamyynnit vuonna 2020
    ====================================================================

    1.
    Myynti [Ether] 2020-11-18 00:11:00 (pörssi: MegaXchange, viite: ABC)

        Määrä: 0.5 ETH
        Myyntihinta: 440.00 € (880 €/ETH)

        Hankinnat, joita myytiin:
        1. 2018-07-25 13:34:00 (pörssi: MegaXchange, viite: -)
           Määrä: 0.5 ETH
           Hankintakustannus: 500.00 € (1000 €/ETH)
           Tappio: -60.00 €

        Tappio yhteensä: -60.00 €
    --------------------------------------------------------------------
    2.
    Myynti [Ether] 2020-11-24 10:06:00 (pörssi: MegaXchange, viite: -)

        Määrä: 0.5 ETH
        Myyntihinta: 490.00 € (980 €/ETH)

        Hankinnat, joita myytiin:
        1. 2018-07-25 13:34:00 (pörssi: MegaXchange, viite: -)
           Määrä: 0.5 ETH
           Hankintakustannus: 500.00 € (1000 €/ETH)
           Tappio: -10.00 €

        Tappio yhteensä: -10.00 €
    --------------------------------------------------------------------
    3.
    Myynti [Bitcoin] 2020-11-24 10:09:00 (pörssi: MegaXchange, viite: -)

        Määrä: 2.5 BTC
        Myyntihinta: 39980.00 € (15992 €/BTC)

        Hankinnat, joita myytiin:
        1. 2018-07-25 12:40:00 (pörssi: MegaXchange, viite: XYZ)
           Määrä: 1 BTC
           Hankintakustannus: 100.00 € (100 €/BTC)
           Tuotto: 12793.60 € (20% HMO)
        2. 2019-04-03 00:55:00 (pörssi: MegaXchange, viite: -)
           Määrä: 1 BTC
           Hankintakustannus: 8000.00 € (8000 €/BTC)
           Tuotto: 7992.00 €
        3. 2020-11-24 10:07:00 (pörssi: MegaXchange, viite: -)
           Määrä: 0.5 BTC
           Hankintakustannus: 6500.00 € (13000 €/BTC)
           Tuotto: 1496.00 €

        Tuotto yhteensä: 22281.60 €
    --------------------------------------------------------------------
    ====================================================================

    Myyntejä yhteensä: 40910.00 €
    Myytyjen valuuttojen hankintahinta yhteensä: 15600.00 €
    Myyntien ja hankintahinnan erotus: 25310.00 €
    Verotuksellinen tuotto yhteensä: 22211.60 €

## Example balances output

The balances output will first list currencies you don't have anymore. After that will be a list of "exiled" currencies: if you own some, but don't really wish to think like you own that currency anymore, you may use the file `exile.txt` to list currency codes, one per line, to show them in this exiled section. Finally there there will be a printout of the section of currencies you own, along with their break-even price. The final totals line will include all currencies you currently own, exiled included.

`$ npm run examplebalances`

    In the balance column, * denotes a close to but not zero value. Consider zeroing it using a loss transaction. The break-even price is for the remaining balance.

    ====================================================

    CURRENCY       BUYS      SALES       GAIN    BALANCE

    --------------------------------------------------------------- B/E
     Bitcoin   21150.00   45960.00   24810.00          0.5000000000 13000
       Ether    4050.00     930.00   -3120.00          4.5000000000 677.78

         All   25200.00   46890.00   21690.00

    ====================================================

