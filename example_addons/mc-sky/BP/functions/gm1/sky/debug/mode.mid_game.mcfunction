clear @p
give @p gm1_common:configurables
give @p gm1_sky:server_menu
function gm1/sky/debug/items.mid_game
gamemode 0 @p
effect @p saturation 5 5 true
effect @p regeneration 5 5 true
gamerule domobspawning true
gamerule dodaylightcycle true
time set 0
say Survival Mode activated!