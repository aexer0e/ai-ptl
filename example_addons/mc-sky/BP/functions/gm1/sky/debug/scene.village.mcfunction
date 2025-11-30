kill @e[type=gm1_sky:ai_player]

function gm1/sky/debug/to.village
function gm1/sky/debug/mode.mid_game

summon gm1_sky:ai_player 200 64 696
summon gm1_sky:ai_player 200 64 696
summon gm1_sky:ai_player 200 64 696
summon gm1_sky:ai_player 200 64 696
summon gm1_sky:ai_player 200 64 696
summon gm1_sky:ai_player 200 64 696
summon gm1_sky:ai_player 200 64 696
summon gm1_sky:ai_player 200 64 696
summon gm1_sky:ai_player 200 64 696
summon gm1_sky:ai_player 200 64 696
spreadplayers 200 696 20 30 @e[type=gm1_sky:ai_player]

gamerule keepinventory true
spawnpoint @a 200 64 696