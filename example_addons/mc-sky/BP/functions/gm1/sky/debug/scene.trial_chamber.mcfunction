kill @e[type=gm1_sky:ai_player]

function gm1/sky/debug/to.trial_chamber
function gm1/sky/debug/mode.late_game
give @a splash_potion 1 22
give @a splash_potion 1 22
give @a splash_potion 1 22
give @a splash_potion 1 22
give @a splash_potion 1 22
give @a splash_potion 1 22

summon gm1_sky:ai_player 158 -3 -317
summon gm1_sky:ai_player 158 -3 -317
summon gm1_sky:ai_player 158 -3 -317

gamerule keepinventory true
spawnpoint @a 158 -3 -317
effect @e[type=gm1_sky:ai_player] resistance 999999 0 true

say §aYou and your besties have ventured into a Trial Chamber, ready to find some epic loot. But who will live and who will die?