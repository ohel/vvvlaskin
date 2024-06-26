/*
    Copyright 2022, 2024 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

export enum TransactionType {
    Buy = 'Buy',
    Sell = 'Sell',
    Loss = 'Loss', // Just for bookkeeping, used in calculating current balance.
    Transfer = 'Transfer' // Just for bookkeeping, not used for calculations.
}
