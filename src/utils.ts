/*
    Copyright 2024 Olli Helin
    This file is part of Virtuaalivaluuttaverotuslaskin, a free software released under the terms of the
    GNU General Public License v3: http://www.gnu.org/licenses/gpl-3.0.en.html
*/

const printTwoDecimals = (num: number): string => {
    let retval: string = num.toString()
    if (retval.indexOf('.') < 0) {
        retval = retval + '.00'
    } else if (retval.indexOf('.') == retval.length - 2) {
        retval = retval + '0'
    }
    return retval
}

const roundAndPrintTwoDecimals = (num: number, pad_length?: number): string => {
    let retval: string =
        -0.005 < num && num < 0.005 ? '0.00' :
        (+(Math.round(+(num * 100)) + 'e-2')).toString()
    if (retval.indexOf('.') < 0) {
        retval = retval + '.00'
    } else if (retval.indexOf('.') == retval.length - 2) {
        retval = retval + '0'
    }
    if (!pad_length) return retval
    return retval.padStart(pad_length)
}

const roundTwoDecimals = (num: number): number => {
    return +(Math.round(+(num + 'e+2')) + 'e-2')
}

export { printTwoDecimals, roundAndPrintTwoDecimals, roundTwoDecimals }
