/*
    Copyright 2022, 2024, 2026 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { TransactionType } from './transaction-type'
import { BasicTransactionInfo } from './basic-transaction-info'

export class RawTransaction implements BasicTransactionInfo {

    readonly trtype: TransactionType
    readonly timestamp: Date
    readonly cur: string
    readonly amount: number
    readonly total: number
    readonly ppu: number
    readonly fee: number
    readonly subtotal: number
    readonly vcfee: number

    readonly comment?: string
    readonly exchange?: string
    readonly ref?: string

    readonly ignore: boolean

    private readonly TOTAL_CHECK_ACCURACY: number = 0.999999

    constructor(jsonl: string) {
        try {
            this.trtype = TransactionType.Other

            this.ignore = !jsonl

            let json: any
            if (!this.ignore) {
                json = JSON.parse(jsonl)
                this.ignore = !!json.ignore
            }

            if (this.ignore) {
                this.timestamp = new Date()
                this.cur = ""
                this.amount = 0
                this.total = 0
                this.ppu = 0
                this.fee = 0
                this.subtotal = 0
                this.vcfee = 0
                return
            }

            if (json.trtype.match(/^[Bb][Uu]?[Yy]?/)) this.trtype = TransactionType.Buy
            if (json.trtype.match(/^[Ss][Ee]?[Ll]?[Ll]?/)) this.trtype = TransactionType.Sell
            if (json.trtype.match(/^[Ll][Oo]?[Ss]?[Ss]?/)) this.trtype = TransactionType.Loss
            if (json.trtype.match(/^[Tt][Rr]?[Aa]?[Nn]?[Ss]?[Ff]?[Ee]?[Rr]?/)) this.trtype = TransactionType.Transfer
            if (this.trtype === TransactionType.Other) throw Error('Unknown transaction type.')

            this.timestamp = new Date(json.timestamp)
            if (!json.cur) throw Error('Transaction is missing currency.')
            if (!json.amount) throw Error('Transaction is missing amount.')
            if (!json.total && json.total !== 0) {
                if (this.trtype == TransactionType.Buy ||
                    this.trtype == TransactionType.Sell)
                    throw Error('Transaction is missing total.')
            }
            this.cur = json.cur
            this.amount = json.amount
            this.total = json.total || 0
            this.subtotal = json.subtotal // Optional.
            this.ppu = json.ppu || 0
            this.fee = json.fee || 0
            this.vcfee = json.vcfee || 0
            this.comment = json.comment // Optional.
            this.exchange = json.exchange // Optional.
            this.ref = json.ref // Optional.

            if (this.trtype == TransactionType.Buy) {
                if (!this.subtotal) this.subtotal = this.total - this.fee

                if ((this.total * (2-this.TOTAL_CHECK_ACCURACY) < this.subtotal + this.fee) ||
                    (this.total * this.TOTAL_CHECK_ACCURACY > this.subtotal + this.fee))
                    throw Error('Total, subtotal and fee do not match.')
            }

            if (this.trtype == TransactionType.Sell) {
                if (!this.subtotal) this.subtotal = this.total + this.fee

                if ((this.total * (2-this.TOTAL_CHECK_ACCURACY) < this.subtotal - this.fee) ||
                    (this.total * this.TOTAL_CHECK_ACCURACY > this.subtotal - this.fee))
                    throw Error('Total, subtotal and fee do not match.')
            }

        } catch (err) {
            console.error('Invalid transaction line: ' + jsonl)
            console.error(err)
            process.exit(1)
        }
    }
}
