"use strict";

// Migrate an old savegame to the current format.
// settingsVarReturn is assumed to be a struct containing a property 'val',
//   which will be initialized with the new settingsVar object.
//   (We can't set the outer variable directly from within a function)
function migrateGameData(loadVar, settingsVarReturn) {
    // BACKWARD COMPATIBILITY SECTION //////////////////
    // v1.1.35: eliminated 2nd variable

    // v1.1.13: population.corpses moved to corpses.total
    if (!isValid(loadVar.corpses)) { loadVar.corpses = {}; }
    if (isValid(loadVar.population) && isValid(loadVar.population.corpses)) {
        if (!isValid(loadVar.corpses.total)) {
            loadVar.corpses.total = loadVar.population.corpses;
        }
        delete loadVar.population.corpses;
    }
    // v1.1.17: population.apothecaries moved to population.healers 
    if (isValid(loadVar.population) && isValid(loadVar.population.apothecaries)) {
        if (!isValid(loadVar.population.healers)) {
            loadVar.population.healers = loadVar.population.apothecaries;
        }
        delete loadVar.population.apothecaries;
    }

    // v1.1.28: autosave changed to a bool
    loadVar.autosave = (loadVar.autosave !== false && loadVar.autosave !== "off");

    // v1.1.29: 'deity' upgrade renamed to 'worship'
    if (isValid(loadVar.upgrades) && isValid(loadVar.upgrades.deity)) {
        if (!isValid(loadVar.upgrades.worship)) {
            loadVar.upgrades.worship = loadVar.upgrades.deity;
        }
        delete loadVar.upgrades.deity;
    }
    // v1.1.30: Upgrade flags converted from int to bool (should be transparent)
    // v1.1.31: deity.devotion moved to devotion.total.
    if (!isValid(loadVar.devotion)) { loadVar.devotion = {}; }
    if (isValid(loadVar.deity) && isValid(loadVar.deity.devotion)) {
        if (!isValid(loadVar.devotion.total)) {
            loadVar.devotion.total = loadVar.deity.devotion;
        }
        delete loadVar.deity.devotion;
    }
    // v1.1.33: Achievement flags converted from int to bool (should be transparent)
    // v1.1.33: upgrades.deityType no longer used
    if (isValid(loadVar.upgrades)) { delete loadVar.upgrades.deityType; }

    // v1.1.34: Most efficiency values now recomputed from base values.
    if (isValid(loadVar.efficiency)) {
        loadVar.efficiency = { happiness: loadVar.efficiency.happiness };
    }

    // v1.1.38: Most assets moved to curCiv substructure
    if (!isValid(loadVar.curCiv)) {
        loadVar.curCiv = {
            civName: loadVar.civName,
            rulerName: loadVar.rulerName,

            // Migrate resources
            food: { owned: loadVar.food.total, net: (loadVar.food.net || 0) },
            wood: { owned: loadVar.wood.total, net: (loadVar.wood.net || 0) },
            stone: { owned: loadVar.stone.total, net: (loadVar.stone.net || 0) },
            skins: { owned: loadVar.skins.total },
            herbs: { owned: loadVar.herbs.total },
            ore: { owned: loadVar.ore.total },
            leather: { owned: loadVar.leather.total },
            metal: { owned: loadVar.metal.total },
            piety: { owned: loadVar.piety.total },
            gold: { owned: loadVar.gold.total },
            corpses: { owned: loadVar.corpses.total },
            devotion: { owned: loadVar.devotion.total },

            // land (total land) is now stored as free land, so do that calculation.
            freeLand: {
                owned: loadVar.land - (loadVar.tent.total + loadVar.whut.total + loadVar.cottage.total
                    + loadVar.house.total + loadVar.mansion.total + loadVar.barn.total + loadVar.woodstock.total
                    + loadVar.stonestock.total + loadVar.tannery.total + loadVar.smithy.total + loadVar.apothecary.total
                    + loadVar.temple.total + loadVar.barracks.total + loadVar.stable.total + loadVar.mill.total
                    + loadVar.graveyard.total + loadVar.fortification.total + loadVar.battleAltar.total
                    + loadVar.fieldsAltar.total + loadVar.underworldAltar.total + loadVar.catAltar.total)
            },

            // Migrate buildings
            tent: { owned: loadVar.tent.total },
            // Hut ID also changed from 'whut' to 'hut'.
            hut: { owned: loadVar.whut.total },
            cottage: { owned: loadVar.cottage.total },
            house: { owned: loadVar.house.total },
            mansion: { owned: loadVar.mansion.total },
            barn: { owned: loadVar.barn.total },
            woodstock: { owned: loadVar.woodstock.total },
            stonestock: { owned: loadVar.stonestock.total },
            tannery: { owned: loadVar.tannery.total },
            smithy: { owned: loadVar.smithy.total },
            apothecary: { owned: loadVar.apothecary.total },
            temple: { owned: loadVar.temple.total },
            barracks: { owned: loadVar.barracks.total },
            stable: { owned: loadVar.stable.total },
            mill: { owned: loadVar.mill.total },
            graveyard: { owned: loadVar.graveyard.total },
            fortification: { owned: loadVar.fortification.total },
            battleAltar: { owned: loadVar.battleAltar.total },
            fieldsAltar: { owned: loadVar.fieldsAltar.total },
            underworldAltar: { owned: loadVar.underworldAltar.total },
            catAltar: { owned: loadVar.catAltar.total }
        };
        // Delete old values.
        delete loadVar.civName;
        delete loadVar.rulerName;
        delete loadVar.food;
        delete loadVar.wood;
        delete loadVar.stone;
        delete loadVar.skins;
        delete loadVar.herbs;
        delete loadVar.ore;
        delete loadVar.leather;
        delete loadVar.metal;
        delete loadVar.piety;
        delete loadVar.gold;
        delete loadVar.corpses;
        delete loadVar.devotion;
        delete loadVar.land;
        delete loadVar.tent;
        delete loadVar.whut;
        delete loadVar.cottage;
        delete loadVar.house;
        delete loadVar.mansion;
        delete loadVar.barn;
        delete loadVar.woodstock;
        delete loadVar.stonestock;
        delete loadVar.tannery;
        delete loadVar.smithy;
        delete loadVar.apothecary;
        delete loadVar.temple;
        delete loadVar.barracks;
        delete loadVar.stable;
        delete loadVar.mill;
        delete loadVar.graveyard;
        delete loadVar.fortification;
        delete loadVar.battleAltar;
        delete loadVar.fieldsAltar;
        delete loadVar.underworldAltar;
        delete loadVar.catAltar;
    }

    if (isValid(loadVar.upgrades)) {
        // Migrate upgrades
        loadVar.curCiv.skinning = { owned: loadVar.upgrades.skinning };
        loadVar.curCiv.harvesting = { owned: loadVar.upgrades.harvesting };
        loadVar.curCiv.prospecting = { owned: loadVar.upgrades.prospecting };
        loadVar.curCiv.domestication = { owned: loadVar.upgrades.domestication };
        loadVar.curCiv.ploughshares = { owned: loadVar.upgrades.ploughshares };
        loadVar.curCiv.irrigation = { owned: loadVar.upgrades.irrigation };
        loadVar.curCiv.butchering = { owned: loadVar.upgrades.butchering };
        loadVar.curCiv.gardening = { owned: loadVar.upgrades.gardening };
        loadVar.curCiv.extraction = { owned: loadVar.upgrades.extraction };
        loadVar.curCiv.flensing = { owned: loadVar.upgrades.flensing };
        loadVar.curCiv.macerating = { owned: loadVar.upgrades.macerating };
        loadVar.curCiv.croprotation = { owned: loadVar.upgrades.croprotation };
        loadVar.curCiv.selectivebreeding = { owned: loadVar.upgrades.selectivebreeding };
        loadVar.curCiv.fertilisers = { owned: loadVar.upgrades.fertilisers };
        loadVar.curCiv.masonry = { owned: loadVar.upgrades.masonry };
        loadVar.curCiv.construction = { owned: loadVar.upgrades.construction };
        loadVar.curCiv.architecture = { owned: loadVar.upgrades.architecture };
        loadVar.curCiv.tenements = { owned: loadVar.upgrades.tenements };
        loadVar.curCiv.slums = { owned: loadVar.upgrades.slums };
        loadVar.curCiv.granaries = { owned: loadVar.upgrades.granaries };
        loadVar.curCiv.palisade = { owned: loadVar.upgrades.palisade };
        loadVar.curCiv.weaponry = { owned: loadVar.upgrades.weaponry };
        loadVar.curCiv.shields = { owned: loadVar.upgrades.shields };
        loadVar.curCiv.horseback = { owned: loadVar.upgrades.horseback };
        loadVar.curCiv.wheel = { owned: loadVar.upgrades.wheel };
        loadVar.curCiv.writing = { owned: loadVar.upgrades.writing };
        loadVar.curCiv.administration = { owned: loadVar.upgrades.administration };
        loadVar.curCiv.codeoflaws = { owned: loadVar.upgrades.codeoflaws };
        loadVar.curCiv.mathematics = { owned: loadVar.upgrades.mathematics };
        loadVar.curCiv.aesthetics = { owned: loadVar.upgrades.aesthetics };
        loadVar.curCiv.civilservice = { owned: loadVar.upgrades.civilservice };
        loadVar.curCiv.feudalism = { owned: loadVar.upgrades.feudalism };
        loadVar.curCiv.guilds = { owned: loadVar.upgrades.guilds };
        loadVar.curCiv.serfs = { owned: loadVar.upgrades.serfs };
        loadVar.curCiv.nationalism = { owned: loadVar.upgrades.nationalism };
        loadVar.curCiv.worship = { owned: loadVar.upgrades.worship };
        loadVar.curCiv.lure = { owned: loadVar.upgrades.lure };
        loadVar.curCiv.companion = { owned: loadVar.upgrades.companion };
        loadVar.curCiv.comfort = { owned: loadVar.upgrades.comfort };
        loadVar.curCiv.blessing = { owned: loadVar.upgrades.blessing };
        loadVar.curCiv.waste = { owned: loadVar.upgrades.waste };
        loadVar.curCiv.stay = { owned: loadVar.upgrades.stay };
        loadVar.curCiv.riddle = { owned: loadVar.upgrades.riddle };
        loadVar.curCiv.throne = { owned: loadVar.upgrades.throne };
        loadVar.curCiv.lament = { owned: loadVar.upgrades.lament };
        loadVar.curCiv.book = { owned: loadVar.upgrades.book };
        loadVar.curCiv.feast = { owned: loadVar.upgrades.feast };
        loadVar.curCiv.secrets = { owned: loadVar.upgrades.secrets };
        loadVar.curCiv.standard = { owned: loadVar.upgrades.standard };
        loadVar.curCiv.trade = { owned: loadVar.upgrades.trade };
        loadVar.curCiv.currency = { owned: loadVar.upgrades.currency };
        loadVar.curCiv.commerce = { owned: loadVar.upgrades.commerce };
        delete loadVar.upgrades;
    }
    if (isValid(loadVar.achievements)) {
        // Migrate achievements
        loadVar.curCiv.hamletAch = { owned: loadVar.achievements.hamlet };
        loadVar.curCiv.villageAch = { owned: loadVar.achievements.village };
        loadVar.curCiv.smallTownAch = { owned: loadVar.achievements.smallTown };
        loadVar.curCiv.largeTownAch = { owned: loadVar.achievements.largeTown };
        loadVar.curCiv.smallCityAch = { owned: loadVar.achievements.smallCity };
        loadVar.curCiv.largeCityAch = { owned: loadVar.achievements.largeCity };
        loadVar.curCiv.metropolisAch = { owned: loadVar.achievements.metropolis };
        loadVar.curCiv.smallNationAch = { owned: loadVar.achievements.smallNation };
        loadVar.curCiv.nationAch = { owned: loadVar.achievements.nation };
        loadVar.curCiv.largeNationAch = { owned: loadVar.achievements.largeNation };
        loadVar.curCiv.empireAch = { owned: loadVar.achievements.empire };
        loadVar.curCiv.raiderAch = { owned: loadVar.achievements.raider };
        loadVar.curCiv.engineerAch = { owned: loadVar.achievements.engineer };
        loadVar.curCiv.dominationAch = { owned: loadVar.achievements.domination };
        loadVar.curCiv.hatedAch = { owned: loadVar.achievements.hated };
        loadVar.curCiv.lovedAch = { owned: loadVar.achievements.loved };
        loadVar.curCiv.catAch = { owned: loadVar.achievements.cat };
        loadVar.curCiv.glaringAch = { owned: loadVar.achievements.glaring };
        loadVar.curCiv.clowderAch = { owned: loadVar.achievements.clowder };
        loadVar.curCiv.battleAch = { owned: loadVar.achievements.battle };
        loadVar.curCiv.catsAch = { owned: loadVar.achievements.cats };
        loadVar.curCiv.fieldsAch = { owned: loadVar.achievements.fields };
        loadVar.curCiv.underworldAch = { owned: loadVar.achievements.underworld };
        loadVar.curCiv.fullHouseAch = { owned: loadVar.achievements.fullHouse };
        // ID 'plague' changed to 'plagued'.
        loadVar.curCiv.plaguedAch = { owned: loadVar.achievements.plague };
        loadVar.curCiv.ghostTownAch = { owned: loadVar.achievements.ghostTown };
        loadVar.curCiv.wonderAch = { owned: loadVar.achievements.wonder };
        loadVar.curCiv.sevenAch = { owned: loadVar.achievements.seven };
        loadVar.curCiv.merchantAch = { owned: loadVar.achievements.merchant };
        loadVar.curCiv.rushedAch = { owned: loadVar.achievements.rushed };
        loadVar.curCiv.neverclickAch = { owned: loadVar.achievements.neverclick };
        delete loadVar.achievements;
    }
    if (isValid(loadVar.population)) {
        // Migrate population
        loadVar.curCiv.cat = { owned: loadVar.population.cats };
        loadVar.curCiv.zombie = { owned: loadVar.population.zombies };
        loadVar.curCiv.grave = { owned: loadVar.population.graves };
        loadVar.curCiv.unemployed = { owned: loadVar.population.unemployed };
        loadVar.curCiv.farmer = { owned: loadVar.population.farmers };
        loadVar.curCiv.woodcutter = { owned: loadVar.population.woodcutters };
        loadVar.curCiv.miner = { owned: loadVar.population.miners };
        loadVar.curCiv.tanner = { owned: loadVar.population.tanners };
        loadVar.curCiv.blacksmith = { owned: loadVar.population.blacksmiths };
        loadVar.curCiv.healer = { owned: loadVar.population.healers };
        loadVar.curCiv.cleric = { owned: loadVar.population.clerics };
        loadVar.curCiv.labourer = { owned: loadVar.population.labourers };
        loadVar.curCiv.soldier = { owned: loadVar.population.soldiers };
        loadVar.curCiv.cavalry = { owned: loadVar.population.cavalry };
        loadVar.curCiv.soldierParty = { owned: loadVar.population.soldiersParty };
        loadVar.curCiv.cavalryParty = { owned: loadVar.population.cavalryParty };
        loadVar.curCiv.siege = { owned: loadVar.population.siege };
        loadVar.curCiv.esoldier = { owned: loadVar.population.esoldiers };
        loadVar.curCiv.efort = { owned: loadVar.population.eforts };
        loadVar.curCiv.unemployedIll = { owned: loadVar.population.unemployedIll };
        loadVar.curCiv.farmerIll = { owned: loadVar.population.farmersIll };
        loadVar.curCiv.woodcutterIll = { owned: loadVar.population.woodcuttersIll };
        loadVar.curCiv.minerIll = { owned: loadVar.population.minersIll };
        loadVar.curCiv.tannerIll = { owned: loadVar.population.tannersIll };
        loadVar.curCiv.blacksmithIll = { owned: loadVar.population.blacksmithsIll };
        loadVar.curCiv.healerIll = { owned: loadVar.population.healersIll };
        loadVar.curCiv.clericIll = { owned: loadVar.population.clericsIll };
        loadVar.curCiv.labourerIll = { owned: loadVar.population.labourersIll };
        loadVar.curCiv.soldierIll = { owned: loadVar.population.soldiersIll };
        loadVar.curCiv.cavalryIll = { owned: loadVar.population.cavalryIll };
        loadVar.curCiv.wolf = { owned: loadVar.population.wolves };
        loadVar.curCiv.bandit = { owned: loadVar.population.bandits };
        loadVar.curCiv.barbarian = { owned: loadVar.population.barbarians };
        loadVar.curCiv.esiege = { owned: loadVar.population.esiege };
        loadVar.curCiv.enemySlain = { owned: loadVar.population.enemiesSlain };
        loadVar.curCiv.shade = { owned: loadVar.population.shades };
        delete loadVar.population;
    }

    // v1.1.38: Game settings moved to settings object, but we deliberately
    // don't try to migrate them.  'autosave', 'worksafe', and 'fontSize'
    // values from earlier versions will be discarded.

    // v1.1.39: Migrate more save fields into curCiv.
    if (isValid(loadVar.resourceClicks)) {
        loadVar.curCiv.resourceClicks = loadVar.resourceClicks;
        delete loadVar.resourceClicks;
    }
    if (!isValid(loadVar.curCiv.resourceClicks)) {
        loadVar.curCiv.resourceClicks = 999; //stops people getting the achievement with an old save version
    }
    if (isValid(loadVar.graceCost)) {
        loadVar.curCiv.graceCost = loadVar.graceCost;
        delete loadVar.graceCost;
    }
    if (isValid(loadVar.walkTotal)) {
        loadVar.curCiv.walkTotal = loadVar.walkTotal;
        delete loadVar.walkTotal;
    }

    // v1.1.39: Migrate deities to use IDs.
    if (isValid(loadVar.deityArray)) {
        loadVar.curCiv.deities = [];
        loadVar.deityArray.forEach(function (row) {
            loadVar.curCiv.deities.unshift({ name: row[1], domain: typeToId(row[2]), maxDev: row[3] });
        });
        delete loadVar.deityArray;
    }

    if (isValid(loadVar.deity) && isValid(loadVar.curCiv.devotion)) {
        loadVar.curCiv.deities.unshift({ name: loadVar.deity.name, domain: typeToId(loadVar.deity.type), maxDev: loadVar.curCiv.devotion.owned });
        delete loadVar.deity;
    }

    // v1.1.39: Settings moved to their own variable
    if (isValid(loadVar.settings)) {
        settingsVarReturn.val = loadVar.settings;
        delete loadVar.settings;
    }

    // v1.1.39: Raiding now stores enemy population instead of 'iterations'.
    if (isValid(loadVar.raiding) && isValid(loadVar.raiding.iterations)) {
        loadVar.raiding.epop = loadVar.raiding.iterations * 20;
        // Plunder calculations now moved to the start of the raid.
        // This should rarely happen, but give a consolation prize.
        loadVar.raiding.plunderLoot = { gold: 1 };
        delete loadVar.raiding.iterations;
    }

    if (isValid(loadVar.throneCount)) // v1.1.55: Moved to substructure
    {
        if (!isValid(loadVar.curCiv.throne)) { loadVar.curCiv.throne = {}; }
        loadVar.curCiv.throne.count = loadVar.throneCount || 0;
        delete loadVar.throneCount;
    }

    if (isValid(loadVar.gloryTimer)) // v1.1.55: Moved to substructure
    {
        if (!isValid(loadVar.curCiv.glory)) { loadVar.curCiv.glory = {}; }
        loadVar.curCiv.glory.timer = loadVar.gloryTimer || 0;
        delete loadVar.gloryTimer;
    }

    if (isValid(loadVar.walkTotal)) // v1.1.55: Moved to substructure
    {
        if (!isValid(loadVar.curCiv.walk)) { loadVar.curCiv.walk = {}; }
        loadVar.curCiv.walk.rate = loadVar.walkTotal || 0;
        delete loadVar.walkTotal;
    }

    if (isValid(loadVar.pestTimer)) // v1.1.55: Moved to substructure
    {
        if (!isValid(loadVar.curCiv.pestControl)) { loadVar.curCiv.pestControl = {}; }
        loadVar.curCiv.pestControl.timer = loadVar.pestTimer || 0;
        delete loadVar.pestTimer;
    }

    if (isValid(loadVar.graceCost)) // v1.1.55: Moved to substructure
    {
        if (!isValid(loadVar.curCiv.grace)) { loadVar.curCiv.grace = {}; }
        loadVar.curCiv.grace.cost = loadVar.graceCost || 1000;
        delete loadVar.graceCost;
    }

    if (isValid(loadVar.cureCounter)) // v1.1.55: Moved to substructure
    {
        if (!isValid(loadVar.curCiv.healer)) { loadVar.curCiv.healer = {}; }
        loadVar.curCiv.healer.cureCount = loadVar.cureCounter || 0;
        delete loadVar.cureCounter;
    }

    if (isValid(loadVar.efficiency)) // v1.1.59: efficiency.happiness moved to curCiv.morale.efficiency.
    {
        if (!isValid(loadVar.curCiv.morale)) { loadVar.curCiv.morale = {}; }
        loadVar.curCiv.morale.efficiency = loadVar.efficiency.happiness || 1.0;
        delete loadVar.efficiency; // happiness was the last remaining efficiency subfield.
    }

    if (isValid(loadVar.raiding)) // v1.1.59: raiding moved to curCiv.raid
    {
        if (!isValid(loadVar.curCiv.raid)) { loadVar.curCiv.raid = loadVar.raiding; }
        delete loadVar.raiding;
    }

    if (isValid(loadVar.targetMax)) // v1.1.59: targeMax moved to curCiv.raid.targetMax
    {
        if (!isValid(loadVar.curCiv.raid)) { loadVar.curCiv.raid = {}; }
        loadVar.curCiv.raid.targetMax = loadVar.targetMax;
        delete loadVar.targetMax;
    }

    if (isValid(loadVar.curCiv.tradeCounter)) // v1.1.59: curCiv.tradeCounter moved to curCiv.trader.counter
    {
        if (!isValid(loadVar.curCiv.trader)) { loadVar.curCiv.trader = {}; }
        loadVar.curCiv.trader.counter = loadVar.curCiv.tradeCounter || 0;
        delete loadVar.curCiv.tradeCounter;
    }

    if (isValid(loadVar.wonder) && isValid(loadVar.wonder.array)) // v1.1.59: wonder.array moved to curCiv.wonders
    {
        if (!isValid(loadVar.curCiv.wonders)) {
            loadVar.curCiv.wonders = [];
            loadVar.wonder.array.forEach(function (elem) {
                // Format converted from [name,resourceId] to {name: name, resourceId: resourceId}
                loadVar.curCiv.wonders.push({ name: elem[0], resourceId: elem[1] });
            });
        }
        delete loadVar.wonder.array;
    }

    if (isValid(loadVar.wonder)) // v1.1.59: wonder moved to curCiv.curWonder
    {
        if (isValid(loadVar.wonder.total)) { delete loadVar.wonder.total; } // wonder.total no longer used.
        if (isValid(loadVar.wonder.food)) { delete loadVar.wonder.food; } // wonder.food no longer used.
        if (isValid(loadVar.wonder.wood)) { delete loadVar.wonder.wood; } // wonder.wood no longer used.
        if (isValid(loadVar.wonder.stone)) { delete loadVar.wonder.stone; } // wonder.stone no longer used.
        if (isValid(loadVar.wonder.skins)) { delete loadVar.wonder.skins; } // wonder.skins no longer used.
        if (isValid(loadVar.wonder.herbs)) { delete loadVar.wonder.herbs; } // wonder.herbs no longer used.
        if (isValid(loadVar.wonder.ore)) { delete loadVar.wonder.ore; } // wonder.ore no longer used.
        if (isValid(loadVar.wonder.leather)) { delete loadVar.wonder.leather; } // wonder.leather no longer used.
        if (isValid(loadVar.wonder.piety)) { delete loadVar.wonder.piety; } // wonder.piety no longer used.
        if (isValid(loadVar.wonder.metal)) { delete loadVar.wonder.metal; } // wonder.metal no longer used.
        if (!isValid(loadVar.wonder.stage) && isValid(loadVar.wonder.building) && isValid(loadVar.wonder.completed)) {
            // This ugly formula merges the 'building' and 'completed' fields into 'stage'.
            loadVar.wonder.stage = (2 * loadVar.wonder.completed) + (loadVar.wonder.building != loadVar.wonder.completed);
            delete loadVar.wonder.building;
            delete loadVar.wonder.completed;
        }
        if (!isValid(loadVar.curCiv.curWonder)) { loadVar.curCiv.curWonder = loadVar.wonder; }
        delete loadVar.wonder;
    }

    ////////////////////////////////////////////////////

    //v1.4.2
    // variable trading prices
    if (!isValid(loadVar.curCiv.food.tradeAmount)) {
        loadVar.curCiv.food.tradeAmount = civData.food.initTradeAmount;
    }
    if (!isValid(loadVar.curCiv.wood.tradeAmount)) {
        loadVar.curCiv.wood.tradeAmount = civData.wood.initTradeAmount;
    }
    if (!isValid(loadVar.curCiv.stone.tradeAmount)) {
        loadVar.curCiv.stone.tradeAmount = civData.stone.initTradeAmount;
    }
    if (!isValid(loadVar.curCiv.skins.tradeAmount)) {
        loadVar.curCiv.skins.tradeAmount = civData.skins.initTradeAmount;
    }
    if (!isValid(loadVar.curCiv.herbs.tradeAmount)) {
        loadVar.curCiv.herbs.tradeAmount = civData.herbs.initTradeAmount;
    }
    if (!isValid(loadVar.curCiv.ore.tradeAmount)) {
        loadVar.curCiv.ore.tradeAmount = civData.ore.initTradeAmount;
    }
    if (!isValid(loadVar.curCiv.leather.tradeAmount)) {
        loadVar.curCiv.leather.tradeAmount = civData.leather.initTradeAmount;
    }
    if (!isValid(loadVar.curCiv.metal.tradeAmount)) {
        loadVar.curCiv.metal.tradeAmount = civData.metal.initTradeAmount;
    }

    // v1.4.4
    // v1.4.5
    //v1.4.7 - palace

    //v1.4.8 - cornexchange
    if (!isValid(loadVar.curCiv.cornexchange)) {
        // reset tradeAmount from previous versions
        loadVar.curCiv.food.tradeAmount = civData.food.initTradeAmount;
        loadVar.curCiv.wood.tradeAmount = civData.wood.initTradeAmount;
        loadVar.curCiv.stone.tradeAmount = civData.stone.initTradeAmount;
        loadVar.curCiv.skins.tradeAmount = civData.skins.initTradeAmount;
        loadVar.curCiv.herbs.tradeAmount = civData.herbs.initTradeAmount;
        loadVar.curCiv.ore.tradeAmount = civData.ore.initTradeAmount;
        loadVar.curCiv.leather.tradeAmount = civData.leather.initTradeAmount;
        loadVar.curCiv.metal.tradeAmount = civData.metal.initTradeAmount;
    }

    //v1.4.10 - potions
    if (!isValid(loadVar.curCiv.potions)) {
        loadVar.curCiv.potions = { owned: 0, tradeAmount: civData.potions.initTradeAmount };
    }

    //v1.4.11 - carpentry
    if (!isValid(loadVar.curCiv.carpentry) && isValid(loadVar.curCiv.masonry.owned)) {
        loadVar.curCiv.carpentry = { owned: loadVar.curCiv.masonry.owned };
    }

    //v1.4.19 - engineering, rampart, battlement
    if (!isValid(loadVar.curCiv.engineering) && isValid(loadVar.curCiv.architecture.owned)) {
        loadVar.curCiv.engineering = { owned: loadVar.curCiv.architecture.owned };
    }

    //v1.4.20 - more upgrades
    if (!isValid(loadVar.curCiv.farming) && isValid(loadVar.curCiv.flensing.owned)) {
        loadVar.curCiv.farming = { owned: loadVar.curCiv.flensing.owned };
    }
    if (!isValid(loadVar.curCiv.agriculture) && isValid(loadVar.curCiv.croprotation.owned)) {
        loadVar.curCiv.agriculture = { owned: loadVar.curCiv.croprotation.owned };
    }
    if (!isValid(loadVar.curCiv.metalwork) && isValid(loadVar.curCiv.weaponry.owned)) {
        loadVar.curCiv.metalwork = { owned: loadVar.curCiv.weaponry.owned };
    }

    //v1.4.21 - more upgrades
    if (!isValid(loadVar.curCiv.mining) && isValid(loadVar.curCiv.prospecting.owned)) {
        loadVar.curCiv.mining = { owned: loadVar.curCiv.prospecting.owned };
    }

    // v1.4.22 - theism
    if (!isValid(loadVar.curCiv.theism) && isValid(loadVar.curCiv.writing.owned)) {
        loadVar.curCiv.theism = { owned: loadVar.curCiv.writing.owned };
    }

    // v1.4.23 - felling
    if (!isValid(loadVar.curCiv.felling) && isValid(loadVar.curCiv.harvesting.owned)) {
        loadVar.curCiv.felling = { owned: loadVar.curCiv.harvesting.owned };
    }
    // v1.4.24 - quarrying
    if (!isValid(loadVar.curCiv.quarrying) && isValid(loadVar.curCiv.mining.owned)) {
        loadVar.curCiv.quarrying = { owned: loadVar.curCiv.mining.owned };
    }
}
