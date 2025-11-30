import {
    Entity,
    EntityComponentTypes,
    EntityDamageCause,
    EntityHealthComponent,
    EntityRideableComponent,
    Player,
    system,
    Vector3,
} from "@minecraft/server";
import MobComponentManager from "MobComponents/MobComponentManager";
import RingBurst from "Order/RingBurst";
import EntityStore from "Store/Entity/EntityStore";
import EntityUtil from "Utilities/EntityUtil";
import MathUtil from "Utilities/MathUtil";
import V2 from "Wrappers/V2";
import V3 from "Wrappers/V3";
import LaserGadget from "./Gadgets/LaserGadget";
import MissileGadget from "./Gadgets/MissileGadget";
import Gadets from "./Gadgets/index";
import MobComponent from "./MobComponent";
import PlayerMovement from "./PlayerMovement";
import ShrineMarker from "./ShrineMarker";

type Gadget = InstanceType<(typeof Gadets)[keyof typeof Gadets]>;

export enum EggmanMoveTypes {
    Stationary,
    Chase,
    OrbitShrine,
    Perch,
    GoToShrine, // Do NOT use this in Actions!
    Line,
}
export enum EggmanAttackTypes {
    EggroboDrop,
    Swoop,
    Laser,
    Missiles,
    None,
}

export default class Eggman extends MobComponent {
    // This is NOT a design variable, don't edit this!
    static readonly EntityTypes = ["gm1_ord:eggman"];

    // This is NOT a design variable, don't edit this!
    readonly GadgetOptions = [MissileGadget, LaserGadget];

    // This should probably be moved into GameData.ts at some point
    readonly Phases = [
        {
            gadget: null,
            endAtHealthFraction: 0.8,
            healthRange: [0.8, 1],
            actions: [
                {
                    name: "Rapid Orbit",
                    move: EggmanMoveTypes.OrbitShrine,
                    attack: EggmanAttackTypes.None,
                    repeat: [1, 1],
                    height: 13,
                    speed: 4,
                    preAttackTime: 3 * 20,
                    moveWhileAttacking: false,
                    stuns: false,
                },
                {
                    name: "Eggy Orbit",
                    move: EggmanMoveTypes.OrbitShrine,
                    attack: EggmanAttackTypes.EggroboDrop,
                    repeat: [3, 3],
                    height: 9,
                    speed: 0.6,
                    preAttackTime: 2 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "Stop for breath",
                    move: EggmanMoveTypes.Stationary,
                    attack: EggmanAttackTypes.None,
                    repeat: [1, 1],
                    height: 7,
                    speed: 3,
                    preAttackTime: 7 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "Return to shrine",
                    move: EggmanMoveTypes.Perch,
                    attack: EggmanAttackTypes.None,
                    repeat: [1, 1],
                    height: 6,
                    speed: 3,
                    preAttackTime: 5 * 20,
                    moveWhileAttacking: false,
                    stuns: false,
                },
                {
                    name: "Swoop",
                    move: EggmanMoveTypes.Chase,
                    attack: EggmanAttackTypes.Swoop,
                    repeat: [3, 3],
                    height: 2,
                    speed: 1,
                    preAttackTime: 2.5 * 20,
                    moveWhileAttacking: true,
                    stuns: true,
                },
            ],
        },
        {
            gadget: MissileGadget,
            endAtHealthFraction: 0.4,
            healthRange: [0.4, 0.8],
            actions: [
                {
                    name: "Intro Launch",
                    move: EggmanMoveTypes.Perch,
                    attack: EggmanAttackTypes.Missiles,
                    repeat: [1, 1],
                    height: 13,
                    speed: 3,
                    preAttackTime: 2 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "Eggy Orbit",
                    move: EggmanMoveTypes.OrbitShrine,
                    attack: EggmanAttackTypes.EggroboDrop,
                    repeat: [2, 2],
                    height: 9,
                    speed: 0.6,
                    preAttackTime: 2 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "Taunt",
                    move: EggmanMoveTypes.Stationary,
                    attack: EggmanAttackTypes.None,
                    repeat: [1, 1],
                    height: 7,
                    speed: 3,
                    preAttackTime: 3 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "Single Swoop",
                    move: EggmanMoveTypes.Chase,
                    attack: EggmanAttackTypes.Swoop,
                    repeat: [1, 1],
                    height: 2,
                    speed: 1.15,
                    preAttackTime: 3 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "Launch 2",
                    move: EggmanMoveTypes.Chase,
                    attack: EggmanAttackTypes.Missiles,
                    repeat: [1, 1],
                    height: 10,
                    speed: 2,
                    preAttackTime: 2 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "Launch 3",
                    move: EggmanMoveTypes.OrbitShrine,
                    attack: EggmanAttackTypes.Missiles,
                    repeat: [2, 2],
                    height: 13,
                    speed: 2,
                    preAttackTime: 0.5 * 20,
                    moveWhileAttacking: true,
                    stuns: true,
                },
                {
                    name: "Rapid Orbit",
                    move: EggmanMoveTypes.OrbitShrine,
                    attack: EggmanAttackTypes.None,
                    repeat: [1, 1],
                    height: 13,
                    speed: 4,
                    preAttackTime: 3 * 20,
                    moveWhileAttacking: false,
                    stuns: false,
                },
            ],
        },
        {
            gadget: LaserGadget,
            endAtHealthFraction: 0.0,
            healthRange: [0.0, 0.4],
            actions: [
                {
                    name: "Camp",
                    move: EggmanMoveTypes.Perch,
                    attack: EggmanAttackTypes.Laser,
                    repeat: [1, 1],
                    height: 15,
                    speed: 1.5,
                    preAttackTime: 3 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "Epic Eggy Orbit",
                    move: EggmanMoveTypes.OrbitShrine,
                    attack: EggmanAttackTypes.EggroboDrop,
                    repeat: [4, 4],
                    height: 10,
                    speed: 4.5,
                    preAttackTime: 1.05 * 20,
                    moveWhileAttacking: false,
                    stuns: false,
                },
                {
                    name: "Taunt",
                    move: EggmanMoveTypes.Stationary,
                    attack: EggmanAttackTypes.None,
                    repeat: [1, 1],
                    height: 9,
                    speed: 3,
                    preAttackTime: 2 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "Single Swoop",
                    move: EggmanMoveTypes.Chase,
                    attack: EggmanAttackTypes.Swoop,
                    repeat: [1, 1],
                    height: 2,
                    speed: 1.5,
                    preAttackTime: 3 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "To the Outside",
                    move: EggmanMoveTypes.OrbitShrine,
                    attack: EggmanAttackTypes.None,
                    repeat: [1, 1],
                    height: 9,
                    speed: 1.5,
                    preAttackTime: 1.5 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "Sniper",
                    move: EggmanMoveTypes.Stationary,
                    attack: EggmanAttackTypes.Laser,
                    repeat: [1, 1],
                    height: 15,
                    speed: 1.5,
                    preAttackTime: 1 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "Single Swoop",
                    move: EggmanMoveTypes.Chase,
                    attack: EggmanAttackTypes.Swoop,
                    repeat: [1, 1],
                    height: 2,
                    speed: 1.5,
                    preAttackTime: 3 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
                {
                    name: "Final Laser",
                    move: EggmanMoveTypes.Chase,
                    attack: EggmanAttackTypes.Laser,
                    repeat: [2, 2],
                    height: 15,
                    speed: 3,
                    preAttackTime: 0.5 * 20,
                    moveWhileAttacking: true,
                    stuns: true,
                },
                {
                    name: "Epic Eggy Orbit",
                    move: EggmanMoveTypes.OrbitShrine,
                    attack: EggmanAttackTypes.EggroboDrop,
                    repeat: [4, 4],
                    height: 10,
                    speed: 4,
                    preAttackTime: 1.15 * 20,
                    moveWhileAttacking: false,
                    stuns: false,
                },
                {
                    name: "Taunt",
                    move: EggmanMoveTypes.Stationary,
                    attack: EggmanAttackTypes.None,
                    repeat: [1, 1],
                    height: 9,
                    speed: 3,
                    preAttackTime: 2 * 20,
                    moveWhileAttacking: true,
                    stuns: false,
                },
            ],
        },
    ];

    readonly PlayerDetectionRange = 128;

    readonly HoverStrength = 1.5; // How strong the levitation effect is when eggman is ascending
    readonly ChasePlayerDistanceRange = [12, 14]; // The distance range from the player to maintain when chasing
    readonly ShrineOrbitRadius = 21;
    readonly Speed = {
        OrbitShrine: 0.025,
        GoToShrine: (distance: number) => Math.min(0.06, (distance * 0.06) / 3),
        Chase: (type: "away" | "towards", distance: number) => {
            // type is away when the player is too close and eggman needs to move away
            if (type === "away") return MathUtil.lerpBound(0.02, 0.03, 20 / distance);
            else if (type === "towards") return MathUtil.lerpBound(0.04, 0.1, distance / 20);
            else return 0;
        },
    };

    readonly MovementStateData = {
        chase: { duration: 12 * 20, nextState: "orbit_shrine", property: "gm1_ord:is_chasing" },
        orbit_shrine: { duration: 30 * 20, nextState: "chase", property: "gm1_ord:is_orbiting" },
        go_to_shrine: { duration: 20 * 20, nextState: "chase", property: "gm1_ord:is_going_to_shrine" },
    } as const;

    readonly IntroLength = 10 * 20;
    introTimer = 0;
    readonly DeathLength = 10 * 20;
    deathTimer = 0;
    readonly LootSpawnTime = 7 * 20; //LootSpawnTime should never exceed DeathLength as he will not spawn the item
    hasSpawnedLoot = false;

    // if eggman has been trying to go to the shrine longer than this, he will teleport there
    readonly GoToShrineForceTeleportTime = 12 * 20;

    readonly EggrobosDropCount = 1;
    readonly EggrobosDropInterval = 15; //1.5 seconds
    readonly EggrobosYOffset = -2.2;

    readonly EggroboDetectionRange = 50;
    readonly MaxSimultaneousEggrobos = 12;
    eggroboIntervalTimer = 0;
    eggrobosDropped = 0;

    readonly SwoopAttackRange = 250;
    readonly SwoopAttackSpeed = 1.15;
    readonly SwoopAttackDamage = 8;
    readonly SwoopAttackDamageRange = 2.5;
    readonly SwoopAttackKnockback = 4.5;
    readonly SwoopAttackTelegraphTime = 2 * 20;
    telegraphSwoopRunnerId: number = 0;
    swoopRunnerId: number = 0;

    readonly ChaseMaxTime = 10 * 20;
    chaseTimer = 0;

    readonly ShrineRechargeTime = 10 * 20;
    readonly ShrineHoverHeight = 7.1;
    readonly StunTime = 10 * 20;
    readonly PostStunLevitationTime = 3 * 20;
    readonly StunnedDamageMultiplier = 3;

    readonly RingBurstCount = [32, 32];
    readonly RingHImpulseRange = [0.5, 1.5];
    readonly RingVImpulseRange = [0.5, 0.8];
    readonly RoarKnockbackY = 1.5;
    readonly RoarKnockbackXZ = 5;
    readonly RoarRange = 10;

    readonly VulnerableDamageLimit = 120;
    vulnerableDamagePool = 0;
    vulnerableMode = false;

    hoverStatus: "ascending" | "descending" = "ascending";
    currentLevitationAmplifier = 0;

    xzMovingStatus: "stationary" | "away" | "towards" = "stationary";
    xzDistanceToPlayer = 0;

    movementType: EggmanMoveTypes = EggmanMoveTypes.Chase;

    // "none" is an arbitrary placeholder on spawn which allows any action to be chosen.
    // It's just easier to make it a string so we don't have to worry about type checking later.
    actionName: string = "none";
    // How many times the action still needs to be repeated before it should move to the next action.
    actionRepetitions = 0;
    actionHeight = 0;
    actionAttack = EggmanAttackTypes.None;
    actionStuns = false;
    actionPreAttackTime = 0;
    actionMoveWhileAttacking = false;
    actionSpeed: number = 1;
    actionPhase: number;
    actionIndex = 0;

    preAttackTicks = 0;
    stunned = false;

    prevHealth = 0;
    maxHealth = 0;

    swoopTarget: Entity | undefined = undefined;

    ticksAtShrine = 0;
    arrivedAtShrine = false;

    spawnLocation: V3;

    justDidExtraDamage = false;
    gadget: Gadget | null = null;
    lastGadgetType: (typeof Gadets)[keyof typeof Gadets] | null = null;

    // Set by the shrine marker which spawns Eggman
    spawningPlayer: Player | undefined = undefined;
    lineDirection: V3 | undefined;
    goToShrineTpRunnerId: number | undefined;
    goingToShrineTime = 0;

    constructor(entity: Entity) {
        super(entity, 1);

        if (
            EntityStore.isLinkedEntitySet(entity, "eggmanLinkId") && // If spawned by a shrine
            EntityStore.getLinkedEntity(entity, "eggmanLinkId", false) && // And the shrine is still alive
            !EntityStore.getLinkedEntity(entity, "eggmanLinkId", true) // but the alive shrine is not connected to this entity
        ) {
            this.removeRider();
            entity.remove();
            return;
        }

        this.resetProperties();
        this.ensureRiderExists();

        entity.triggerEvent("gm1_ord:rideable_normal");

        // Record initial health
        const healthComp = this.entity!.getComponent(EntityComponentTypes.Health) as EntityHealthComponent;
        this.prevHealth = healthComp!.currentValue;
        this.maxHealth = healthComp!.effectiveMax;

        this.actionPhase = this.getPhaseBasedOnHealth(this.prevHealth);
        if (this.Phases[this.actionPhase].gadget !== null) this.equipGadget(this.Phases[this.actionPhase].gadget!);

        entity.addEffect("slow_falling", 10000000, { showParticles: false });

        if (!EntityStore.get(entity, "playerInitialized")) {
            EntityStore.set(entity, "playerInitialized", true);
            EntityStore.set(entity, "spawnLocation", entity.location);

            // Set up intro
            entity.setProperty("gm1_ord:doing_intro", true);
            entity.triggerEvent("gm1_ord:invincible_on");
        }
        this.spawnLocation = new V3(EntityStore.get(entity, "spawnLocation"));

        entity.setProperty("gm1_ord:is_charging_eggrobo", false);
        entity.setProperty("gm1_ord:is_dropping_eggrobo", false);
        entity.setProperty("gm1_ord:is_swoop_attacking", false);

        this.startAction();

        this.onWorldEvent("WorldAfterEvents", "entityHurt", (eventData) => {
            if (!EntityUtil.isValid(this.entity)) return;
            if (eventData.hurtEntity.id !== this.entityId) return;

            const healthComp = this.entity!.getComponent(EntityComponentTypes.Health) as EntityHealthComponent;
            let newHealth = healthComp!.currentValue;

            // Don't take damage while at the shrine & push attacker back
            if (this.arrivedAtShrine) {
                // Undo damage
                newHealth += eventData.damage;
                healthComp.setCurrentValue(newHealth);

                // Throw attacker back
                const attacker = eventData.damageSource.damagingEntity;
                if (attacker && attacker.typeId === "minecraft:player") {
                    const eggPos = this.entity.location;
                    let dir = V3.subtract(attacker.location, eggPos);
                    dir.y = 0;
                    dir = dir.normalize();
                    // Custom axial knockback for use during knockback movement
                    const moveComp = MobComponentManager.getInstanceOfComponent(PlayerMovement, attacker) as PlayerMovement;
                    moveComp.axialKnockback = moveComp.axialKnockback.addV3(dir.multiply(this.RoarKnockbackXZ).addY(this.RoarKnockbackY));
                    // Native knockback for use when knockback movement is inactive
                    attacker.applyKnockback(dir.x, dir.z, this.RoarKnockbackXZ, this.RoarKnockbackY);
                }
            }

            if (newHealth <= 1) {
                this.deathTimer = 1;
                this.entity.setProperty("gm1_ord:is_dying", true);
                this.entity.triggerEvent("gm1_ord:invincible_on");
                this.removeGadget();
                this.vulnerableMode = false;
                this.entity!.setProperty("gm1_ord:is_going_to_shrine", false);
                return;
            }

            if (this.justDidExtraDamage) this.justDidExtraDamage = false;
            else if (this.stunned && !this.justDidExtraDamage) {
                const totalDamage = eventData.damage * this.StunnedDamageMultiplier;
                EntityUtil.applyDamage(this.entity, totalDamage, { cause: EntityDamageCause.magic });
                // TODO: Find out whether the stunned state has a damage pool
                /*this.vulnerableDamagePool -= totalDamage;
                if (this.vulnerableDamagePool <= 0) {
                    this.endShrineRecharge();
                    const eggPos = this.entity.location;
                    const targets = EntityUtil.getNearbyPlayers(eggPos, this.RoarRange, this.entity.dimension);
                    for (const player of targets) {
                        let dir = V3.subtract(player.location, eggPos).normalize();
                        // Custom axial knockback for use during knockback movement
                        const moveComp = MobComponentManager.getInstanceOfComponent(PlayerMovement, player) as PlayerMovement;
                        moveComp.axialKnockback = moveComp.axialKnockback.addV3(dir.multiply(this.RoarKnockback));
                        // Native knockback for use when knockback movement is inactive
                        const yDir = dir.y;
                        dir.y = 0;
                        const hDirMagnitude = dir.length();
                        dir = dir.normalize();
                        player.applyKnockback(dir.x, dir.z, hDirMagnitude * this.RoarKnockback, yDir * this.RoarKnockback);
                    }
                }*/
                this.justDidExtraDamage = true;
            }

            // End phase and return to shrine for new gadget
            if (newHealth <= this.maxHealth * this.Phases[this.actionPhase].endAtHealthFraction && !this.vulnerableMode) {
                this.setMoveType(EggmanMoveTypes.GoToShrine);
                this.vulnerableMode = true;
                this.actionAttack = EggmanAttackTypes.None;
                this.entity!.setProperty("gm1_ord:about_to_be_stunned", false);
                if (this.telegraphSwoopRunnerId !== 0) {
                    system.clearRun(this.telegraphSwoopRunnerId);
                    this.telegraphSwoopRunnerId = 0;
                    this.entity!.setProperty("gm1_ord:is_charging_swoop_attack", false);
                } else if (this.swoopRunnerId !== 0) {
                    system.clearRun(this.swoopRunnerId);
                    this.swoopRunnerId = 0;
                    this.entity!.setProperty("gm1_ord:is_swoop_attacking", false);
                    this.entity!.triggerEvent("gm1_ord:rideable_normal");
                    this.swoopTarget = undefined;
                }
                this.endStun();
                RingBurst.RingBurst(
                    this.entity!.dimension,
                    new V3(this.entity!.location),
                    this.RingBurstCount[0],
                    this.RingBurstCount[1],
                    this.RingHImpulseRange[0],
                    this.RingHImpulseRange[1],
                    this.RingVImpulseRange[0],
                    this.RingVImpulseRange[1]
                );
                this.vulnerableDamagePool = this.VulnerableDamageLimit;
                if (this.gadget !== null) this.removeGadget();
            }

            this.prevHealth = newHealth;
        });
    }

    getPhaseBasedOnHealth(health: number) {
        for (let i = 0; i < this.Phases.length; i++) {
            const healthRange = this.Phases[i].healthRange;
            if (health <= this.maxHealth * healthRange[1] && health > this.maxHealth * healthRange[0]) return i;
        }
        return 0;
    }

    process() {
        if (!EntityUtil.isValid(this.entity)) return;

        // Maintain altitude
        if ((this.actionAttack !== EggmanAttackTypes.Swoop || this.preAttackTicks < this.actionPreAttackTime) && !this.stunned)
            this.hoverLoop();

        // Do intro
        if (this.introTimer < this.IntroLength) {
            this.introTimer++;
            if (this.introTimer === this.IntroLength) {
                this.entity.setProperty("gm1_ord:doing_intro", false);
                this.entity.triggerEvent("gm1_ord:invincible_off");
            }
            // Don't do anything else if we're in the intro sequence
            return;
        }

        if (system.currentTick % 30) {
            this.ensureRiderExists();
        }

        // Do death
        if (this.deathTimer > 0) {
            this.deathTimer++;
            if (this.deathTimer >= this.LootSpawnTime && !this.hasSpawnedLoot) {
                const lootPos = this.entity.location;
                this.entity.dimension.runCommandAsync(`loot spawn ${lootPos.x} ${lootPos.y} ${lootPos.z} loot "gm1/ord/blocks/eggman_lt"`);
                this.hasSpawnedLoot = true;
            }
            if (this.deathTimer === this.DeathLength) {
                const linkedShrine = EntityStore.getLinkedEntity(this.entity, "eggmanLinkId");
                if (linkedShrine) MobComponentManager.getInstanceOfComponent(ShrineMarker, linkedShrine).onLinkedEggmanDestroyed();
                this.removeRider();
                this.entity.triggerEvent("gm1_ord:despawn");
            }
            return;
        }

        // Don't do anything but hover while stunned
        if (this.stunned) return;

        const nearestPlayer = this.getNearestPlayer();
        if (!nearestPlayer) return this.goToShrineLoop();

        // Do action movement if in pre-attack period or if action allows movement while attacking
        if (
            this.preAttackTicks < this.actionPreAttackTime ||
            this.actionMoveWhileAttacking ||
            this.movementType === EggmanMoveTypes.GoToShrine
        ) {
            if (this.movementType === EggmanMoveTypes.Chase) this.chasePlayer();
            else if (this.movementType === EggmanMoveTypes.OrbitShrine) this.orbitShrineLoop();
            else if (this.movementType === EggmanMoveTypes.GoToShrine) this.goToShrineLoop();
            else if (this.movementType === EggmanMoveTypes.Perch) this.perchLoop();
            else if (this.movementType === EggmanMoveTypes.Line) this.lineLoop();
        }

        this.gadget?.process();

        if (system.currentTick % 2 === 0) this.lookAtPlayerLoop();

        // Do not process attacks if Eggman is recharging at the shrine
        if (this.movementType === EggmanMoveTypes.GoToShrine) return;

        if (this.preAttackTicks < this.actionPreAttackTime) {
            this.preAttackTicks++;
            if (this.preAttackTicks === this.actionPreAttackTime) this.doActionAttack();
            return;
        }

        if (this.actionAttack === EggmanAttackTypes.EggroboDrop) this.dropEggrobos();
        else if (this.actionAttack === EggmanAttackTypes.Swoop && !this.swoopTarget) {
            this.swoopTarget = this.getSwoopAttackTarget();
            if (this.swoopTarget instanceof Player) this.telegraphSwoopAttack(this.swoopTarget);
        }
    }

    getNearestPlayer() {
        // get the nearest player to eggman but within the range of the shrine
        const nearbyPlayers = EntityUtil.getNearbyPlayers(this.spawnLocation, this.PlayerDetectionRange, this.entity!.dimension);
        const players: { player: Player; distance: number }[] = [];
        for (const player of nearbyPlayers) {
            const distance = V3.distance(this.entity!.location, player.location);
            players.push({ player, distance });
        }
        players.sort((a, b) => a.distance - b.distance);
        return players[0]?.player as Player | undefined;
    }

    nextPhase() {
        this.actionPhase++;
        this.actionIndex = 0;
        if (this.Phases[this.actionPhase].gadget !== null) this.equipGadget(this.Phases[this.actionPhase].gadget!);
        this.startAction();
    }

    nextAction() {
        this.actionIndex = this.actionIndex === this.Phases[this.actionPhase].actions.length - 1 ? 0 : this.actionIndex + 1;
        this.startAction();
    }

    startAction() {
        const action = this.Phases[this.actionPhase].actions[this.actionIndex];
        this.actionName = action.name;
        this.actionRepetitions = MathUtil.randomInt(action.repeat[0], action.repeat[1] + 1);
        this.actionHeight = action.height;
        this.actionAttack = action.attack;
        this.actionStuns = action.stuns;
        this.actionPreAttackTime = action.preAttackTime;
        this.actionMoveWhileAttacking = action.moveWhileAttacking;
        this.actionSpeed = action.speed ?? 1;
        this.setMoveType(action.move);

        this.checkForStunningAction();

        // This starts the pre-attack movement period
        this.preAttackTicks = 0;
    }

    finishAction() {
        this.actionRepetitions -= 1;
        this.preAttackTicks = 0;
        if (this.movementType === EggmanMoveTypes.Chase) this.chaseTimer = 0;
        this.checkForStunningAction();
        // This starts the pre-attack movement period
        if (this.actionRepetitions !== 0) return;

        // If there are no repetitions left, move on to another action
        if (this.actionStuns) {
            this.stunned = true;
            this.entity!.removeEffect("levitation");
            this.entity!.removeEffect("slow_falling");
            this.entity!.setProperty("gm1_ord:about_to_be_stunned", false);
            this.entity!.setProperty("gm1_ord:is_stunned", true);
            this.timeout(() => {
                this.endStun();
                // If the gadget has been destroyed, go to the shrine instead of picking a new action
                if (this.movementType !== EggmanMoveTypes.GoToShrine) this.nextAction();
            }, this.StunTime);
        } else this.nextAction();
    }

    endStun() {
        if (!this.stunned) return;
        this.stunned = false;
        this.entity!.setProperty("gm1_ord:is_stunned", false);
        this.entity!.addEffect("slow_falling", 10000000, { showParticles: false });
        this.entity!.addEffect("levitation", this.PostStunLevitationTime, { amplifier: 1, showParticles: false });
    }

    checkForStunningAction() {
        if (this.actionStuns && this.actionRepetitions === 1) this.entity!.setProperty("gm1_ord:about_to_be_stunned", true);
    }

    doActionAttack() {
        if (this.actionAttack === EggmanAttackTypes.None) this.finishAction();
        else if (this.actionAttack === EggmanAttackTypes.Laser && this.gadget instanceof LaserGadget) this.gadget.laserTelegraph();
        else if (this.actionAttack === EggmanAttackTypes.Missiles && this.gadget instanceof MissileGadget) this.gadget.shootMissileBurst();
    }

    setMoveType(newMoveType: EggmanMoveTypes) {
        switch (this.movementType) {
            case EggmanMoveTypes.Chase: {
                this.entity!.setProperty("gm1_ord:is_chasing", false);
                break;
            }
            case EggmanMoveTypes.GoToShrine: {
                this.entity!.setProperty("gm1_ord:is_going_to_shrine", false);
                break;
            }
            case EggmanMoveTypes.OrbitShrine: {
                this.entity!.setProperty("gm1_ord:is_orbiting", false);
                break;
            }
            case EggmanMoveTypes.Stationary: {
                this.entity!.setProperty("gm1_ord:is_staionary", false);
                break;
            }
            case EggmanMoveTypes.Perch: {
                this.entity!.setProperty("gm1_ord:is_perching", false);
                break;
            }
            case EggmanMoveTypes.Line: {
                this.entity!.setProperty("gm1_ord:is_line", false);
                break;
            }
        }
        this.movementType = newMoveType;
        switch (this.movementType) {
            case EggmanMoveTypes.Chase: {
                this.entity!.setProperty("gm1_ord:is_chasing", true);
                this.chaseTimer = 0;
                break;
            }
            case EggmanMoveTypes.GoToShrine: {
                this.entity!.setProperty("gm1_ord:is_going_to_shrine", true);
                break;
            }
            case EggmanMoveTypes.OrbitShrine: {
                this.entity!.setProperty("gm1_ord:is_orbiting", true);
                break;
            }
            case EggmanMoveTypes.Stationary: {
                this.entity!.setProperty("gm1_ord:is_staionary", true);
                break;
            }
            case EggmanMoveTypes.Perch: {
                this.entity!.setProperty("gm1_ord:is_perching", true);
                break;
            }
            case EggmanMoveTypes.Line: {
                this.entity!.setProperty("gm1_ord:is_line", true);
                // Record the player's position at the moment of entering the Line move type
                const nearestPlayer = this.getNearestPlayer();
                if (nearestPlayer) {
                    const bossLocation = new V3(this.entity!.location);
                    const playerLocation = new V3(nearestPlayer.location);
                    this.lineDirection = bossLocation.subtractV3(playerLocation).normalize();
                } else {
                    this.lineDirection = new V3(1, 0, 0);
                }
                break;
            }
        }
    }

    getSwoopAttackTarget() {
        const nearestPlayer = this.getNearestPlayer();
        if (!nearestPlayer) return;

        const location = new V3(this.entity!.location);
        const playerLocation = new V3(nearestPlayer.location);

        const groundLocation = location.setY(playerLocation.y + 3.5);
        const groundLocationToPlayerDirection = playerLocation.subtractV3(groundLocation).normalize();

        const visiblePlayer = this.entity?.dimension
            .getEntitiesFromRay(groundLocation, groundLocationToPlayerDirection, {
                includePassableBlocks: false,
                maxDistance: this.SwoopAttackRange,
            })
            .find((entity) => entity.entity.id === nearestPlayer.id);
        if (!visiblePlayer) return;

        return nearestPlayer;
    }

    telegraphSwoopAttack(target: Player) {
        this.entity!.setProperty("gm1_ord:is_charging_swoop_attack", true);
        this.telegraphSwoopRunnerId = this.timeout(() => {
            this.entity!.setProperty("gm1_ord:is_charging_swoop_attack", false);
            this.telegraphSwoopRunnerId = 0;
            this.swoopAttack(target);
        }, this.SwoopAttackTelegraphTime);
    }

    swoopAttack(target: Player) {
        const targetLocation = new V3(target.location).addY(-1.5);
        let swoopTime = 0;
        this.entity!.setProperty("gm1_ord:is_swoop_attacking", true);
        this.entity!.triggerEvent("gm1_ord:rideable_swoop");
        this.swoopRunnerId = this.interval(() => {
            const location = new V3(this.entity!.location);
            const directionToTarget = targetLocation.subtractV3(location).normalize();
            this.entity!.clearVelocity();
            this.entity!.applyImpulse(directionToTarget.multiply(this.SwoopAttackSpeed).addY(0.3));
            swoopTime++;

            const distanceToTargetLocation = location.subtractV3(targetLocation).length();
            const distanceToTarget = location.subtractV3(target.location).length();
            if (
                swoopTime > 60 ||
                distanceToTargetLocation < this.SwoopAttackDamageRange ||
                distanceToTarget < this.SwoopAttackDamageRange
            ) {
                system.clearRun(this.swoopRunnerId);
                this.swoopRunnerId = 0;
                this.entity!.setProperty("gm1_ord:is_swoop_attacking", false);
                this.entity!.triggerEvent("gm1_ord:rideable_normal");
                this.swoopTarget = undefined;
                this.finishAction();

                const nearestPlayer = EntityUtil.getNearestPlayer(
                    this.entity!.location,
                    this.entity!.dimension,
                    this.SwoopAttackDamageRange + 0.5
                );
                if (!nearestPlayer) return;

                const isPlayerUnderneathEggman = location.y + 1 > nearestPlayer.location.y;
                const horizontalVelocity = new V3(this.entity!.getVelocity()).setY(0).length();
                if (isPlayerUnderneathEggman && horizontalVelocity > 0.3) {
                    // if (target.hasTag("gm1_ord_in_ball_mode")) {
                    //     return;
                    // }
                    EntityUtil.applyDamage(target, this.SwoopAttackDamage);
                    target.applyKnockback(
                        directionToTarget.x,
                        directionToTarget.z,
                        1 * this.SwoopAttackKnockback,
                        0.3 * this.SwoopAttackKnockback
                    );
                }
            }
        }, 1);
    }

    resetProperties() {
        const properties = [
            "gm1_ord:laser_offset_z",
            "gm1_ord:laser_offset_y",
            "gm1_ord:laser_rot_x",
            "gm1_ord:laser_rot_y",
            "gm1_ord:laser_length",
            "gm1_ord:is_charging_laser",
            "gm1_ord:is_shooting_laser",
            "gm1_ord:is_dropping_eggrobo",
            "gm1_ord:is_charging_swoop_attack",
            "gm1_ord:is_swoop_attacking",
            "gm1_ord:is_shooting_drills",
            "gm1_ord:active_gadget",
            "gm1_ord:is_orbiting",
            "gm1_ord:is_going_to_shrine",
            "gm1_ord:is_stunned",
            "gm1_ord:is_staionary",
            "gm1_ord:is_chasing",
            "gm1_ord:is_perching",
            "gm1_ord:is_line",
            "gm1_ord:is_charging_gadget",
            "gm1_ord:is_using_gadget",
            "gm1_ord:doing_intro",
            "gm1_ord:is_dying",
            "gm1_ord:taken_critical_hit",
        ];
        properties.forEach((propId) => {
            this.entity!.resetProperty(propId);
        });
    }

    equipGadget(gadget: (typeof Gadets)[keyof typeof Gadets]) {
        this.gadget = new gadget(this.entity!, this);

        this.entity!.setProperty("gm1_ord:active_gadget", this.gadget.gadgetId);

        this.lastGadgetType = gadget;
    }

    removeGadget() {
        this.clearGadgetRunners();

        if (this.gadget) this.gadget.destroy();
        this.gadget = null;

        this.entity!.setProperty("gm1_ord:active_gadget", 0);
        this.entity!.setProperty("gm1_ord:is_charging_gadget", false);
        this.entity!.setProperty("gm1_ord:is_using_gadget", false);
    }

    clearGadgetRunners() {
        if (this.gadget instanceof LaserGadget && this.gadget.laserRunnerID !== 0) system.clearRun(this.gadget.laserRunnerID);
        else if (this.gadget instanceof MissileGadget) this.gadget.stopShooting();
    }

    lookAtPlayerLoop() {
        const nearestPlayer = this.getNearestPlayer();
        if (!nearestPlayer) return;
        const playerLocation = new V3(nearestPlayer.location);
        const location = new V3(this.entity!.location);
        const directionToPlayer = playerLocation.subtractV3(location).normalize();

        const currentRotationYaw = this.entity!.getRotation().y;
        const targetRotationYaw = MathUtil.vectorToRotation(directionToPlayer).y;

        const difference = MathUtil.fmod(targetRotationYaw - currentRotationYaw + 180, 360) - 180;
        const newRotation = currentRotationYaw + difference * 0.66;

        this.entity!.setRotation(new V2(0, newRotation));
    }

    dropEggrobos() {
        // Timer so we don't spawn a ton of eggrobos all at once
        this.eggroboIntervalTimer = this.eggroboIntervalTimer === this.EggrobosDropInterval ? 0 : this.eggroboIntervalTimer + 1;
        if (this.eggroboIntervalTimer !== 0) return;

        // If we are at the max number of nearby eggrobos, finish the action
        const eggrobosNearby = EntityUtil.getEntities(
            { location: this.entity!.location, type: "gm1_ord:badnik_eggrobo", maxDistance: this.EggroboDetectionRange },
            this.entity!.dimension
        );
        if (eggrobosNearby.length >= this.MaxSimultaneousEggrobos) {
            this.eggrobosDropped = 0;
            this.eggroboIntervalTimer = 0;
            this.finishAction();
            return;
        }

        // Spawn an eggrobo and check to see if we've spawned enough for the action
        this.timeline({
            0: () => {
                this.entity!.setProperty("gm1_ord:is_charging_eggrobo", true);
            },
            0.25: () => {
                this.entity!.setProperty("gm1_ord:is_charging_eggrobo", false);
                this.entity!.setProperty("gm1_ord:is_dropping_eggrobo", true);
            },
            0.425: () => {
                EntityUtil.spawnEntity(
                    "gm1_ord:badnik_eggrobo",
                    new V3(this.entity!.location.x, this.entity!.location.y + this.EggrobosYOffset, this.entity!.location.z),
                    this.entity!.dimension
                );
                this.eggrobosDropped += 1;
                this.entity!.setProperty("gm1_ord:is_dropping_eggrobo", false);
                if (this.eggrobosDropped === this.EggrobosDropCount) {
                    this.eggrobosDropped = 0;
                    this.eggroboIntervalTimer = 0;
                    this.finishAction();
                }
            },
        });
    }

    hoverLoop() {
        const nearestPlayer = this.getNearestPlayer();
        const groundBlock = this.getGroundBlock(this.entity!.location);

        if (!groundBlock) {
            this.hoverStatus = "descending";
            return;
        }

        let higherMinLevel = groundBlock.location.y;
        if (nearestPlayer) {
            const playerGroundBlock = this.getGroundBlock(nearestPlayer.location);
            higherMinLevel = Math.max(higherMinLevel, playerGroundBlock?.location.y || -64);
        }

        const distanceToGround = this.entity!.location.y - higherMinLevel;

        const hoverDistanceToGround = this.movementType === EggmanMoveTypes.GoToShrine ? this.ShrineHoverHeight : this.actionHeight;
        this.hoverStatus = distanceToGround < hoverDistanceToGround ? "ascending" : "descending";

        let newLevitationLevel = -1;
        if (this.hoverStatus === "ascending") {
            newLevitationLevel = Math.round(MathUtil.lerpBound(0, this.HoverStrength, 35 / distanceToGround));
        }

        if (newLevitationLevel !== this.currentLevitationAmplifier) {
            this.entity!.removeEffect("levitation");
            if (newLevitationLevel >= 0) {
                this.entity!.addEffect("levitation", 10000000, { amplifier: newLevitationLevel, showParticles: false });
            }
            this.currentLevitationAmplifier = newLevitationLevel;
        }
    }

    getGroundBlock(location: Vector3) {
        const block = this.entity!.dimension.getBlockFromRay(location, new V3(0, -1, 0), { maxDistance: 40 })?.block;
        return block;
    }

    chasePlayer() {
        const nearestPlayer = this.getNearestPlayer();
        if (!nearestPlayer) {
            this.xzMovingStatus = "stationary";
            this.xzDistanceToPlayer = Infinity;
            return;
        }

        if (!this.stunned) this.chaseTimer++;
        if (this.chaseTimer >= this.ChaseMaxTime) this.finishAction();

        const location = new V3(this.entity!.location);
        const playerLocation = new V3(nearestPlayer.location);

        this.xzDistanceToPlayer = location.subtractV3(playerLocation).setY(0).length();

        if (this.xzDistanceToPlayer < this.ChasePlayerDistanceRange[0]) {
            this.xzMovingStatus = "away";
        } else if (this.xzDistanceToPlayer > this.ChasePlayerDistanceRange[1]) {
            this.xzMovingStatus = "towards";
        } else {
            this.xzMovingStatus = "stationary";
        }

        if (this.xzMovingStatus === "stationary") return;

        const directionToPlayer = playerLocation.subtractV3(location).normalize().setY(0);

        const baseSpeed = this.Speed.Chase(this.xzMovingStatus, this.xzDistanceToPlayer);
        const finalSpeed = baseSpeed * this.actionSpeed;
        this.entity!.applyImpulse(directionToPlayer.multiply(this.xzMovingStatus === "away" ? -finalSpeed : finalSpeed));
    }

    orbitShrineLoop() {
        const currentLocation = new V3(this.entity!.location).setY(0);
        const shrineLocation = this.spawnLocation.setY(0);

        const directionToEggman = currentLocation.subtractV3(shrineLocation).normalize();
        const oribtLocation = shrineLocation.addV3(directionToEggman.multiply(this.ShrineOrbitRadius));

        const distanceToOrbitVector = oribtLocation.subtractV3(currentLocation);

        const revolveAroundShrineVector = directionToEggman.cross(new V3(0, 1, 0)).normalize();

        const finalFollowOrbitVector = distanceToOrbitVector.addV3(revolveAroundShrineVector).normalize();

        // This keeps Eggman from getting stuck if he's positioned exactly at his spawn
        // (which happens if an Orbit action is the first one he tries when spawned)
        if (finalFollowOrbitVector.length() === 0) finalFollowOrbitVector.x = 1;

        const baseSpeed = this.Speed.OrbitShrine;
        const finalSpeed = baseSpeed * this.actionSpeed;
        this.entity!.applyImpulse(finalFollowOrbitVector.multiply(finalSpeed));
    }

    ensureRiderExists() {
        const rider = this.getRider();
        if (!rider) {
            const riderComponent = this.entity!.getComponent(EntityRideableComponent.componentId) as EntityRideableComponent | undefined;
            const rider = EntityUtil.spawnEntity("gm1_ord:eggman_rider", this.entity!.location, this.entity!.dimension);
            riderComponent!.addRider(rider);
        }
    }

    removeRider() {
        const rider = this.getRider();
        if (rider) rider.remove();
    }

    getRider() {
        const riderComponent = this.entity!.getComponent(EntityRideableComponent.componentId) as EntityRideableComponent | undefined;
        return riderComponent?.getRiders()[0];
    }

    goToShrineLoop() {
        const currentLocation = new V3(this.entity!.location);
        const shrineLocation = new V3(this.spawnLocation.x, this.spawnLocation.y + this.ShrineHoverHeight, this.spawnLocation.z);

        const directionToShrine = shrineLocation.subtractV3(currentLocation).normalize();
        const distanceToShrine = currentLocation.subtractV3(shrineLocation).length();

        if (this.goToShrineTpRunnerId === undefined && !this.arrivedAtShrine) {
            this.goToShrineTpRunnerId = this.timeout(() => {
                this.goToShrineTpRunnerId = undefined;
                this.entity?.teleport(shrineLocation);
                this.goingToShrineTime = 0;
            }, this.GoToShrineForceTeleportTime);
        }

        // Attacks like Badnik Bounce can make Eggman wobble around the shrine, sending him out of detection range.
        // Instead of widening the detection radius, which might still be error-prone, we detect when Eggman first reaches the shrine and assume he stays fairly close to it.
        if (distanceToShrine < 3 && !this.arrivedAtShrine) {
            if (!this.arrivedAtShrine) this.entity!.setProperty("gm1_ord:at_shrine", true);
            this.arrivedAtShrine = true;
            if (this.goToShrineTpRunnerId !== undefined) {
                system.clearRun(this.goToShrineTpRunnerId);
                this.goToShrineTpRunnerId = undefined;
                this.goingToShrineTime = 0;
            }
        }

        if (this.arrivedAtShrine) {
            this.ticksAtShrine += 1;
            if (this.ticksAtShrine === this.ShrineRechargeTime) this.endShrineRecharge();
        }

        const baseSpeed = this.Speed.GoToShrine(distanceToShrine);
        const finalSpeed = baseSpeed * this.actionSpeed;

        let impulseDirection = directionToShrine.multiply(finalSpeed);
        if (!this.arrivedAtShrine && this.goingToShrineTime < 20) {
            impulseDirection = impulseDirection.addY(0.75).normalize().multiply(finalSpeed);
        }
        this.entity!.applyImpulse(impulseDirection);

        this.goingToShrineTime++;
    }

    lineLoop() {
        if (!this.lineDirection) return;
        const baseSpeed = 0.076;
        const finalSpeed = baseSpeed * this.actionSpeed;
        this.entity!.applyImpulse(this.lineDirection.multiply(finalSpeed));
    }

    endShrineRecharge() {
        if (this.vulnerableMode) {
            this.nextPhase();
            this.vulnerableMode = false;
        } else this.nextAction();
        this.arrivedAtShrine = false;
        this.entity!.setProperty("gm1_ord:at_shrine", false);
        this.ticksAtShrine = 0;
    }

    perchLoop() {
        const currentLocation = new V3(this.entity!.location).setY(0);
        const shrineLocation = this.spawnLocation.setY(0);

        const directionToShrine = shrineLocation.subtractV3(currentLocation).normalize();
        const distanceToShrine = currentLocation.subtractV3(shrineLocation).length();

        const baseSpeed = this.Speed.GoToShrine(distanceToShrine);
        const finalSpeed = baseSpeed * this.actionSpeed;
        this.entity!.applyImpulse(directionToShrine.multiply(finalSpeed));
    }

    signalCriticalHit() {
        this.entity!.setProperty("gm1_ord:taken_critical_hit", true);
        this.timeout(() => this.entity!.setProperty("gm1_ord:taken_critical_hit", false), 1);
    }
}
