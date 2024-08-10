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
import { roundAndPrintTwoDecimals, roundTwoDecimals, printTwoDecimals } from './utils'
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
            balance: number
        }[] = []

        let maxCurrencyLength: number = 0
        for (const c of currenciesToPrint) {
            let buys: number = 0.0
            let sales: number = 0.0
            let balance: number = 0.0
            for (const t of this.transactions.filter(t => { return t.cur.toLowerCase() == c.toLowerCase() })) {
                if (t.trtype == TransactionType.Buy) {
                    buys += t.total
                    balance += t.unhandled_amount
                } else if (t.trtype == TransactionType.Sell) {
                    sales += t.total
                    balance -= t.unhandled_amount
                } else if (t.trtype == TransactionType.Loss) {
                    balance = Math.max(0, balance - t.amount)
                }
            }
            balances.push({currency: c, buys, sales, gain: sales - buys, balance})
            maxCurrencyLength = Math.max(maxCurrencyLength, Currencies[c]?.length ?? 0)
        }

        const padWidth: number = Math.max('CURRENCY'.length, maxCurrencyLength);
        const pad: string = '='.repeat(padWidth);

        console.log(`${pad}============================================\n`)
        console.log(`${'CURRENCY'.padStart(padWidth)}       BUYS      SALES       GAIN    BALANCE\n`)
        for (const t of balances) {
            console.log(`${(Currencies[t.currency] || t.currency).padStart(padWidth)} ${roundAndPrintTwoDecimals(t.buys, 10)} ${roundAndPrintTwoDecimals(t.sales, 10)} ` +
            `${roundAndPrintTwoDecimals(t.gain, 10)} ${roundAndPrintTwoDecimals(t.balance, 10)}`)
        }
        const buys = balances.map(t => t.buys).reduce((x,y) => {return x+y})
        const sales = balances.map(t => t.sales).reduce((x,y) => {return x+y})
        const gain = balances.map(t => t.gain).reduce((x,y) => {return x+y})
        console.log(`\n${'All'.padStart(padWidth)} ${roundAndPrintTwoDecimals(buys, 10)} ${roundAndPrintTwoDecimals(sales, 10)} ${roundAndPrintTwoDecimals(gain, 10)}`)
        console.log(`\n${pad}============================================`)
    }

    printSellTransactions(year?: number, currency?: string) {
        console.log(`${currency ? ((Currencies[currency] || currency) + ' myynnit') : 'Virtuaalivaluuttamyynnit'}${year ? (' vuonna ' + year.toString()) : ''}`)
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
            st.printTaxReturn()
            gains += st.tax_sell_gain
            total_sold += roundTwoDecimals(st.total)
            total_buy_cost += roundTwoDecimals(st.total_buy_cost)
        }

        console.log('====================================================================\n')
        console.log(`Myyntejä yhteensä: ${roundAndPrintTwoDecimals(total_sold)} €`)
        if (total_sold <= 1000) {
            console.log('Myyntejä enintään 1000 €, ei tarvitse ilmoittaa veroja.')
        }
        console.log(`Myytyjen valuuttojen hankintahinta yhteensä: ${roundAndPrintTwoDecimals(total_buy_cost)} €`)
        console.log(`Myyntien ja hankintahinnan erotus: ${roundAndPrintTwoDecimals(total_sold - total_buy_cost)} €`)
        console.log(`Verotuksellinen ${gains >= 0 ? 'tuotto' : 'tappio'} yhteensä: ${printTwoDecimals(gains)} €\n`)
    }

    printLosses(year?: number) {
        let total_losses: number = 0.0

        let index: number = 0
        for (const t of this.transactions.filter(t => {
                return t.trtype == TransactionType.Loss &&
                (!year || t.timestamp.getFullYear() == year)
            })) {
            index++
            if (index === 1) {
                console.log('Muut tappiot (huomioi nämä käsin jos tarpeellista)\n====================================================================\n')
            }
            console.log(index + '.')
            t.printBasicInfo()
            total_losses += t.total
        }

        if (index > 0) {
            console.log('====================================================================\n')
            console.log(`Muut tappiot yhteensä: ${roundAndPrintTwoDecimals(total_losses)} €`)
        }
    }
}
