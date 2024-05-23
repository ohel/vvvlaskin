/*
    Copyright 2022, 2024 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { BasicTransactionInfo } from './basic-transaction-info'
import { TransactionType } from './transaction-type'
import { printTwoDecimals } from './utils'
import Currencies from './currencies'

export abstract class BaseTransaction implements BasicTransactionInfo {

    readonly trtype: TransactionType
    readonly timestamp: Date
    readonly cur: string
    readonly amount: number
    readonly ppu: number
    readonly fee: number
    readonly subtotal: number
    readonly total: number

    readonly comment?: string
    readonly vcfee: number // Note: will always exist if only as 0.
    readonly exchange?: string
    readonly ref?: string

    // The end PPU, calculated using total, fees and amount. When calculating sell gains this is used to include fees per unit of currency, in a way. Otherwise it would be difficult to determine what fees to include where, especially if handling only a partial transaction amount.
    readonly end_ppu: number
    unhandled_amount: number

    constructor(json: BasicTransactionInfo) {
        this.timestamp = json.timestamp
        this.cur = json.cur
        this.amount = json.amount
        this.ppu = json.ppu
        this.fee = json.fee
        this.subtotal = json.subtotal
        this.total = json.total
        this.vcfee = json.vcfee || 0
        if (json.comment) this.comment = json.comment
        if (json.exchange) this.exchange = json.exchange
        if (json.ref) this.ref = json.ref

        let factor = 0
        if (json.trtype == TransactionType.Buy) factor = -1 // For buys, fee is subtracted to get the end amount.
        if (json.trtype == TransactionType.Sell) factor = 1 // For sales, fee is added to get the end amount.
        this.unhandled_amount = this.amount + factor * this.vcfee
        this.end_ppu = this.total / this.unhandled_amount
    }

    printBasicInfo(): void {
        console.log(
`${this.timestamp.toISOString().slice(0, 19).replace('T', ' ')} ${Currencies[this.cur] || this.cur}
    Määrä: ${this.amount} ${this.cur}
    Arvo: ${printTwoDecimals(this.total)} €
`)
    }
}
