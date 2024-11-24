/*
    Copyright 2022, 2024 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { TransactionType } from './transaction-type'
import { BaseTransaction } from './base-transaction'
import { BuyTransaction } from './buy-transaction'
import { SellTransaction } from './sell-transaction'
import { LossTransaction } from './loss-transaction'
import { TransferTransaction } from './transfer-transaction'
import { BasicTransactionInfo } from './basic-transaction-info'
import { RawTransaction } from './raw-transaction'
import { roundAndPrintTwoDecimals, roundTwoDecimals } from './utils'
import Currencies from './currencies'
import * as fs from 'fs'

export class TransactionManager {
    readonly transactions: BaseTransaction[] = []
    readonly exiled_currencies: string[] = []

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

        // Completely optional so if not found, that's fine.
        // Currencies listed in the file will be categorized separately in balances printout.
        try {
            fs.readFileSync('exile.txt').toString().split('\n').forEach(line => {
                this.exiled_currencies.push(line)
            })
        } catch { }
    }

    addTransaction(t: BasicTransactionInfo) {
        if (t.trtype == TransactionType.Buy) {
            this.transactions.push(new BuyTransaction(t))
        } else if (t.trtype == TransactionType.Sell) {
            this.transactions.push(new SellTransaction(t, this.transactions))
        } else if (t.trtype == TransactionType.Loss) {
            this.transactions.push(new LossTransaction(t))
        } else if (t.trtype == TransactionType.Transfer) {
            this.transactions.push(new TransferTransaction(t))
        }
    }

    printBalances(currency?: string) {
        const currenciesToPrint = currency ? [ currency ] : Array.from(new Set(this.transactions.map(t => t.cur)))

        const balances: {
            currency: string,
            buys: number,
            sales: number,
            gain: number,
            balance: number,
            be: number | ''
        }[] = []

        let maxCurrencyLength: number = 0
        for (const c of currenciesToPrint) {
            let buys: number = 0.0
            let sales: number = 0.0
            let balance: number = 0.0
            let be: number | '' = ''
            let be_total: number = 0
            for (const t of this.transactions.filter(t => { return t.cur.toLowerCase() == c.toLowerCase() })) {
                if (t.trtype == TransactionType.Buy) {
                    buys += t.total
                    balance += t.unhandled_amount
                    be_total += t.unhandled_amount * t.end_ppu
                } else if (t.trtype == TransactionType.Sell) {
                    sales += t.total
                    balance -= t.unhandled_amount
                    be_total -= t.unhandled_amount * t.end_ppu
                } else if (t.trtype == TransactionType.Loss) {
                    balance = Math.max(0, balance - t.amount)
                }
            }
            if (balance > 0) be = be_total / balance
            if (be != '' && be > 0.01) be = roundTwoDecimals(be)
            balances.push({currency: c, buys, sales, gain: sales - buys, balance, be})
            maxCurrencyLength = Math.max(maxCurrencyLength, Currencies[c]?.length ?? 0)
        }

        const padWidth: number = Math.max('CURRENCY'.length, maxCurrencyLength);
        console.log('In the balance column, * denotes a close to but not zero value. Consider zeroing it using a loss transaction. The break-even price is for the remaining balance.\n')

        console.log(`${'='.repeat(padWidth + 44)}\n`)
        console.log(`${'CURRENCY'.padStart(padWidth)}       BUYS      SALES       GAIN    BALANCE\n`)

        for (const b of balances.filter(f => f.balance < 1e6 * Number.EPSILON && !this.exiled_currencies.includes(f.currency))) {
            console.log(`${(Currencies[b.currency] || b.currency).padStart(padWidth)} ${roundAndPrintTwoDecimals(b.buys, 10)} ${roundAndPrintTwoDecimals(b.sales, 10)} ` +
            `${roundAndPrintTwoDecimals(b.gain, 10)} ${'0'.padStart(10)}${Math.abs(b.balance) > 0 ? '*' : ''}`)
        }

        if (this.exiled_currencies.length > 0) {
            console.log(`${'-'.repeat(padWidth + 55)}`)
            for (const b of balances.filter(f => this.exiled_currencies.includes(f.currency))) {
                const bal = b.balance.toFixed(10)
                console.log(`${(Currencies[b.currency] || b.currency).padStart(padWidth)} ${roundAndPrintTwoDecimals(b.buys, 10)} ${roundAndPrintTwoDecimals(b.sales, 10)} ` +
                `${roundAndPrintTwoDecimals(b.gain, 10)} ${''.padStart(10 - bal.indexOf('.'))}${bal}`)
            }
        }
        console.log(`${'-'.repeat(padWidth + 55)} B/E`)

        for (const b of balances.filter(f => f.balance > 0 && !this.exiled_currencies.includes(f.currency))) {
            const bal = b.balance.toFixed(10)
            console.log(`${(Currencies[b.currency] || b.currency).padStart(padWidth)} ${roundAndPrintTwoDecimals(b.buys, 10)} ${roundAndPrintTwoDecimals(b.sales, 10)} ` +
            `${roundAndPrintTwoDecimals(b.gain, 10)} ${''.padStart(10 - bal.indexOf('.'))}${bal} ${b.be.toString().substring(0, 8)}`)
        }

        const buys = balances.map(b => b.buys).reduce((x,y) => {return x+y})
        const sales = balances.map(b => b.sales).reduce((x,y) => {return x+y})
        const gain = balances.map(b => b.gain).reduce((x,y) => {return x+y})
        console.log(`\n${'All'.padStart(padWidth)} ${roundAndPrintTwoDecimals(buys, 10)} ${roundAndPrintTwoDecimals(sales, 10)} ${roundAndPrintTwoDecimals(gain, 10)}`)
        console.log(`\n${'='.repeat(padWidth + 44)}`)
    }

    printSellTransactions(year?: number, currency?: string) {
        console.log(`${currency ? ((Currencies[currency] || currency) + ' myynnit') : 'Virtuaalivaluuttamyynnit'}${year ? (' vuonna ' + year.toString()) : ''}`)
        console.log(`${'='.repeat(68)}\n`)

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
            st.printTaxReturn()
            gains += st.tax_sell_gain
            total_sold += roundTwoDecimals(st.total)
            total_buy_cost += roundTwoDecimals(st.total_buy_cost)
        }

        console.log(`${'='.repeat(68)}\n`)
        console.log(`Myyntejä yhteensä: ${roundAndPrintTwoDecimals(total_sold)} €`)
        if (total_sold <= 1000) {
            console.log('Myyntejä enintään 1000 €, ei tarvitse ilmoittaa veroja.')
        }
        console.log(`Myytyjen valuuttojen hankintahinta yhteensä: ${roundAndPrintTwoDecimals(total_buy_cost)} €`)
        console.log(`Myyntien ja hankintahinnan erotus: ${roundAndPrintTwoDecimals(total_sold - total_buy_cost)} €`)
        console.log(`Verotuksellinen ${gains >= 0 ? 'tuotto' : 'tappio'} yhteensä: ${roundAndPrintTwoDecimals(gains)} €\n`)
    }

    printLosses(year?: number, currency?: string) {
        let total_losses: number = 0.0

        let index: number = 0
        for (const t of this.transactions.filter(t => {
                return t.trtype == TransactionType.Loss &&
                (!year || t.timestamp.getFullYear() == year) &&
                (!currency || t.cur == currency) &&
                t.total > 0
            })) {
            index++
            if (index === 1) {
                console.log(`Muut tappiot (huomioi nämä käsin jos tarpeellista)\n${'='.repeat(68)}\n`)
            }
            console.log(index + '.')
            t.printBasicInfo()
            total_losses += t.total
        }

        if (index > 0) {
            console.log(`${'='.repeat(68)}\n`)
            console.log(`Muut tappiot yhteensä: ${roundAndPrintTwoDecimals(total_losses)} €`)
        }
    }
}
