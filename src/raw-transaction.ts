/*
    Copyright 2022, 2024 Olli Helin
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
            this.ignore = !jsonl
            if (this.ignore) {
                return
            }
            const json = JSON.parse(jsonl)
            this.ignore = !!json.ignore
            if (this.ignore) {
                return
            }

            let trtype_string: string
            if (json.trtype.match(/^[Bb][Uu]?[Yy]?/)) trtype_string = 'Buy'
            if (json.trtype.match(/^[Ss][Ee]?[Ll]?[Ll]?/)) trtype_string = 'Sell'
            if (json.trtype.match(/^[Ll][Oo]?[Ss]?[Ss]?/)) trtype_string = 'Loss'
            if (json.trtype.match(/^[Tt][Rr]?[Aa]?[Nn]?[Ss]?[Ff]?[Ee]?[Rr]?/)) trtype_string = 'Transfer'
            if (!trtype_string) throw Error('Unknown transaction type.')
            this.trtype = TransactionType[trtype_string]

            this.timestamp = new Date(json.timestamp)
            if (!json.cur) throw Error('Transaction is missing currency.')
            if (!json.amount) throw Error('Transaction is missing amount.')
            if (!json.total) {
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
