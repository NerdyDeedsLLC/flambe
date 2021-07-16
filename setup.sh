#! /bin/bash
clear

FONDUE_PREFIX="$HOME/repoz/flambe"
if [ -d "/c/" ]; then
    FONDUE_PREFIX="/c/ProgramData/fondue"
    [ ! -d "$FONDUE_PREFIX/.data" ] && mkdir "$FONDUE_PREFIX/.data"
fi

touch "$FONDUE_PREFIX/.data/aliases.dat"
export FONDUE_ALIASES="$FONDUE_PREFIX/.data/aliases.dat"


echo "alias builds=\"source $FONDUE_PREFIX/builds.sh\";" >> "$FONDUE_ALIASES"
echo "alias flambe2='cd $FONDUE_PREFIX && git fetch --all && git pull && gulp'" >> "$FONDUE_ALIASES"
echo "alias fondir='cd $FONDUE_PREFIX && pwd && ls'" >> "$FONDUE_ALIASES"
echo "alias setupfondue='source $FONDUE_PREFIX/setup.sh'" >> "$FONDUE_ALIASES"
source "$FONDUE_ALIASES"

echo "alias setupfondue='source ./setup.sh'" >> "$HOME/.bash_profile"
echo "source $FONDUE_ALIASES" >> "$HOME/.bash_profile"
source "$FONDUE_PREFIX/builds.sh"
alias setupfondue='source $FONDUE_PREFIX/setup.sh'
alias unsetup="mv '$FONDUE_PREFIX/.data/setup.sh' '$FONDUE_PREFIX'"

mv "$FONDUE_PREFIX/setup.sh" "$FONDUE_PREFIX/.data/";
