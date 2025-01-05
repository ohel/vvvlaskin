#!/usr/bin/sh
# Parse a buy/sell/conversion from confirmation email and output to JSON for vvvlaskin.
# Give email file as $1, defaults to ~/transaction.txt. File contents should be as in examples, a copy-paste from exchange confirmation.
# Coinbase [One] (buy/sell/convert) and Binance (buy) emails are supported.
# Note that the timestamps are not always correct when converting from PST to UTC, so check them manually.

# Example buy:
# You can trade your ICP immediately on Coinbase.
# Reference code ABCD123
# Payment method 1234********1234
# Date and time 2.3.2024 04:00 PST
# Amount 23.23602439 ICP
# Price @ €12.42 / ICP
# Subtotal €288.49
# Coinbase fee €11.51
# Total €300.00

# Example sell:
# You've sold €1,020.18 of RLC
# Reference code XYZ123456
# Payment method EUR Wallet
# Date and time 19.3.2024 02:13 PST
# Amount 247.511233812 RLC
# Price @ €4.18 / RLC
# Subtotal €1,035.61
# Coinbase fee €15.43
# Total €1,020.18

t_file=${1:-~/transaction.txt}
transactions_file=transactions.jsonl
[ ! -e $t_file ] && echo "File $t_file doesn't exist." && exit 1

output() {
    error=0
    [ ! "$t_exchange" ] && echo "exchange error" 1>&2 && error=1
    [ ! "$t_timestamp" ] && echo "timestamp error" 1>&2 && error=1
    [ ! "$t_trtype" ] && echo "trtype error" 1>&2 && error=1
    [ ! "$t_cur" ] && echo "cur error" 1>&2 && error=1
    [ ! "$t_ref" ] && echo "ref error" 1>&2 && error=1
    [ ! "$t_ppu" ] && echo "ppu error" 1>&2 && error=1
    [ ! "$t_amount" ] && echo "amount error" 1>&2 && error=1
    [ ! "$t_fee" ] && echo "fee error" 1>&2 && error=1
    [ ! "$t_subtotal" ] && echo "subtotal error" 1>&2 && error=1
    [ ! "$t_total" ] && echo "total error" 1>&2 && error=1
    [ "$t_comment" ] && output_comment=", \"comment\": \"$t_comment\""

    [ $error -eq 1 ] && echo "{ \"timestamp\": \"$t_timestamp\", \"trtype\": \"$t_trtype\", \"cur\": \"$t_cur\", \"amount\": $t_amount, \"ppu\": $t_ppu, \"fee\": $t_fee, \"subtotal\": $t_subtotal, \"total\": $t_total, \"exchange\": \"$t_exchange\", \"ref\": \"$t_ref\"$output_comment }" 1>&2

    if [ $error -eq 0 ]
    then
        t_out="{ \"timestamp\": \"$t_timestamp\", \"trtype\": \"$t_trtype\", \"cur\": \"$t_cur\", \"amount\": $t_amount, \"ppu\": $t_ppu, \"fee\": $t_fee, \"subtotal\": $t_subtotal, \"total\": $t_total, \"exchange\": \"$t_exchange\", \"ref\": \"$t_ref\"$output_comment }"
        echo $t_out
        [ -e $transactions_file ] && echo "Output was also appended to $transactions_file" && echo $t_out >> $transactions_file
    fi
}

if [ "$(grep Coinbase "$t_file")" ]
then
    t_exchange=Coinbase

    t_raw_ts=$(grep -Po "(?<=Date and time[ \t]).*" "$t_file")
    if [ "$(echo $t_raw_ts | grep "/")" ]
    then
        # If year first, then format is YYYY/MM/DD.
        t_raw_ts_year=$(echo $t_raw_ts | cut -f 1 -d '/')
        t_raw_ts_month=$(echo $t_raw_ts | cut -f 2 -d '/')
        t_raw_ts_day=$(echo $t_raw_ts | cut -f 3 -d '/' | cut -f 1 -d ' ')
    else
        # If day first, then format is DD.MM.YYYY.
        t_raw_ts_day=$(echo $t_raw_ts | cut -f 1 -d '.')
        t_raw_ts_month=$(echo $t_raw_ts | cut -f 2 -d '.')
        t_raw_ts_year=$(echo $t_raw_ts | cut -f 3 -d '.' | cut -f 1 -d ' ')
    fi
    t_timestamp=$(date -d "$t_raw_ts_year-$t_raw_ts_month-$t_raw_ts_day $(echo $t_raw_ts | cut -f 2- -d ' ')" +"%Y-%m-%d %H:%M")
    echo "Double check the timestamp as conversion might be off by 12 hours."

    t_ref=$(grep -Po "(?<=Reference code[ \t]).*" "$t_file")
    t_amount=$(grep -Po "(?<=Amount[ \t])[0-9.,]*" "$t_file" | tr -d ',')
    t_fee=$(grep -Po "(?<=Coinbase fee[ \t]€).*" "$t_file")
    [ "$(grep -Po "Coinbase One[ \t]-" "$t_file")" ] && t_fee=0
    [ "$(grep -Po "Coinbase One[ \t]-" "$t_file")" ] && echo "Double check the fee as you're using Coinbase One."

    [ "$(grep "You can trade" "$t_file")" ] && t_trtype=buy
    [ "$(grep "You've sold" "$t_file")" ] && t_trtype=sell

    # Handle conversion as sell+buy transaction pair.
    if [ "$(grep "You converted" "$t_file")" ]
    then
        t_subtotal=$(grep -Po "(?<=You converted[ \t]€)[0-9.]*" "$t_file" | tr -d ',')
        t_total=$(echo "$t_subtotal - $t_fee" | bc)
        t_amount_bought=$t_amount
        t_amount_sold=$(grep -Po "(?<=Total[ \t])[0-9.,]*" "$t_file" | tr -d ',')

        t_trtype=sell
        t_amount=$t_amount_sold
        t_cur=$(grep -Po "(?<=Total[ \t])[0-9.,].*" "$t_file" | cut -f 2 -d ' ')
        t_cur_bought=$(grep -o "Your .* is now available" "$t_file" | cut -f 2 -d ' ')
        t_comment="Converted $t_cur to $t_cur_bought."
        t_ppu=$(echo "scale=10; $t_subtotal / $t_amount_sold" | bc)
        [ "$(echo "$t_ppu" | cut -c 1)" = "." ] && t_ppu="0$t_ppu"
        output

        t_trtype=buy
        t_amount=$t_amount_bought
        t_cur=$t_cur_bought
        t_fee=0
        t_subtotal=$t_total
        t_ppu=$(echo "scale=10; $t_total / $t_amount_bought" | bc)
        [ "$(echo "$t_ppu" | cut -c 1)" = "." ] && t_ppu="0$t_ppu"
        output
    else
        t_cur=$(grep "Amount" "$t_file" | grep -o "[0-9].*" | cut -f 2 -d ' ')
        t_ppu=$(grep -Po "(?<=Price[ \t]@ €)[^ ]*" "$t_file" | tr -d ',')
        t_subtotal=$(grep -Po "(?<=Subtotal[ \t]€).*" "$t_file" | tr -d ',')
        t_total=$(grep -Po "(?<=Total[ \t]€).*" "$t_file" | tr -d ',')

        output
    fi

elif [ "$(grep Binance "$t_file")" ]
then
    t_exchange=Binance

    t_timestamp=$(grep -Po "(?<=Date & Time:).*" "$t_file" | grep -o "[0-9].*")
    t_trtype=buy
    # TODO [ "$(grep sale "$t_file")" ] && t_trtype=sell

    t_cur=$(grep "Final Amount" "$t_file" | grep -o "[^ .0-9]*$")
    t_ref=$(grep -Po "(?<=Transaction ID:).*" "$t_file" | tr -dc [:alnum:])
    t_ppu=$(grep "Exchange Rate" "$t_file" | grep -o "$t_cur.*" | tr -dc '.0-9')
    t_amount=$(grep "Final Amount" "$t_file" | cut -f 2 -d ':' | tr -dc '.0-9')
    t_fee=$(grep -Po "(?<=^Fee:).*" "$t_file" | tr -dc '.0-9')
    t_total=$(grep -Po "(?<=^Amount:).*" "$t_file" | tr -dc '.0-9')
    t_subtotal=$(echo "$t_total - $t_fee" | bc)

    output
fi
