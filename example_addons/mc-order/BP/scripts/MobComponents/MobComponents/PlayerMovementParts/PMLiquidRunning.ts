import GameData from "Game/GameData";
import MobComponentManager from "MobComponents/MobComponentManager";
import BlockUtil from "Utilities/BlockUtil";
import CharActivation from "../CharActivation";
import PMPart from "./PMPart";

export default class PMLiquidRunning extends PMPart {
    isWaterRunning = false;
    liquidRunningAllowed = true;
    liquidJumpLock = false;
    isSnowRunning = false;

    ProcessLiquidRunning() {
        if (this.moveComp.isOnGround && !this.moveComp.inAbilityMode && !this.liquidJumpLock) {
            this.liquidRunningAllowed = true;
        } else if (this.moveComp.inAbilityMode || this.liquidJumpLock) {
            this.liquidRunningAllowed = false;
        }
        if (
            (this.moveComp.momentum < GameData.MinMomentumForLiquidRunning && !this.moveComp.inHoverMode && !this.moveComp.inGlideMode) ||
            !this.liquidRunningAllowed
        ) {
            if (this.isSnowRunning) {
                const Component = MobComponentManager.getInstanceOfComponent(CharActivation, this.player);
                if (Component) {
                    Component.onDetransformComplete();
                }
            }
            // This check ensures that we only set the leggings durability when it's needed, instead of every tick
            if (this.isWaterRunning || this.isSnowRunning) {
                this.moveComp.ResetRunningStates();
            }
            return;
        }

        const playerPos = { ...this.moveComp.playerLoc, y: this.moveComp.playerLoc.y };
        const upOnePos = { ...playerPos, y: playerPos.y + 1 };
        const downOnePos = { ...playerPos, y: playerPos.y - 1 };

        const playerBlock = BlockUtil.GetBlock(this.moveComp.dimension, playerPos)?.typeId;
        const upOneBlock = BlockUtil.GetBlock(this.moveComp.dimension, upOnePos)?.typeId;
        const downOneBlock = BlockUtil.GetBlock(this.moveComp.dimension, downOnePos)?.typeId;

        if (!downOneBlock || !playerBlock || !upOneBlock) {
            this.moveComp.ResetRunningStates();
            return;
        }

        const tooHighKnockback = 0.04;
        const hoverSteadyKnockback = 0.1;
        const tooLowKnockback = 0.4;

        const isAboveLiquid = GameData.LiquidRunBlocks.has(downOneBlock) && playerBlock == "minecraft:air";
        const isBelowLiquid = GameData.LiquidRunBlocks.has(playerBlock) && upOneBlock == "minecraft:air";

        if (isAboveLiquid || isBelowLiquid) {
            if (downOneBlock == "minecraft:water" || playerBlock == "minecraft:water") {
                this.isWaterRunning = true;
                this.moveComp.SetLeggingsDurability(2);
            } else if (downOneBlock == "minecraft:powder_snow" || playerBlock == "minecraft:powder_snow") {
                this.isSnowRunning = true;
                this.moveComp.SetLeggingsDurability(8);
            }

            if (Math.abs(playerPos.y - Math.ceil(playerPos.y)) > 0.1 && isBelowLiquid) {
                this.moveComp.verticalKnockback = tooLowKnockback;
            } else if (Math.abs(playerPos.y - Math.floor(playerPos.y)) > 0.8 && isAboveLiquid) {
                this.moveComp.verticalKnockback = tooHighKnockback;
            } else {
                this.moveComp.verticalKnockback = hoverSteadyKnockback;
            }
        } else if (this.isWaterRunning || this.isSnowRunning) {
            this.moveComp.ResetRunningStates();
        }
    }
}
