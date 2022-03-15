/*
   Copyright 2022 Olli Helin
   This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
   GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { TransactionType } from "./transaction-type"

export interface BasicTransactionInfo {

    readonly trtype: TransactionType
    readonly timestamp: Date
    readonly cur: string // Currency.
    readonly amount: number
    readonly ppu: number // Nominal PPU = price per unit of currency (usually per coin).
    readonly fee: number // Fee in fiat currency.
    readonly subtotal: number // Price without fees.
    readonly total: number // The end price. For sales: total = subtotal - fee. For buys: total = subtotal + fee.

    readonly comment?: string
    readonly vcfee?: number // Fee in virtual currency. Transaction end amount = amount - vcfee, and end ppu = total / transaction end amount.
    readonly exchange?: string
    readonly ref?: string

}
