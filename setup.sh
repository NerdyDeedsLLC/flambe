#! /bin/bash
clear

[ ! -d "/path/to/dir" ] && mkdir ./.data
touch ./.data/aliases.dat
echo "alias builds='source ./builds.sh'" >> ./.data/aliases.dat
echo "alias flambe2='cd /c/ProgramData/fondue && git fetch --all && git pull && gulp'" >> ./.data/aliases.dat
echo "alias fondir='cd /c/ProgramData/fondue && pwd && ls'" >> ./.data/aliases.dat
echo "alias setupfondue='source ./setup.sh'" >> ./.data/aliases.dat
source ./.data/aliases.dat

echo "alias setupfondue='source ./setup.sh'" >> $HOME/.bash_profile
alias setupfondue='source ./setup.sh'
echo "source ./.data/aliases.dat" >> $HOME/.bash_profile

source ./builds.sh

mv ./setup.sh ./.data;
echo "./.data/setup.sh" >> .gitignore
 