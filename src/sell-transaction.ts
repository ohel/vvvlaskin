/*
    Copyright 2022, 2024 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { TransactionType } from './transaction-type'
import { BaseTransaction } from './base-transaction'
import { BasicTransactionInfo } from './basic-transaction-info'
import { BuyCostBasis } from './buy-cost-basis'
import { roundAndPrintTwoDecimals, printTwoDecimals, roundTwoDecimals } from './utils'
import Currencies from './currencies'

export class SellTransaction extends BaseTransaction {
    readonly trtype: TransactionType = TransactionType.Sell

    // The actual gain/loss made with the transaction.
    readonly true_sell_gain: number

    // The gain/loss for taxation. Computed per buy transaction and summed together.
    readonly tax_sell_gain: number

    // Which buy transactions does this sell cover and how.
    readonly buy_cost_basis: BuyCostBasis[] = []

    // Total buying cost of sales. Can be also computed from buy_cost_basis.
    readonly total_buy_cost: number

    constructor(json: BasicTransactionInfo, previousTransactions: BaseTransaction[]) {
        super(json)
        const previousBuys = previousTransactions.filter(t =>
            t.trtype == TransactionType.Buy && t.cur == this.cur)

        this.total_buy_cost = 0.0
        this.tax_sell_gain = 0.0

        for (let buy of previousBuys) {
            if (buy.unhandled_amount < Number.EPSILON) continue
            let amount: number = 0.0

            if (buy.unhandled_amount >= this.unhandled_amount) {
                amount = this.unhandled_amount
                buy.unhandled_amount -= this.unhandled_amount
                this.unhandled_amount = 0
            } else {
                amount = buy.unhandled_amount
                this.unhandled_amount -= buy.unhandled_amount
                buy.unhandled_amount = 0
            }
            let cost: number = roundTwoDecimals(amount * buy.end_ppu)
            let partial_sell_total: number = roundTwoDecimals(amount * this.end_ppu)

            // Calculate tax for each buy transaction separately.
            let tax_gain: number = this.calculateTaxGain(partial_sell_total, cost)
            this.buy_cost_basis.push(new BuyCostBasis(buy, amount, tax_gain))

            this.total_buy_cost += cost
            this.tax_sell_gain += tax_gain

            if (this.unhandled_amount < Number.EPSILON) break
        }

        this.total_buy_cost = roundTwoDecimals(this.total_buy_cost)
        this.tax_sell_gain = roundTwoDecimals(this.tax_sell_gain)
        this.true_sell_gain = roundTwoDecimals(this.total - this.total_buy_cost)

        // Ignore if rounding errors result in less than a cent of error.
        if (this.unhandled_amount > 0 && this.unhandled_amount * this.end_ppu > 0.01) {
            console.log('Warning: sell transaction covers more than known buy transactions. Unhandled amount: ' + this.unhandled_amount)
        }
    }

    // Apply minimum tax requirements + hankintameno-olettama (HMO).
    // Round result to 2 digits.
    // TODO: check if buy date is old enough (10+ years) for -40% (0.6) HMO instead of -20% (0.8).
    private calculateTaxGain(sell_total: number, buy_cost: number): number {
        return roundTwoDecimals(Math.min(sell_total - Math.max(buy_cost, 0.2 * sell_total), 0.8 * sell_total))
    }

    printTaxReport(): void {
        console.log(
`Myynti [${Currencies[this.cur] || this.cur}] ${this.timestamp.toISOString().slice(0, 19).replace('T', ' ')} (pörssi: ${this.exchange || '-'}, viite: ${this.ref || '-'})

    Määrä: ${this.amount} ${this.cur}
    Myyntihinta: ${printTwoDecimals(this.total)} € (${this.end_ppu} €/${this.cur})

    Hankinnat, joita myytiin:`)

        for (let i in this.buy_cost_basis) {
            let buy = this.buy_cost_basis[i].transaction
            console.log(`    ${+i+1}. ${buy.timestamp.toISOString().slice(0, 19).replace('T', ' ')} (pörssi: ${buy.exchange || '-'}, viite: ${buy.ref || '-'})`)
            console.log(`       Määrä: ${this.buy_cost_basis[i].amount} ${buy.cur}`)
            console.log(`       Hankintakustannus: ${roundAndPrintTwoDecimals(buy.end_ppu * this.buy_cost_basis[i].amount)} € (${buy.end_ppu} €/${buy.cur})`)
            console.log(`       Verotuksessa ilmoitettava ${this.buy_cost_basis[i].tax_gain >= 0 ? 'tuotto' : 'tappio'}: ${printTwoDecimals(this.buy_cost_basis[i].tax_gain)} €`)
        }
        console.log()
        console.log(`    Verotuksessa ilmoitettava ${this.tax_sell_gain >= 0 ? 'tuotto' : 'tappio'} yhteensä: ${printTwoDecimals(this.tax_sell_gain)} €`)
        console.log('--------------------------------------------------------------------')
    }

}
