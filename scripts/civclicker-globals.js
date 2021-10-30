"use strict";
/*
 * Global constants 
 * 
 */

/*
 * Constants - because we don't like hard-coded strings
 * do not use the defer attribute on the script tag in index.html
 * because these must exist before everything else
 */
const app = {
    loopTimer: 0,

    // TODO: Update the version numbering internally
    version: 33, // This is an ordinal used to trigger reloads. 66g No it doesn't 
    //66g Always increment versionData if adding/modifying element to civData
    versionData: new VersionData(1, 4, 24, "alpha"), // this is not accurate.  

    saveTag: "civ",
    saveTag2: this.saveTag + "2", // For old saves.
    saveSettingsTag: "civSettings",
    logRepeat: 1,
    sysLogRepeat: 1
};

// see -classes
const civObjType = {
    resource: "resource",
    building: "building",
    upgrade: "upgrade",
    unit: "unit",
    achievement: "achievement"
};
// used in civData
const resourceType = {
    food: "food",
    wood: "wood",
    stone: "stone",
    skins: "skins",
    herbs: "herbs",
    ore: "ore",
    leather: "leather",
    potions: "potions",
    metal: "metal",
    piety: "piety",
    gold: "gold",
    corpses: "corpses",
    devotion: "devotion"
};
const buildingType = {
    freeLand: "freeLand",
    tent: "tent",
    hut: "hut",
    cottage: "cottage",
    house: "house",
    mansion: "mansion",
    palace: "palace",
    barn: "barn",
    woodstock: "woodstock",
    stonestock: "stonestock",
    tannery: "tannery",
    smithy: "smithy",
    apothecary: "apothecary",
    temple: "temple",
    barracks: "barracks",
    stable: "stable",
    graveyard: "graveyard",
    mill: "mill",
    fortification: "fortification",
    battleAltar: "battleAltar",
    fieldsAltar: "fieldsAltar",
    underworldAltar: "underworldAltar",
    catAltar: "catAltar"
};
const unitType = {
    unemployed: "unemployed",
    farmer: "farmer",
    woodcutter: "woodcutter",
    miner: "miner",
    tanner: "tanner",
    blacksmith: "blacksmith",
    healer: "healer",
    cleric: "cleric",
    labourer: "labourer",
    soldier: "soldier",
    cavalry: "cavalry",
    totalSick: "totalSick",
    cat: "cat",
    shade: "shade",
    wolf: "wolf",
    bandit: "bandit",
    barbarian: "barbarian",
    invader: "invader",
    esiege: "esiege",
    soldierParty: "soldierParty",
    cavalryParty: "cavalryParty",
    siege: "siege",
    esoldier: "esoldier",
    ecavalry: "ecavalry",
    efort: "efort"
};
// attackers enum
// need a corresponding unit in civData
// used in doMobs()
const mobTypeIds = {
    wolf: unitType.wolf,
    bandit: unitType.bandit,
    barbarian: unitType.barbarian,
    invader: unitType.invader
};
const subTypes = {
    normal: "normal",
    basic: "basic",
    special: "special",
    land: "land",
    altar: "altar",
    upgrade: "upgrade",
    deity: "deity",
    pantheon: "pantheon",
    conquest: "conquest",
    trade: "trade",
    prayer: "prayer"
};
const alignmentType = {
    player: "player",
    enemy: "enemy"
};
const speciesType = {
    human: "human",
    animal: "animal",
    mechanical: "mechanical",
    undead: "undead"
};
const placeType = {
    home: "home",
    party: "party"
};
const combatTypes = {
    infantry: "infantry",
    cavalry: "cavalry",
    animal: "animal"
};

const saveTypes = {
    auto: "auto",
    export: "export",
    manual: "manual"
};
const deityDomains = {
    underworld: "underworld",
    battle: "battle",
    fields: "fields",
    cats: "cats"
};
const deityTypes = {
    Battle: "Battle",
    Underworld: "Underworld",
    Fields: "Fields",
    Cats: "Cats"
};

// Civ size category minimums
const civSizes = [
    { min_pop: 0, name: "Tribe", id: "tribe" },
    { min_pop: 10, name: "Thorp", id: "thorp" },
    { min_pop: 50, name: "Hamlet", id: "hamlet" },
    { min_pop: 100, name: "Village", id: "village" },
    { min_pop: 500, name: "Small Town", id: "smallTown" },
    { min_pop: 1000, name: "Town", id: "town" },
    { min_pop: 2500, name: "Large Town", id: "largeTown" },
    { min_pop: 5000, name: "Small City", id: "smallCity" },
    { min_pop: 10000, name: "City", id: "city" },
    { min_pop: 25000, name: "Large City", id: "largeCity" },
    { min_pop: 50000, name: "City State", id: "metropolis" },
    { min_pop: 100000, name: "Small Nation", id: "smallNation" },
    { min_pop: 250000, name: "Nation", id: "nation" },
    { min_pop: 500000, name: "Large Nation", id: "largeNation" },
    { min_pop: 1000000, name: "Empire", id: "empire" }
];

//
const PATIENT_LIST = [
    unitType.healer, unitType.cleric, unitType.farmer, unitType.soldier, unitType.cavalry, unitType.labourer,
    unitType.woodcutter, unitType.miner, unitType.tanner, unitType.blacksmith, unitType.unemployed
];
