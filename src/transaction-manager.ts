/*
    Copyright 2022, 2024 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { TransactionType } from './transaction-type'
import { BaseTransaction } from './base-transaction'
import { BuyTransaction } from './buy-transaction'
import { SellTransaction } from './sell-transaction'
import { TransferTransaction } from './transfer-transaction'
import { BasicTransactionInfo } from './basic-transaction-info'
import { RawTransaction } from './raw-transaction'
import Currencies from './currencies'

export class TransactionManager {
    readonly transactions: BaseTransaction[] = []

    constructor(transactions_file_contents: string) {
        const jsonl: string[] = transactions_file_contents.split(/\r?\n/)
        let last_timestamp = null;

        for (let line of jsonl) {
            let raw_t = new RawTransaction(line)
            if (last_timestamp && last_timestamp > raw_t.timestamp) {
                throw new Error(`Transactions file not in time order. Reference: ${raw_t.ref}`);
            }
            last_timestamp = raw_t.timestamp;
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

    printTotals(currency?: string) {
        const currencies = currency ? [ currency ] : Array.from(new Set(this.transactions.map(t => t.cur)))

        const totals: {
            currency: string,
            buys: number,
            sales: number,
            gain: number,
            balance: number
        }[] = []

        for (const c of currencies) {
            let buys: number = 0.0
            let sales: number = 0.0
            let balance: number = 0.0
            for (const t of this.transactions.filter(t => { return t.cur.toLowerCase() == c.toLowerCase() })) {
                if (t.trtype == TransactionType.Buy) {
                    buys += t.total
                    balance += t.amount
                } else if (t.trtype == TransactionType.Sell) {
                    sales += t.total
                    balance -= t.amount
                }
            }
            totals.push({currency: c, buys, sales, gain: sales - buys, balance})
        }

        console.log('=================================================\n')
        console.log('CURRENCY    BUYS      SALES       GAIN    BALANCE\n')
        for (const t of totals) {
            console.log(`${t.currency.padStart(5)}:${this.getTwoDecimals(t.buys, 10)} ${this.getTwoDecimals(t.sales, 10)} ` +
            `${this.getTwoDecimals(t.gain, 10)} ${this.getTwoDecimals(t.balance, 10)}`)
        }
        const buys = totals.map(t => t.buys).reduce((x,y) => {return x+y})
        const sales = totals.map(t => t.sales).reduce((x,y) => {return x+y})
        const gain = totals.map(t => t.gain).reduce((x,y) => {return x+y})
        console.log(`\nTotal:${this.getTwoDecimals(buys, 10)} ${this.getTwoDecimals(sales, 10)} ${this.getTwoDecimals(gain, 10)}`)
        console.log('\n=================================================')
    }

    private getTwoDecimals(num: number, pad_length?: number): string {
        const retval: string = (+(Math.round(+(num + 'e+2')) + 'e-2')).toString()
        if (!pad_length) return retval
        return retval.padStart(pad_length)
    }

    printSellTransactions(year?: number, currency?: string) {
        console.log(`${currency ? ((Currencies[currency] || currency) + '-myynnit') : 'Virtuaalivaluuttamyynnit'}${year ? (' vuonna ' + year.toString()) : ''}`)
        console.log('====================================================================\n')

        let gains: number = 0.0
        let total_sold: number = 0.0
        let total_buy_cost: number = 0.0

        let index: number = 1
        for (const t of this.transactions.filter(t => {
                return t.trtype == TransactionType.Sell &&
                (!year || t.timestamp.getFullYear() == year) &&
                (!currency || t.cur == currency)
            })) {
            console.log(index + '.')
            index++
            const st = (t as SellTransaction)
            st.printTaxReport()
            gains += st.tax_sell_gain
            total_sold += st.total
            total_buy_cost += st.total_buy_cost
        }

        console.log('====================================================================\n')
        console.log(`Myyntejä yhteensä: ${this.getTwoDecimals(total_sold)} €`)
        if (total_sold <= 1000) {
            console.log('Myyntejä enintään 1000 €, ei tarvitse ilmoittaa veroja.')
        }
        console.log(`Myytyjen valuuttojen hankintahinta yhteensä: ${this.getTwoDecimals(total_buy_cost)} €`)
        console.log(`Verotuksessa ilmoitettava ${gains >= 0 ? 'tuotto' : 'tappio'} yhteensä: ${this.getTwoDecimals(gains)} €`)
    }
}
