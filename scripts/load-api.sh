#!/bin/sh


if [ "$(uname)" = "Darwin" ] || [ "$(uname)" = "Linux" ]; then

    #Mac/Linux
    apiURL=$((cat '/etc/remoteit/config.json' | grep -Eo '"apiURL"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

else
    #Windows
    apiURL=$((cat 'C:/ProgramData/remoteit/config.json' | grep -Eo '"apiURL"[^,]*' | grep -Eo '[^:]*$') | sed -e 's/^.//' -e 's/.$//' -e 's/^.//')

fi

echo https://$apiURL