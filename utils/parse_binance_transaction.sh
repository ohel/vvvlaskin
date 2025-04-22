#!/usr/bin/sh
# Parse copy-pasted data into JSON for vvvlaskin.
# The script is optimized for Binance spot transactions.

transactions_file=transactions.jsonl

echo -n "Enter pair [USDC/EUR]: "
read pair
[ ! "$pair" ] && pair="USDC/EUR"

cur1=$(echo $pair | cut -f 1 -d '/')
cur2=$(echo $pair | cut -f 2 -d '/')

while [ "$bos" != "b" ] && [ "$bos" != "s" ]
do
    echo -n "(b)uy or (s)ell $cur1? [b]: "
    read bos
    [ ! "$bos" ] && bos="b"
done

cur_sold=""
cur_bought=""
if [ "$cur1" = "EUR" ]
then
    # We are not selling EUR for crypto, convert to buying crypto instead.
    if [ $bos = "b" ]
    then
        bos="s" && cur_sold=$cur2
    else
        bos="b" && cur_bought=$cur2
    fi
elif [ "$cur2" = "EUR" ]
then
    [ $bos = "b" ] && cur_bought=$cur1
    [ $bos = "s" ] && cur_sold=$cur1
else
    [ $bos = "b" ] && cur_bought=$cur1 && cur_sold=$cur2
    [ $bos = "s" ] && cur_sold=$cur1 && cur_bought=$cur2
fi

echo -n "Enter transaction reference: "
read t_ref

echo -n "Enter timestamp: "
read timestamp

if [ "$cur_bought" ] && [ "$cur_sold" ] # Case: bought crypto with another crypto
then
    echo -n "Enter amount (total) of $cur_sold sold (converted): "
    read s_amount
    s_amount=$(echo $s_amount | tr -d -c '[0-9].')

    echo -n "Enter amount (total) of $cur_bought bought (converted), including fees: "
    read b_amount
    b_amount=$(echo $b_amount | tr -d -c '[0-9].')

    cs_fee=0
    echo -n "Enter fee in $cur_bought [0]: "
    read cb_fee
    [ ! "$cb_fee" ] && cb_fee=0

    [ $cur_sold = "USDC" ] || [ $cur_bought = "USDC" ] && url_currency=usdc
    [ $cur_sold = "ETH" ] || [ $cur_bought = "ETH" ] && url_currency=ethereum
    if [ "$url_currency" ]
    then
        unixtime_start=$(date -d "$timestamp" +"%s")
        unixtime_end=$(expr $unixtime_start + 3600)
        echo "Check price URL: https://www.coingecko.com/price_charts/$url_currency/eur/custom.json?from=$unixtime_start&to=$unixtime_end"
        echo -n "Enter $url_currency price (or timestamp,price pair): "
        read url_cur_price
        [ "$(echo $url_cur_price | grep -o ,)" ] && url_cur_price=$(echo $url_cur_price | cut -f 2 -d ',')
        [ $cur_sold = "USDC" ] || [ $cur_sold = "ETH" ] && cs_price=$url_cur_price
        [ $cur_bought = "USDC" ] || [ $cur_bought = "ETH" ] && cb_price=$url_cur_price
    else
        echo -n "Enter price of 1 $cur_sold in EUR: "
        read cs_price
    fi

    if [ "$cs_price" ]
    then
        total=$(echo "scale=10; $s_amount * $cs_price" | bc)
        [ $(echo $total | cut -c 1) = "." ] && total=0$total
    else
        if [ ! "$cb_price" ]
        then
            echo -n "Enter price of 1 $cur_bought in EUR: "
            read cb_price
            [ ! "$cb_price" ] && echo "Error." && exit 1
        fi
        total=$(echo "scale=10; $b_amount * $cb_price" | bc)
        [ $(echo $total | cut -c 1) = "." ] && total=0$total
    fi

    [ "$cs_price" ] && cb_price=$(echo "scale=10; $total / $b_amount" | bc)
    [ ! "$cs_price" ] && cs_price=$(echo "scale=10; $total / $s_amount" | bc)
    [ $(echo $cs_price | cut -c 1) = "." ] && cs_price=0$cs_price
    [ $(echo $cb_price | cut -c 1) = "." ] && cb_price=0$cb_price

    tr="{ \"timestamp\": \"$timestamp\", \"trtype\": \"sell\", \"cur\": \"$cur_sold\", \"amount\": $s_amount, \"ppu\": $cs_price, \"total\": $total, \"exchange\": \"Binance\", \"ref\": \"$t_ref\", \"comment\": \"Converted $cur_sold to $cur_bought.\" }"
    echo $tr
    [ -e $transactions_file ] && echo $tr >> $transactions_file
    tr="{ \"timestamp\": \"$timestamp\", \"trtype\": \"buy\", \"cur\": \"$cur_bought\", \"amount\": $b_amount, \"ppu\": $cb_price, \"vcfee\": $cb_fee, \"total\": $total, \"exchange\": \"Binance\", \"ref\": \"$t_ref\", \"comment\": \"Converted $cur_sold to $cur_bought.\" }"
    echo $tr
    [ -e $transactions_file ] && echo $tr >> $transactions_file
    [ -e $transactions_file ] && echo "Output is also appended to $transactions_file"

    exit 0

elif [ "$cur_bought" ] # Case: bought crypto with EUR
then
    t_cur=$cur_bought
    t_type="buy"
    echo -n "Enter amount (total) of $cur_bought bought (converted): "
elif [ "$cur_sold" ] # Case: sold crypto for EUR
then
    t_cur=$cur_sold
    t_type="sell"
    echo -n "Enter amount (total) of $cur_sold sold (converted): "
else
    echo "Error: unknown case"
    exit 1
fi

read t_amount
[ ! "$t_amount" ] && echo "Error" && exit 1
echo -n "Enter fee in $t_cur (none if fee was in EUR) [0]: "
read vc_fee
[ ! "$vc_fee" ] && vc_fee=0
echo -n "Enter fee in EUR [0]: "
read eur_fee
[ ! "$eur_fee" ] && eur_fee=0
echo -n "Enter total (amount) in EUR: "
read total
[ ! "$total" ] && echo "Error" && exit 1

tr="{ \"timestamp\": \"$timestamp\", \"trtype\": \"$t_type\", \"cur\": \"$t_cur\", \"amount\": $t_amount, \"fee\": $eur_fee, \"vcfee\": $vc_fee, \"total\": $total, \"exchange\": \"Binance\", \"ref\": \"$t_ref\" }"

echo $tr
[ -e $transactions_file ] && echo "Output is also appended to $transactions_file" && echo $tr >> $transactions_file
