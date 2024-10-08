/*
    Copyright 2024 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { TransactionType } from './transaction-type'
import { BaseTransaction } from './base-transaction'

// Use loss transaction to fix balances. They do not affect tax return calculations. Since amounts are handled so that balances cannot be negative, a huge loss transaction amount can be used to zero balances. A negative balance can be zeroed with a zero amount loss transaction.
// Take into consideration losses manually in your tax return if relevant.
export class LossTransaction extends BaseTransaction {
    readonly trtype: TransactionType = TransactionType.Loss
}
