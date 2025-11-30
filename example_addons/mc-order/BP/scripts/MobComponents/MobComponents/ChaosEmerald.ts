import { Dimension, Entity, EntityRideableComponent, Player, Vector3, system, world } from "@minecraft/server";
import GameData from "Game/GameData";
import RingBurst from "Order/RingBurst";
import EntityStore from "Store/Entity/EntityStore";
import BlockUtil from "Utilities/BlockUtil";
import EntityUtil from "Utilities/EntityUtil";
import MathUtil from "Utilities/MathUtil";
import V3 from "Wrappers/V3";
import MobComponent from "./MobComponent";

export default class ChaosEmerald extends MobComponent {
    static readonly EntityTypes = [
        "gm1_ord:chaos_emerald_blue",
        "gm1_ord:chaos_emerald_cyan",
        "gm1_ord:chaos_emerald_green",
        "gm1_ord:chaos_emerald_purple",
        "gm1_ord:chaos_emerald_red",
        "gm1_ord:chaos_emerald_white",
        "gm1_ord:chaos_emerald_yellow",
        "gm1_ord:chaos_emerald_gray",
    ];

    static readonly timeoutTick = 20;

    get Speed(): number {
        const dist = MathUtil.clamp(
            V3.distance(this.currentPos, this.playerPos),
            GameData.EmeraldDistanceForMaxSpeedByColors[this.entityType!],
            GameData.EmeraldDistanceForMinSpeedByColors[this.entityType!]
        );
        // Variable calculated separately from return so it's easy to add it to a debug message
        let ret = MathUtil.rangeMap(
            dist,
            GameData.EmeraldDistanceForMaxSpeedByColors[this.entityType!],
            GameData.EmeraldDistanceForMinSpeedByColors[this.entityType!],
            GameData.EmeraldMaxSpeedByColors[this.entityType!],
            GameData.EmeraldMinSpeedByColors[this.entityType!]
        );

        ret = MathUtil.clamp(ret * (this.movingLifetime / 100), GameData.EmeraldMinSpeedByColors[this.entityType!] / 10, ret);

        if (this.chaseTimer <= GameData.EmeraldSpeedDownLastTickByColors[this.entityType!]) {
            const slowFactor = MathUtil.rangeMap(this.chaseTimer, 0, 40, 0, 1);
            ret *= slowFactor;
        }

        return ret;
    }

    entityType = this.entity?.typeId;
    cachedSpeed = 0;

    runDir = V3.zero;
    yTarget: number | undefined = undefined;
    fallMode = false;
    horizontalQuota = 0;
    prevHorizontalPos = V3.zero;
    ticksToRunInDir = 0;
    distToRingSpawn = GameData.EmeraldRingSpawnRateByColors[this.entityType!];

    targetVelocity = V3.zero;

    dimension: Dimension;
    player: Player;
    currentPos: V3;
    playerPos: V3;
    movingLifetime = 1;

    dirChangeQueryInProgress = false;
    summedSpeed = 0;
    summedSpeedTick = 0;

    startupTimer: number;
    chaseTimer: number;

    type: "moving" | "locked" | "unlocked";
    prevLocation: V3 = V3.zero;

    haslostEmeraldTarget = false;

    blockBreaker: Entity | null = null;

    escapeStack: number = 0;

    private startSongPlayed = false;
    private themeSongPlayed = false;
    private themeSongTimeoutHandle: number | undefined;

    constructor(entity: Entity) {
        super(entity, 1);

        this.blockBreaker = EntityUtil.spawnEntity("gm1_ord:miner_emeralds", this.entity!.location, this.entity!.dimension);
        const rideableComponent = this.entity!.getComponent(EntityRideableComponent.componentId) as EntityRideableComponent;
        if (rideableComponent) {
            rideableComponent.addRider(this.blockBreaker);
        }

        this.type = this.entity!.getProperty("gm1_ord:type") as "moving" | "locked" | "unlocked";

        this.dimension = entity.dimension;
        this.player = this.dimension.getPlayers({ closest: 1 })[0];
        this.playerPos = new V3(this.player.location);

        // Temporary initialization, in the future this should only happen when the emerald chase starts
        this.runDir = V3.fromYaw(MathUtil.random(0, Math.PI * 2));

        const min = GameData.EmeraldChangeDirectionIntervalByColors[this.entityType!][0];
        const max = GameData.EmeraldChangeDirectionIntervalByColors[this.entityType!][1];
        this.ticksToRunInDir = MathUtil.randomInt(min, max);

        this.UpdateDirProperties();
        this.chaseTimer = GameData.EmeraldChaseDurationByColors[this.entityType!];
    }

    setType(type: "moving" | "locked" | "unlocked") {
        if (this.type === type) return;
        this.entity!.clearVelocity();
        this.entity!.setProperty("gm1_ord:type", type);
        this.type = type;
        // When initializing movement, set the startup timer
        if (this.type === "moving") {
            this.startupTimer = GameData.EmeraldStartupTime;
            this.entity!.setProperty("gm1_ord:starting_up", true);
        }
    }

    process() {
        if (!EntityUtil.isValid(this.entity)) return;

        if (this.type == "moving") {
            // Handle startup time, cancel movement if still starting up
            if (this.startupTimer > 0) {
                this.startupTimer--;
                if (this.startupTimer === 0) this.entity!.setProperty("gm1_ord:starting_up", false);
                return;
            }

            if (!this.startSongPlayed) {
                this.player.runCommand("playsound chaos_emerald_theme_intro @s");
                this.startSongPlayed = true;

                this.themeSongTimeoutHandle = this.timeout(() => {
                    if (!this.themeSongPlayed) {
                        this.player.runCommand("playsound chaos_emerald_theme_song @s");
                        this.themeSongPlayed = true;
                    }
                }, 140);
            }

            this.movingLifetime++;
            this.currentPos = new V3(this.entity.location);
            this.playerPos = new V3(this.player.location);
            this.cachedSpeed = this.Speed;

            // teleport to escape stuck
            if (V3.distance(this.currentPos, this.prevLocation) == 0) {
                this.escapeStack = this.escapeStack + 1;
                this.EscapeStuckMovement();
            } else if (this.chaseTimer % 30 == 0) {
                if (this.escapeStack > 0) {
                    this.escapeStack = this.escapeStack - 1;
                }
            }

            this.RunAway();
            if (this.chaseTimer % 30) this.prevLocation = this.currentPos;

            this.CalcAverageSpeed();

            this.ChaseTimeCountdown();
            this.CheckIfChaseTimeOver();
            this.CheckChaseDistanceFailure();
        } else if (this.type == "unlocked") {
            const player = EntityStore.getLinkedEntity(this.entity, "emeraldLinkId") as Player;
            if (!player) return this.entity.remove();

            const distanceToPlayer = V3.distance(this.entity.location, player.location);
            if (distanceToPlayer < GameData.EmeraldCollectDistance || distanceToPlayer > GameData.EmeraldAutoCollectDistance) {
                if (this.entity!.getProperty("gm1_ord:collected") !== true) {
                    // Set the collected flag
                    this.entity!.setProperty("gm1_ord:collected", true);

                    // Gray Chaos Emeralds make rings!
                    if (this.entityType === "gm1_ord:chaos_emerald_gray") {
                        RingBurst.RingBurst(
                            this.entity!.dimension,
                            new V3(this.entity!.location),
                            GameData.GrayEmeraldRingBurstCount[0],
                            GameData.GrayEmeraldRingBurstCount[1],
                            GameData.GrayEmeraldRingHImpulseRange[0],
                            GameData.GrayEmeraldRingHImpulseRange[1],
                            GameData.GrayEmeraldRingVImpulseRange[0],
                            GameData.GrayEmeraldRingVImpulseRange[1]
                        );
                    }

                    const colorKey = this.entityType!.split("_").pop();
                    const messageKey = `chaos_emerald.collect.${colorKey}`;
                    const collectMessage = { translate: messageKey, with: [player.name] };
                    world.sendMessage(collectMessage);

                    this.player.runCommand("stopsound @s chaos_emerald_theme_song");
                }

                // console.warn(this.entity!.getProperty("gm1_ord:collected"));

                this.timeout(() => {
                    this.entity!.remove();
                }, ChaosEmerald.timeoutTick);
            }
        } else if (this.type == "locked") {
            const link = EntityStore.getLinkedEntity(this.entity, "emeraldLinkId");
            const link2 = EntityStore.getLinkedEntity(this.entity, "bossEmeraldLinkId");
            if (!link && !link2) return this.entity.remove();
        }
    }

    EscapeStuckMovement() {
        const currLocation: Vector3 = this.entity!.location;
        currLocation.y = currLocation.y + 3;
        this.entity?.teleport(currLocation);
    }

    RunAway() {
        if (this.fallMode) {
            // console.warn("fall move");
            this.FallMovement();
        } else if (this.yTarget !== undefined) {
            // console.warn("up move");
            this.UpMovement();
        } else if (this.horizontalQuota > 0) {
            // console.warn("ground move");
            this.GroundMovement();
        } else {
            // console.warn("else");
            this.CheckForBlocks();
        }

        this.ApplyTargetVelocity();
    }

    ApplyTargetVelocity() {
        const currentVel = new V3(this.entity!.getVelocity());
        const diff = this.targetVelocity.subtractV3(currentVel);
        this.entity!.applyImpulse(diff);
    }

    RandomRunDir(collisionChange = false) {
        const min = GameData.EmeraldChangeDirectionIntervalByColors[this.entityType!][0];
        const max = GameData.EmeraldChangeDirectionIntervalByColors[this.entityType!][1];
        this.ticksToRunInDir = MathUtil.randomInt(min, max);

        let angleMin: number;
        let angleMax: number;

        if (collisionChange) {
            if (Math.random() < 0.5) {
                angleMin = GameData.EmeraldTurnRangeCollisionByColors[this.entityType!][0];
                angleMax = GameData.EmeraldTurnRangeCollisionByColors[this.entityType!][1];
            } else {
                angleMin = GameData.EmeraldTurnRangeCollisionByColors[this.entityType!][2];
                angleMax = GameData.EmeraldTurnRangeCollisionByColors[this.entityType!][3];
            }
        } else {
            angleMin = GameData.EmeraldTurnRangeRunningByColors[this.entityType!][0];
            angleMax = GameData.EmeraldTurnRangeRunningByColors[this.entityType!][1];
        }

        this.runDir = this.runDir.rotateAroundY((MathUtil.random(angleMin, angleMax) * Math.PI) / 180);

        this.DirChangeQuery();
        this.UpdateDirProperties();
    }

    CheckForBlocks() {
        if (this.currentPos.y < 62) {
            this.fallMode = false;
            this.UpdateDirProperties();

            const frontPos = this.currentPos.addV3(this.runDir);
            const frontBlock = BlockUtil.GetBlock(this.dimension, frontPos);

            if (frontBlock && !GameData.EmeraldPassThruBlocks.has(frontBlock.typeId)) {
                // there is obstacle forward, try climb
                const topBlock = this.dimension.getTopmostBlock({ x: frontPos.x, z: frontPos.z });
                if (!topBlock) return;

                const topPos = topBlock.location;
                if (topPos.y - frontPos.y + 1 <= GameData.EmeraldMaxClimbHeightByColors[this.entityType!]) {
                    // can climb
                    this.yTarget = Math.max(topPos.y + 2, 64);
                    this.UpdateDirProperties();
                    return;
                } else {
                    // can not climb, change direction
                    this.RandomRunDir(true);
                    return;
                }
            }

            // no obstacle
            this.GroundMovement();
            return;
        }

        // Check for air below the emerald and make it fall if there's open space
        const yBelow = this.currentPos.y - GameData.EmeraldFallEndThreshold;
        const isAirBelow = !this.HasSolidBlockAt(yBelow);
        const isAboveMinY = yBelow > GameData.EmeraldMinY;

        if (isAirBelow && isAboveMinY) {
            this.fallMode = true;
            this.UpdateDirProperties();
            this.FallMovement();
            return;
        }

        // Check for obstruction in front of the emerald and determine course of action if one is found
        const frontPos = this.currentPos.addV3(this.runDir);
        const frontBlock = BlockUtil.GetBlock(this.dimension, frontPos);
        if (
            (frontBlock && !GameData.EmeraldPassThruBlocks.has(frontBlock.typeId)) ||
            this.currentPos.y - GameData.EmeraldFallEndThreshold <= GameData.EmeraldMinY
        ) {
            const topBlock = this.dimension.getTopmostBlock({ x: frontPos.x, z: frontPos.z });
            if (!topBlock) return; // Type safety appeasement, this condition should not be possible and there's a problem if it happens
            const topPos = topBlock.location;
            if (
                topPos.y - frontPos.y + 1 <= GameData.EmeraldMaxClimbHeightByColors[this.entityType!] ||
                this.currentPos.y < GameData.EmeraldMinY
            ) {
                // Height is low enough to climb OR we're below the emerald Y limit
                this.yTarget = Math.max(topPos.y + 2, GameData.EmeraldMinY);
                this.UpdateDirProperties();
                return;
            } else {
                // Height is too high to climb, choosing a new direction instead
                this.RandomRunDir(true);
                return;
            }
        }

        // No special conditions, do normal ground movement
        this.GroundMovement();
    }

    HasSolidBlockAt(yAxis: number): boolean {
        const x = this.currentPos.x;
        const z = this.currentPos.z;

        const checkPositions = [
            new V3(x - 1, yAxis, z - 1),
            new V3(x - 1, yAxis, z),
            new V3(x - 1, yAxis, z + 1),
            new V3(x, yAxis, z - 1),
            new V3(x, yAxis, z),
            new V3(x, yAxis, z + 1),
            new V3(x + 1, yAxis, z - 1),
            new V3(x + 1, yAxis, z),
            new V3(x + 1, yAxis, z + 1),
        ];

        for (const pos of checkPositions) {
            const block = BlockUtil.GetBlock(this.dimension, pos);
            if (block && !GameData.EmeraldPassThruBlocks.has(block.typeId)) {
                return true;
            }
        }

        return false;
    }

    FallMovement() {
        // Do movement
        this.targetVelocity = new V3(0, -GameData.EmeraldMinSpeedByColors[this.entityType!] * 1.1, 0);

        const yBelow = Math.floor(this.currentPos.y - GameData.EmeraldFallEndThreshold);
        const isBlockedBelow = this.HasSolidBlockAt(yBelow);

        // Check for fall movement end
        if (isBlockedBelow || yBelow <= GameData.EmeraldMinY) {
            this.fallMode = false;
            this.UpdateDirProperties();
            this.prevHorizontalPos = new V3(this.currentPos);
            this.prevHorizontalPos.y = 0;
        }
    }

    UpMovement() {
        // Type safety appeasement
        if (this.yTarget === undefined) return;

        // Do movement
        this.targetVelocity = new V3(0, GameData.EmeraldMinSpeedByColors[this.entityType!] * 1.1, 0);

        const yAbove = Math.ceil(this.currentPos.y + GameData.EmeraldFallEndThreshold);
        const isBlockedAbove = this.HasSolidBlockAt(yAbove);

        // Blocked above, stop up and choose new direction
        if (isBlockedAbove) {
            // console.warn("Blocked above! Choosing new direction.");
            this.yTarget = undefined;
            this.RandomRunDir(true);
            this.UpdateDirProperties();
            this.horizontalQuota = 2;
            this.prevHorizontalPos = new V3(this.currentPos);
            this.prevHorizontalPos.y = 0;
            return;
        }

        // Check for fall movement end
        if (this.currentPos.y >= this.yTarget) {
            this.yTarget = undefined;
            this.UpdateDirProperties();
            this.horizontalQuota = 2;
            this.prevHorizontalPos = new V3(this.currentPos);
            this.prevHorizontalPos.y = 0;
        }
    }

    GroundMovement() {
        // Set target velocity for ground movement
        this.targetVelocity = this.runDir.multiply(this.cachedSpeed);

        // Random direction changes
        this.ticksToRunInDir--;
        if (this.ticksToRunInDir < 1) this.RandomRunDir();

        // Calculate distance traveled
        const horizontalPos = new V3(this.entity!.location);
        horizontalPos.y = 0;
        const horizontalDist = V3.distance(horizontalPos, this.prevHorizontalPos);
        this.prevHorizontalPos = horizontalPos;

        // Ring spawning
        this.distToRingSpawn -= horizontalDist;
        if (this.distToRingSpawn <= 0) {
            this.distToRingSpawn = GameData.EmeraldRingSpawnRateByColors[this.entityType!];
            try {
                this.dimension.spawnEntity("gm1_ord:ring", {
                    x: Math.round(this.currentPos.x) - 0.5,
                    y: Math.round(this.currentPos.y) - 0.5,
                    z: Math.round(this.currentPos.z) - 0.5,
                });
            } catch (e) {}
        }

        // Run down horizontal quota
        if (this.horizontalQuota > 0) {
            this.horizontalQuota -= horizontalDist;
            this.prevHorizontalPos = horizontalPos;
        }
    }

    ChaseTimeCountdown() {
        if (this.haslostEmeraldTarget) return;

        this.chaseTimer--;
        const remainingTime = Math.ceil(this.chaseTimer / 20);

        let messageKey: string;

        if (remainingTime < GameData.EmeraldFlashStartTime) {
            const isFlashingTime = Math.ceil(this.chaseTimer / (GameData.EmeraldFlashFrequency * 20)) % 2 === 0;
            if (!isFlashingTime) {
                messageKey = "chaos_emerald.timer.default";
            } else {
                const colorKey = this.entityType!.split("_").pop();
                messageKey = `chaos_emerald.timer.${colorKey}`;
            }
        } else {
            messageKey = "chaos_emerald.timer.default";
        }

        const message = { translate: messageKey, with: [remainingTime.toString()] };
        this.player.onScreenDisplay.setActionBar(message);
    }

    CheckIfChaseTimeOver() {
        if (this.chaseTimer === 0) {
            EntityStore.pushToArray(this.player, "completedShrineIds", EntityStore.get(this.entity!, "emeraldLinkId"));
            EntityStore.linkEntities(this.entity!, this.player, "emeraldLinkId");

            this.setType("unlocked");

            // All Chaos Emerald entities but the gray ones increment the player's emerald count
            if (this.entityType !== "gm1_ord:chaos_emerald_gray") ChaosEmerald.GivePlayerEmerald(this.player);

            // EntityStore.set(this.player, "targetEmerald", "");
        }
    }

    CheckChaseDistanceFailure() {
        if (this.haslostEmeraldTarget) return;

        const distToplayer = V3.distance(this.currentPos, this.playerPos);
        if (distToplayer > GameData.EmeraldMaxChaseDistanceByColors[this.entityType!]) {
            this.haslostEmeraldTarget = true;

            const gameoverMessageKey = `chaos_emerald.gameover.${this.entityType!.split("_").pop()}`;
            const gameoverMessage = { translate: gameoverMessageKey };
            this.player.sendMessage(gameoverMessage);

            // disable process sound and play end sound
            this.player.runCommand("stopsound @s chaos_emerald_theme_intro");
            this.player.runCommand("stopsound @s chaos_emerald_theme_song");
            if (this.themeSongTimeoutHandle !== undefined) {
                system.clearRun(this.themeSongTimeoutHandle);
                this.themeSongTimeoutHandle = undefined;
            }
            this.player.runCommand("playsound chaos_emerald_time_out @s");

            this.entity!.triggerEvent("gm1_ord:despawn");
        }
    }

    static GivePlayerEmerald(player: Player) {
        const currentEmeraldStage = EntityStore.get(player, "EmeraldStage");
        const newEmeraldStage = Math.min(7, currentEmeraldStage + 1);
        EntityStore.set(player, "EmeraldStage", newEmeraldStage);
        world.scoreboard.getObjective("gm1_ord:collected_emeralds")?.setScore(player, newEmeraldStage);
    }

    DirChangeQuery() {
        if (this.dirChangeQueryInProgress) return;

        this.dirChangeQueryInProgress = true;
        this.entity!.setProperty("gm1_ord:direction_changed", true);

        this.timeout(() => {
            this.entity!.setProperty("gm1_ord:direction_changed", false);
            this.dirChangeQueryInProgress = false;
        }, GameData.EmeraldDirChangeQueryTicks);
    }

    CalcAverageSpeed() {
        this.summedSpeed += this.cachedSpeed;
        this.summedSpeedTick++;

        if (this.summedSpeedTick === GameData.EmeraldAvgSpeedTicks) {
            this.entity!.setProperty("gm1_ord:average_speed", this.summedSpeed / GameData.EmeraldAvgSpeedTicks);
            this.summedSpeed = 0;
            this.summedSpeedTick = 0;
        }
    }

    UpdateDirProperties() {
        if (this.fallMode || this.yTarget !== undefined) {
            this.entity!.setProperty("gm1_ord:move_dir_x", 0.0);
            this.entity!.setProperty("gm1_ord:move_dir_z", 0.0);
        } else {
            this.entity!.setProperty("gm1_ord:move_dir_x", this.runDir.x);
            this.entity!.setProperty("gm1_ord:move_dir_z", this.runDir.z);
        }
    }
}
