/*
    Copyright 2022, 2024 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { TransactionType } from './transaction-type'

export interface BasicTransactionInfo {

    readonly trtype: TransactionType
    readonly timestamp: Date
    readonly cur: string // The virtual currency.
    readonly amount: number // Amount of virtual currency.
    readonly ppu: number // Nominal PPU = price per unit of currency (usually per coin).
    readonly fee: number // Fee in fiat currency.
    readonly subtotal: number // Fiat currency price without fees.
    readonly total: number // The total fiat currency price. For sales: total = subtotal - fee. For buys: total = subtotal + fee.

    readonly comment?: string
    readonly vcfee?: number // Fee in virtual currency: <transaction end amount> = <amount> - <vcfee>; <end ppu> = <total> / <transaction end amount>.
    readonly exchange?: string // Exchange name.
    readonly ref?: string // Transaction reference.

}
