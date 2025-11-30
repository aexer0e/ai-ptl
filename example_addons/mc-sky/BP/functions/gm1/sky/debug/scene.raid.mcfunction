kill @e[type=gm1_sky:ai_player]

function gm1/sky/debug/to.village
function gm1/sky/debug/mode.late_game
give @a ominous_bottle 1

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

replaceitem entity @r[type=gm1_sky:ai_player,c=7] slot.inventory 0 leather 10
replaceitem entity @r[type=gm1_sky:ai_player,c=3] slot.inventory 1 iron_ingot 10

time set 14000

gamerule keepinventory true
spawnpoint @a 200 64 696

say §aDrink the ominous bottle to start a raid. Can you and your allies defend the village?