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
    readonly amount: number // Amount of virtual currency bought or sold.
    readonly ppu: number // Nominal PPU = price per unit of currency (usually per coin).
    readonly total: number // The total fiat currency price. For sales should be: <total> = <subtotal> - <fee>. For buys should be: <total> = <subtotal> + <fee>.
    readonly subtotal: number // Fiat currency price without fees.
    readonly fee: number // Fee in fiat currency.
    readonly vcfee: number // Fee in virtual currency. For buys: <end ppu> = <total> / (<amount> - <vcfee>). For sales: <end ppu> = <total> / (<amount> + <vcfee>). Note: only mark the vcfee for a sale if it affects the same balance/wallet you are selling from. Otherwise convert it to fiat fee, or mark the fee as its own separate sale (if different virtual currency).

    readonly comment?: string
    readonly exchange?: string // Exchange name.
    readonly ref?: string // Transaction reference.

}
