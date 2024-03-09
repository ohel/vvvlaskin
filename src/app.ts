// Virtuaalivaluuttaverotuslaskin (vvvlaskin)

/*
    Copyright 2022, 2024 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { readFileSync } from 'fs'
import { TransactionManager } from './transaction-manager'

const args = process.argv.slice(2);
if (!args || args.length < 1) {
    throw new Error('Missing file argument.')
}

const raw_data = readFileSync(args[0], { encoding: 'utf8' })
const t_manager = new TransactionManager(raw_data)

let year: number = undefined;
let currency: string = undefined;
let totals: boolean = false;
if (args && args.length > 1) {
    totals = (args[1] == 'totals')
    if (!totals) year = parseInt(args[1])
}
if (args && args.length > 2) {
    currency = args[2]
}

if (totals) {
    t_manager.printTotals(currency)
    process.exit(0)
}

console.log(`

Kullekin myynnin hankintaosuudelle (myyntitapahtuma voi koostua useasta ostotapahtumasta) on laskettu tuotto/tappio Verohallinnon ohjeistuksen mukaisesti siten, että myyntihinnasta on vähennetty kyseisen osuuden hankintakustannus, kuitenkin vähintään 20% osuuden myyntihinnasta. Lisäksi tuotto on enintään 80% myyntihinnasta (hankintameno-olettama).
Laskut ja raportti on tehty sovelluksella: https://github.com/ohel/vvvlaskin
`)

t_manager.printSellTransactions(year, currency)
