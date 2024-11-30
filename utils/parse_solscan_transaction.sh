#!/usr/bin/sh
# Parse copy-pasted data into JSON for vvvlaskin.
# The script is optimized for solscan.io transactions, but can be used for etherscan.io transactions as well by supplying ETH as $1.

transactions_file=transactions.jsonl
main_currency=${1:-SOL}
[ "$main_currency" = "sol" ] && main_currency="SOL"
[ "$main_currency" = "eth" ] && main_currency="ETH"
[ "$main_currency" != "SOL" ] && [ "$main_currency" != "ETH" ] && echo "Only SOL and ETH are supported." && exit 1

echo -n "Enter transaction signature: "
read signature

echo -n "Enter timestamp: "
read inputdate
unixtime_start=$(date -d "$inputdate" +"%s")
unixtime_end=$(expr $unixtime_start + 3600)
timestamp=$(date -d "$inputdate" +"%Y-%m-%d %H:%M:%S")

url_currency="solana"
[ "$main_currency" = "ETH" ] && url_currency="ethereum"
echo "Check price URL: https://www.coingecko.com/price_charts/$url_currency/eur/custom.json?from=$unixtime_start&to=$unixtime_end"
echo -n "Enter $main_currency price (or timestamp,price pair): "
read main_currency_price
[ "$(echo $main_currency_price | grep -o ,)" ] && main_currency_price=$(echo $main_currency_price | cut -f 2 -d ',')

default_exchange="Raydium"
[ "$main_currency" = "ETH" ] && default_exchange="Uniswap V2"
echo -n "Enter exchange [$default_exchange]: "
read exchange
[ ! "$exchange" ] && exchange="$default_exchange"

echo -n "Enter currency sold/swapped from [$main_currency]: "
read currency_sold
[ ! "$currency_sold" ] && currency_sold="$main_currency"
echo -n "Enter currency bought/swapped to [$main_currency]: "
read currency_bought
[ ! "$currency_bought" ] && currency_bought="$main_currency"
[ "$currency_sold" = "$currency_bought" ] && echo "Check currencies." && exit 1

echo -n "Enter amount of $currency_sold sold/swapped from (token balance change including fees): "
read s_amount
s_amount=$(echo $s_amount | tr -d -c '[0-9].')
echo -n "Enter amount of $currency_bought bought/swapped to (token balance change including fees): "
read b_amount
b_amount=$(echo $b_amount | tr -d -c '[0-9].')

comment="Realize value for $currency_sold->$currency_bought swap. Value based on $main_currency price: $main_currency_price"

if [ "$currency_sold" = "$main_currency" ]
then
    total=$(echo "scale=10; $s_amount * $main_currency_price" | bc)
    [ $(echo $total | cut -c 1) = "." ] && total=0$total
    sale_tr="{ \"timestamp\": \"$timestamp\", \"trtype\": \"sell\", \"cur\": \"$main_currency\", \"amount\": $s_amount, \"ppu\": $main_currency_price, \"total\": $total, \"exchange\": \"$exchange\", \"ref\": \"$signature\", \"comment\": \"$comment\" }"
    buy_tr="{ \"timestamp\": \"$timestamp\", \"trtype\": \"buy\", \"cur\": \"$currency_bought\", \"amount\": $b_amount, \"total\": $total, \"exchange\": \"$exchange\", \"ref\": \"$signature\" }"
fi

if [ "$currency_bought" = "$main_currency" ]
then
    total=$(echo "scale=10; $b_amount * $main_currency_price" | bc)
    [ $(echo $total | cut -c 1) = "." ] && total=0$total
    sale_tr="{ \"timestamp\": \"$timestamp\", \"trtype\": \"sell\", \"cur\": \"$currency_sold\", \"amount\": $s_amount, \"total\": $total, \"exchange\": \"$exchange\", \"ref\": \"$signature\", \"comment\": \"$comment\" }"
    buy_tr="{ \"timestamp\": \"$timestamp\", \"trtype\": \"buy\", \"cur\": \"$main_currency\", \"amount\": $b_amount, \"ppu\": $main_currency_price, \"total\": $total, \"exchange\": \"$exchange\", \"ref\": \"$signature\" }"
fi

if [ "$currency_sold" != "$main_currency" ] && [ "$currency_bought" != "$main_currency" ]
then
    echo -n "Enter value of sale in $main_currency: "
    read main_currency_value
    echo -n "Enter amount of $main_currency fee (from $main_currency balance change): "
    read main_currency_fee
    total=$(echo "scale=10; $main_currency_value * $main_currency_price" | bc)
    [ $(echo $total | cut -c 1) = "." ] && total=0$total
    fee=$(echo "scale=10; $main_currency_fee * $main_currency_price" | bc)
    [ $(echo $fee | cut -c 1) = "." ] && fee=0$fee
    total_with_fee=$(echo $total + $fee | bc)
    [ $(echo $total_with_fee | cut -c 1) = "." ] && total_with_fee=0$total_with_fee
    sale_tr="{ \"timestamp\": \"$timestamp\", \"trtype\": \"sell\", \"cur\": \"$currency_sold\", \"amount\": $s_amount, \"total\": $total, \"exchange\": \"$exchange\", \"ref\": \"$signature\", \"comment\": \"$comment\" }"
    fee_tr="{ \"timestamp\": \"$timestamp\", \"trtype\": \"sell\", \"cur\": \"$main_currency\", \"amount\": $main_currency_fee, \"ppu\": $main_currency_price, \"total\": $fee, \"exchange\": \"$exchange\", \"ref\": \"$signature\", \"comment\": \"Realize $main_currency fee for the swap.\" }"
    buy_tr="{ \"timestamp\": \"$timestamp\", \"trtype\": \"buy\", \"cur\": \"$currency_bought\", \"amount\": $b_amount, \"fee\": $fee, \"subtotal\": $total, \"total\": $total_with_fee, \"exchange\": \"$exchange\", \"ref\": \"$signature\" }"
fi

echo $sale_tr
[ -e $transactions_file ] && echo $sale_tr >> $transactions_file

if [ "$fee_tr" ]
then
    echo $fee_tr
    [ -e $transactions_file ] && echo $fee_tr >> $transactions_file
fi

echo $buy_tr
[ -e $transactions_file ] && echo $buy_tr >> $transactions_file

[ -e $transactions_file ] && echo "Output was also appended to $transactions_file"
