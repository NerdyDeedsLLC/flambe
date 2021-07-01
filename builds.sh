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

runbuilds(){
    git fetch --all
    GatherBranchesForMenu
    showMenu
}

switchToBranch(){
    git checkout $1
    echo -ne "\n${fR}  Switched to $1!${XX}\n\n"
    printf "    - ${fY}Pulling latest changes... "
    git pull
    printf "    ...done.${XX}"
    echo -ne "\n\n${fG}  Open Fondue (${fC}y/n${fG}, or ${fC}↵↲${fG} to auto-launch)?${XX} > " && read launch
    case $launch in
    'y'|'Y'|'') echo "${fY}Launching...${XX}" && gulp ;;
    'n'|'N') return ;;
        esac

}

showMenu(){
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
		*) echo -e "\n  Switching to build ${fR}${BRANCH_ARRAY[$a]}${XX}!\n\n"; switchToBranch "${BRANCH_ARRAY[$a]}" && return 0 ;;
        esac
}

runbuilds
