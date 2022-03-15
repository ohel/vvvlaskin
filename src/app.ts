// Virtuaalivaluuttaverotuslaskin (vvvlaskin)

/*
   Copyright 2022 Olli Helin
   This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
   GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { TransactionManager } from "./transaction-manager"

const fs = require('fs')

const args = process.argv.slice(2);
if (!args || args.length < 1) {
    console.error("Missing file argument.")
    process.exit()
}

const raw_data: string = fs.readFileSync(args[0], 'utf8' , (err, data) => {
    if (err) {
        console.error(err)
        process.exit()
    }
    return data
})

const t_manager = new TransactionManager(raw_data)

let year: number
let currency: string
if (args && args.length > 1) {
     year = parseInt(args[1])
}
if (args && args.length > 2) {
     currency = args[2]
}

t_manager.printSellTransactions(year, currency)
