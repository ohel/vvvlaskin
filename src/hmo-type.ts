/*
    Copyright 2024 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

// Hankintameno-olettama
export enum HMOType {
    None = '',
    HMO20 = ' (20% HMO)', // Buy cost considered 20% of sale price.
    HMO40 = ' (40% HMO)' // Buy cost considered 40% of sale price.
}
