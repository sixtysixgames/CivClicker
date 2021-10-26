"use strict";
/*
 * Global constants 
 * 
 */

/*
 * Constants - because we don't like hard-coded strings
 */
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

