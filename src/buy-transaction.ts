/*
   Copyright 2022 Olli Helin
   This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
   GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

import { TransactionType } from "./transaction-type"
import { BaseTransaction } from "./base-transaction"
import { BasicTransactionInfo } from "./basic-transaction-info"

export class BuyTransaction extends BaseTransaction {
    readonly trtype: TransactionType = TransactionType.Buy
}
