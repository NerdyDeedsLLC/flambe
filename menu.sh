#!/bin/bash


##
# BASH menu script that checks:
#   - Memory usage
#   - CPU load
#   - Number of TCP connections 
#   - Kernel version
##

server_name=$(hostname)
declare -a BRANCH_ARRAY
export BRANCH_ARRAY

GatherBranchesForMenu(){
    BRANCH_ARRAY=($(echo "$(git branch -r | grep fondue | sed  's/  origin\// /g' | tr '\n' ' ') \"Cancel"))
}

menu(){
    git fetch --all
    GatherBranchesForMenu
    showMenu
}

showMenu() {
    clear
    echo -ne "
${fY}${tB}Enter the Number Corresponding to the target branch to activate:${XX}

"
for ((x=1 ; x<${#BRANCH_ARRAY[@]} ; x++)); do echo "  ${fG}${tB}$x)${XX} ${BRANCH_ARRAY[$x]}"; done

    echo -ne "\n  ${fR}0)${XX} Exit
    $(printf "
  ${fC}Enter Branch Number > ${XX} ") " &&  read a
        case $a in
		0) return ;;
        '') showMenu ;;
		*) echo -e ${fR}${BRANCH_ARRAY[$a]}${XX} ;;
        esac
}

# Call the menu function
# menu
