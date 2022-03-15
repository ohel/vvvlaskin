/*
   Copyright 2022 Olli Helin
   This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
   GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { BasicTransactionInfo } from "./basic-transaction-info"
import { TransactionType } from "./transaction-type"

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
    readonly vcfee?: number
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
        if (json.comment) this.comment = json.comment
        if (json.vcfee) this.vcfee = json.vcfee
        if (json.exchange) this.exchange = json.exchange
        if (json.ref) this.ref = json.ref

        this.unhandled_amount = (this.vcfee ? (this.amount - this.vcfee) : this.amount)
        this.end_ppu = this.total / this.unhandled_amount
    }
}
