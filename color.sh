#!/bin/bash/

COLORS_VERSION='1.0'

# RESETTERS
clrReset=$(tput sgr0) && XX=$clrReset                        #RESET ALL MODS

# BACKGROUND COLORS
bR=$(tput setab 1)    && bgR=$bR                                #Red (R)GB
bG=$(tput setab 2)    && bgG=$bG                                #Green R(G)B
bB=$(tput setab 4)    && bgB=$bB                                #Blue RG(B)
bC=$(tput setab 6)    && bgC=$bC                                #Cyan (C)MYK
bM=$(tput setab 5)    && bgM=$bM                                #Magenta C(M)YK
bY=$(tput setab 3)    && bgY=$bY                                #Yellow CM(Y)K
bK=$(tput setab 0)    && bgK=$bK                                #Black CMY(K)/(B)W
bW=$(tput setab 7)    && bgW=$bW                                #White B(W)

# FOREGROUND COLORS
fR=$(tput setaf 1)    && fgR=$fR                                #Red (R)GB
fG=$(tput setaf 2)    && fgG=$fG                                #Green R(G)B
fB=$(tput setaf 4)    && fgB=$fB                                #Blue RG(B)
fC=$(tput setaf 6)    && fgC=$fC                                #Cyan (C)MYK
fM=$(tput setaf 5)    && fgM=$fM                                #Magenta C(M)YK
fY=$(tput setaf 3)    && fgY=$fY                                #Yellow CM(Y)K
fK=$(tput setaf 0)    && fgK=$fK                                #Black CMY(K)/(B)W
fW=$(tput setaf 7)    && fgW=$fW                                #White B(W)

# TEXT EFFECTS 
tB=$(tput bold)       && tBold=$tB                              #Bold
tXB=$(tput sgr0)      && tXBold=$tXB      && tEndBold=$tXB      #End Bold
tD=$(tput dim)        && tDim=$tD                               #Dim (half-bright)
tXD=$(tput sgr0)      && tXDim=$tXD       && tEndDim=$tXD       #End Dim
tU=$(tput smul)       && tUnderline=$tU                         #Underline
tXU=$(tput rmul)      && tXUnderline=$tXU && tEndUnderline=$tXU #Exit Underline
tR=$(tput rev)        && tReverse=$tR                           #Reverse
tXR=$(tput sgr0)      && tXReverse=$tXR   && tEndReverse=$tXR   #End Reverse
tS=$(tput smso)       && tStandout=$tS                          #Standout
tXS=$(tput rmso)      && tXStandout=$tXS  && tEndStandout=$tXS  #End Standout

XXX="${XX}${tXB}${tXD}${tXU}${tXR}${tXS}" && XALL=$XXX       # End EVERYTHING, en masse

echo "
${tS}╔════════════╣║│ .color.sh z.${COLORS_VERSION} │║╠══════════════╗
║                                                 ║
║           ${tXS}${XX}${bW}${tB} ${fC}c${fR}o${fY}l${fG}o${fC}r${fM}.${fB}s${fK}${tX}h ${XX}${tB}${tS} is now loaded!             ║
║${XX}${tS}  Use BASH shorthand declarations to ${tB}Bold${XX}${tS}, ${tD}Dim${XX}${tS},  ║
║   ${tU}Underline${tXU}, and more terminal-echoed output!   ║
║                                                 ╿
╚══╡ Type 'colorhelp' for usage and examples. ╞══╾${XX}J
"
export TERM_LOADED=".color.sh z.${COLORS_VERSION}"


function colorhelp(){
echo "
┌────────────────────────────────────────────────────────────────────────────────────┐
│ ${tB}RESETS${tXB} ${tD}(USED TO RESTORE TERMINAL TO DEFAULT APPEARANCE)${tXD}${XXX}                            │
├──────────┬────────────────────────────────────────────┬────────────────────────────┤
│ var name │ description                                │        other aliases       │
├──────────┼────────────────────────────────────────────┼────────────────────────────┤
│    XX    │ Ends color adjustments                     │          clrReset          │
│    XXX   │ Ends ALL effects                           │            XALL            │
├──────────┴────────────────────────────────────────────┴────────────────────────────┤
│ ${tB}BACKGROUND COLORS${tXB}                                                                  │
├──────────┬────────────────────────────────────────────┬────────────────────────────┤
│ var name │ description                                │        other aliases       │
├──────────┼────────────────────────────────────────────┼────────────────────────────┤
│    bR    │ ${bR} Red (R)GB${XX}                                 │            bgR             │
│    bG    │ ${bG} Green R(G)B${XX}                               │            bgG             │
│    bB    │ ${bB} Blue RG(B)${XX}                                │            bgB             │
│    bC    │ ${bC} Cyan (C)MYK${XX}                               │            bgC             │
│    bM    │ ${bM} Magenta C(M)YK${XX}                            │            bgM             │
│    bY    │ ${bY} Yellow CM(Y)K${XX}                             │            bgY             │
│    bK    │ ${bK} Black CMY(K)/(B)W${XX} (Black)                 │            bgK             │
│    bW    │ ${bW} White B(W)${XX} (White)                        │            bgW             │
├──────────┼────────────────────────────────────────────┴────────────────────────────┤
│    XX    │ ENDS the background color adjustment                                    │
├──────────┴─────────────────────────────────────────────────────────────────────────┤
│ ${tB}FOREGROUND (FONT/CHARACTER) COLORS${tXB}                                                 │
├──────────┬────────────────────────────────────────────┬────────────────────────────┤
│ var name │ description                                │        other aliases       │
├──────────┼────────────────────────────────────────────┼────────────────────────────┤
│    fR    │ ${fR} Red (R)GB${XX}                                 │            fgR             │
│    fG    │ ${fG} Green R(G)B${XX}                               │            fgG             │
│    fB    │ ${fB} Blue RG(B)${XX}                                │            fgB             │
│    fC    │ ${fC} Cyan (C)MYK${XX}                               │            fgC             │
│    fM    │ ${fM} Magenta C(M)YK${XX}                            │            fgM             │
│    fY    │ ${fY} Yellow CM(Y)K${XX}                             │            fgY             │
│    fK    │ ${fK} Black CMY(K)/(B)W${XX} (Black)                 │            fgK             │
│    fW    │ ${fW} White B(W)${XX} (White)                        │            fgW             │
├──────────┼────────────────────────────────────────────┴────────────────────────────┤
│    XX    │ ENDS the foreground color adjustment                                    │
├──────────┴─────────────────────────────────────────────────────────────────────────┤
│ ${tB}TEXT/FONT EFFECTS${tXB}                                                                  │
├──────────┬────────────────────────────────────────────┬────────────────────────────┤
│ var name │ description                                │        other aliases       │
├──────────┼────────────────────────────────────────────┼────────────────────────────┤
│    tB    │ ${tB} Bold${XX}                                      │           tBold            │
│    tXB   │ ${tB} /End Bold${XX}                                 │      tXBold, tEndBold      │
├──────────┼────────────────────────────────────────────┼────────────────────────────┤
│    tD    │ ${tD} Dim (half-bright)${XX}                         │            tDim            │
│    tXD   │ ${tD} /End Dim${XX}                                  │       tXDim, tEndDim       │
├──────────┼────────────────────────────────────────────┼────────────────────────────┤
│    tU    │ ${tU} Underline${XX}                                 │        tUnderline          │
│    tXU   │ ${tU} /Exit Underline${XX}                           │ tXUnderline, tEndUnderline │
├──────────┼────────────────────────────────────────────┼────────────────────────────┤
│    tR    │ ${tR} Reverse${XX}                                   │          tReverse          │
│    tXR   │ ${tR} /End Reverse${XX}                              │   tXReverse, tEndReverse   │
├──────────┼────────────────────────────────────────────┼────────────────────────────┤
│    tS    │ ${tS} Standout${XX}                                  │          tStandout         │
│    tXS   │ ${tXS} End Standout${XX}                              │  tXStandout, tEndStandout  │
├──────────┴─────────────────────────────────────────────────────────────────────────┤
│ ${tB}USAGE SYNTAX/EXAMPLES${tXB}                                                              │
├──────────┬─────────────────────────────────────────────────────────────────────────┤
│  SYNTAX  │ Simply wrap the var name from the chart above in \$\{\}: \$\{VAR_NAME\}   │
├──────────┼─────────────────────────────────────────────────────────────────────────┤
│ EXAMPLES │ \${bB}Sample\${XX} will yield ${bB} Sample ${XX}.                                   │ 
│          │ \${fR}Sample\${XX} will yield ${fR} Sample ${XX}.                                   │
│          │ Feel free to mix n' match, too:                                         │
│          │ \${fM}\${bY}\${tB}Sample\${XX} will yield ${tB}${bM}${fY} Sample ${XX}                          │
│          │ (Note that in the previous example, the \${XX} kills BOTH styles.        │
│          │ some effects like ${tS}Standout${tXS} have their own special kill codes:           │
│          │ \${tS}Standout\${tXS}, in this case. Even so, \${XX} clears EVERYTHING!)   │
└──────────┴─────────────────────────────────────────────────────────────────────────┘
"
}

export '_color_sh'='TRUE'