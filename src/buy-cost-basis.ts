/*
    Copyright 2022, 2024 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { BaseTransaction } from './base-transaction'
import { HMOType } from './hmo-type'

export class BuyCostBasis {

    readonly transaction: BaseTransaction
    readonly amount: number
    readonly tax_gain: number
    readonly hmo_type: HMOType = HMOType.None

    constructor(transaction: BaseTransaction, amount: number, tax_gain: number, hmo_type: HMOType) {
        this.transaction = transaction
        this.amount = amount
        this.tax_gain = tax_gain
        this.hmo_type = hmo_type
    }
}
