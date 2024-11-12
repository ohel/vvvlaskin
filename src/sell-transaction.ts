/*
    Copyright 2022, 2024 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { TransactionType } from './transaction-type'
import { BaseTransaction } from './base-transaction'
import { BasicTransactionInfo } from './basic-transaction-info'
import { BuyCostBasis } from './buy-cost-basis'
import { roundAndPrintTwoDecimals, printAtLeastTwoDecimals, roundTwoDecimals } from './utils'
import { HMOType } from './hmo-type'
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

        const previousBuyTransactions = previousTransactions.filter(t =>
            t.trtype == TransactionType.Buy && t.cur == this.cur)

        this.total_buy_cost = 0.0
        this.tax_sell_gain = 0.0

        for (let bt of previousBuyTransactions) {
            if (bt.unhandled_amount < Number.EPSILON) continue
            let amount: number = 0.0

            // Check if buy transaction covers this sale fully or only partially.
            if (bt.unhandled_amount >= this.unhandled_amount) {
                amount = this.unhandled_amount
                bt.unhandled_amount -= this.unhandled_amount
                this.unhandled_amount = 0
            } else {
                amount = bt.unhandled_amount
                this.unhandled_amount -= bt.unhandled_amount
                bt.unhandled_amount = 0
            }
            const cost: number = roundTwoDecimals(amount * bt.end_ppu)
            const partial_sell_total: number = roundTwoDecimals(amount * this.end_ppu)
            const hmo_factor: number = this.checkIfTenYearsHavePassed(this.timestamp, bt.timestamp) ? 0.4 : 0.2

            let tax_gain: number = partial_sell_total - cost
            let hmo_type: HMOType = HMOType.None
            if (hmo_factor * partial_sell_total > cost) {
                tax_gain = partial_sell_total * (1 - hmo_factor)
                hmo_type = hmo_factor > 0.3 ? HMOType.HMO40 : HMOType.HMO20
            }
            tax_gain = roundTwoDecimals(tax_gain)

            this.buy_cost_basis.push(new BuyCostBasis(bt, amount, tax_gain, hmo_type))

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

    // This takes leap years into account by comparing dates by their numbers directly.
    private checkIfTenYearsHavePassed(newer: Date, older: Date): boolean {
        const year_diff = newer.getFullYear() - older.getFullYear()
        if (year_diff < 10) return false
        if (year_diff > 10) return true

        const month_diff = newer.getMonth() - older.getMonth()
        if (month_diff < 0) return false
        if (month_diff > 0) return true

        return newer.getDate() >= older.getDate()
    }

    printTaxReturn(): void {
        console.log(
`Myynti [${Currencies[this.cur] || this.cur}] ${this.timestamp.toISOString().slice(0, 19).replace('T', ' ')} (pörssi: ${this.exchange || '-'}, viite: ${this.ref || '-'})

    Määrä: ${this.amount + this.vcfee} ${this.cur}${this.vcfee > 0 ? ` (josta myyntikuluja ${this.vcfee} ${this.cur})` : ''}
    Myyntihinta: ${printAtLeastTwoDecimals(this.total)} € (${this.end_ppu} €/${this.cur})

    Hankinnat, joita myytiin:`)

        for (let i in this.buy_cost_basis) {
            let buy = this.buy_cost_basis[i].transaction
            console.log(`    ${+i+1}. ${buy.timestamp.toISOString().slice(0, 19).replace('T', ' ')} (pörssi: ${buy.exchange || '-'}, viite: ${buy.ref || '-'})`)
            console.log(`       Määrä: ${this.buy_cost_basis[i].amount} ${buy.cur}`)
            console.log(`       Hankintakustannus: ${roundAndPrintTwoDecimals(buy.end_ppu * this.buy_cost_basis[i].amount)} € (${buy.end_ppu} €/${buy.cur})`)
            console.log(`       ${this.buy_cost_basis[i].tax_gain >= 0 ? 'Tuotto' : 'Tappio'}: ${printAtLeastTwoDecimals(this.buy_cost_basis[i].tax_gain)} €${this.buy_cost_basis[i].hmo_type.toString()}`)
        }
        console.log()
        console.log(`    ${this.tax_sell_gain >= 0 ? 'Tuotto' : 'Tappio'} yhteensä: ${printAtLeastTwoDecimals(this.tax_sell_gain)} €`)
        console.log('--------------------------------------------------------------------')
    }

}
