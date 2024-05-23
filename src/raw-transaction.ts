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
    readonly ppu: number
    readonly fee: number
    readonly subtotal: number
    readonly total: number

    readonly comment?: string
    readonly vcfee?: number
    readonly exchange?: string
    readonly ref?: string

    readonly ignore: boolean

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

            // For bookkeeping transactions some normally mandatory properties are not required.
            const bookkeeping = [TransactionType.Loss, TransactionType.Transfer].includes(this.trtype)

            this.timestamp = new Date(json.timestamp)
            this.cur = json.cur
            this.amount = json.amount
            this.ppu = bookkeeping ? 0 : json.ppu
            this.fee = bookkeeping ? 0 : json.fee
            this.subtotal = bookkeeping ? 0 : json.subtotal
            this.total = json.total
            if (json.comment) this.comment = json.comment
            if (json.vcfee) this.vcfee = json.vcfee
            if (json.exchange) this.exchange = json.exchange
            if (json.ref) this.ref = json.ref
        } catch (err) {
            console.error('Invalid transaction line:')
            console.error(err)
            process.exit(1)
        }
    }
}
