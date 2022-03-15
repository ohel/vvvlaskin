/*
   Copyright 2022 Olli Helin
   This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
   GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { TransactionType } from "./transaction-type"
import { BaseTransaction } from "./base-transaction"
import { BuyTransaction } from "./buy-transaction"
import { SellTransaction } from "./sell-transaction"
import { TransferTransaction } from "./transfer-transaction"
import { BasicTransactionInfo } from "./basic-transaction-info"
import { RawTransaction } from "./raw-transaction"
import Currencies from "./currencies"

export class TransactionManager {
    readonly transactions: BaseTransaction[] = []

    constructor(transactions_file_contents: string) {
        const jsonl: string[] = transactions_file_contents.split(/\r?\n/)

        for (let line of jsonl) {
            let raw_t = new RawTransaction(line)
            if (!raw_t.ignore) this.addTransaction(raw_t)
        }
    }

    addTransaction(t: BasicTransactionInfo) {
        if (t.trtype == TransactionType.Buy) {
            this.transactions.push(new BuyTransaction(t))
        } else if (t.trtype == TransactionType.Sell) {
            this.transactions.push(new SellTransaction(t, this.transactions))
        } else if (t.trtype == TransactionType.Transfer) {
            this.transactions.push(new TransferTransaction(t))
        }
    }

    printSellTransactionsForCurrency(currency: string) {
        this.printSellTransactions(null, currency)
    }

    printSellTransactionsForYear(year: number) {
        this.printSellTransactions(year, null)
    }

    printSellTransactions(year?: number, currency?: string) {
        console.log(`${currency ? ((Currencies[currency] || currency) + "-myynnit") : "Virtuaalivaluuttamyynnit"}${year ? (" vuonna " + year.toString()) : ""}`)
        console.log("====================================================================")
        console.log("")

        let gains = 0.0
        let total = 0.0

        let index = 1
        for (let t of this.transactions.filter((t) => {
                return t.trtype == TransactionType.Sell &&
                (!year || t.timestamp.getFullYear() == year) &&
                (!currency || t.cur == currency)
            })) {
            console.log(index + ".")
            index++
            let st = (t as SellTransaction)
            st.printTaxReport()
            gains += st.tax_sell_gain
            total += st.total
        }

        console.log("====================================================================")
        console.log("")
        console.log(`Myyntejä yhteensä: ${+(Math.round(+(total + "e+2")) + "e-2")} €`)
        if (total <= 1000) {
            console.log("Myyntejä alle 1000 €, ei tarvitse ilmoittaa veroja.")
        }
        console.log(`Verotuksessa ilmoitettava ${gains >= 0 ? 'tuotto' : 'tappio'} yhteensä: ${+(Math.round(+(gains + "e2")) + "e-2")} €`)
    }
}
