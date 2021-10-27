"use strict";
/**
	CivClicker
	Copyright (C) 2014; see the README.md file for authorship.

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program in the LICENSE file.
	If it is not there, see <http://www.gnu.org/licenses/>.
**/
/*
 * Variables
 */

var setup = {};
var loopTimer = 0;

// TODO: Update the version numbering internally
var version = 30; // This is an ordinal used to trigger reloads. No it doesn't 
//Always increment versionData if adding new element to civData
var versionData = new VersionData(1, 4, 18, "alpha"); // this is not accurate.  

var saveTag = "civ";
var saveTag2 = saveTag + "2"; // For old saves.
var saveSettingsTag = "civSettings";
var logRepeat = 1;
var sysLogRepeat = 1;

// Declare variables here so they can be referenced later.  
var curCiv = {
    civName: "Tribe",
    rulerName: "Chief",

    zombie: { owned: 0 },
    grave: { owned: 0 },
    enemySlain: { owned: 0 },
    morale: {
        mod: 1.0,
        efficiency: 1.0
    },

    resourceClicks: 0, // For NeverClick
    attackCounter: 0, // How long since last attack?

    trader: {
        materialId: "",
        requested: 0,
        timer: 0, // How many seconds will the trader be around
        counter: 0, // How long since last trader?
        userTraded: false // did the user trade the requested material?
    },

    raid: {
        raiding: false, // Are we in a raid right now?
        victory: false, // Are we in a "raid succeeded" (Plunder-enabled) state right now?
        left: 0, // how many raids left
        invadeciv: null,
        epop: 0,  // Population of enemy we're raiding.
        plunderLoot: {}, // Loot we get if we win.
        last: "",
        targetMax: civSizes[0].id // Largest target allowed
    },

    curWonder: {
        name: "",
        stage: 0, // 0 = Not started, 1 = Building, 2 = Built, awaiting selection, 3 = Finished.
        progress: 0, // Percentage completed.
        rushed: false
    },
    wonders: [],  // Array of {name: name, resourceId: resourceId} for all wonders.

    // Known deities.  The 0th element is the current game's deity.
    // If the name is "", no deity has been created (can also check for worship upgrade)
    // If the name is populated but the domain is not, the domain has not been selected.
    deities: [{ name: "", domain: "", maxDev: 0 }]  // array of { name, domain, maxDev }

    //xxx We're still accessing many of the properties put here by civData
    //elements without going through the civData accessors.  That should change.
};

// These are not saved, but we need them up here for the asset data to init properly.
var population = {
    current: 0,
    living: 0,
    zombie: 0,
    limit: 0,
    healthy: 0,
    totalSick: 0,
    extra: 0
};

// Caches the total number of each wonder, so that we don't have to recount repeatedly.
var wonderCount = {};

// Build a variety of additional indices so that we can iterate over specific
// subsets of our civ objects.
var resourceData = []; // All resources
var buildingData = []; // All buildings
var upgradeData = []; // All upgrades
var powerData = []; // All 'powers' //xxx This needs refinement.
var unitData = []; // All units
var achData = []; // All achievements
var sackable = []; // All buildings that can be destroyed
var lootable = []; // All resources that can be stolen
var killable = []; // All units that can be destroyed
var homeBuildings = []; // All buildings to be displayed in the home area
var homeUnits = []; // All units to be displayed in the home area
var armyUnits = []; // All units to be displayed in the army area
var basicResources = []; // All basic (click-to-get) resources
var normalUpgrades = []; // All upgrades to be listed in the normal upgrades area

// These are settings that should probably be tied to the browser.
var settings = {
    autosave: true,
    autosaveCounter: 1,
    autosaveTime: 60, //Currently autosave is every minute. Might change to 5 mins in future.
    customIncr: false,
    fontSize: 1.0,
    delimiters: true,
    textShadow: false,
    notes: true,
    worksafe: false,
    useIcons: true
};

var civData = getCivData(); // Giant array of data, defined in "data" js

function getWonderResources(civData) {
    // The resources that Wonders consume, and can give bonuses for.
    return wonderResources = [
        civData.food,
        civData.wood,
        civData.stone,
        civData.skins,
        civData.herbs,
        civData.ore,
        civData.leather,
        civData.potions,
        civData.metal,
        civData.piety
    ];
}
// The resources that Wonders consume, and can give bonuses for.
var wonderResources = getWonderResources(civData); // defined in "data" js

function setIndexArrays(civData) {
    civData.forEach(function (elem) {
        if (!(elem instanceof CivObj)) {
            console.error("Unknown type:", elem);
            return;
        }
        if (elem.type == civObjType.resource) {
            resourceData.push(elem);
            if (elem.vulnerable === true) {
                lootable.push(elem);
            }
            if (elem.subType == subTypes.basic) {
                basicResources.push(elem);
            }
            setInitTradePrice(elem);
        }
        if (elem.type == civObjType.building) {
            buildingData.push(elem);
            if (elem.vulnerable === true) { sackable.push(elem); }
            if (elem.subType == subTypes.normal || elem.subType == subTypes.land) { homeBuildings.push(elem); }
        }
        if (elem.subType == subTypes.prayer) {
            powerData.push(elem);
        } else if (elem.type == civObjType.upgrade) {
            upgradeData.push(elem);
            if (elem.subType == subTypes.upgrade) {
                normalUpgrades.push(elem);
            }
        }
        if (elem.type == civObjType.unit) {
            unitData.push(elem);
            if (elem.vulnerable === true) { killable.push(elem); }
            if (elem.place == placeType.home) { homeUnits.push(elem); }
            if (elem.place == placeType.party) { armyUnits.push(elem); }
        }
        if (elem.type == civObjType.achievement) {
            achData.push(elem);
        }
    });
}

// For efficiency, we set up a single bulk listener for all of the buttons, rather
// than putting a separate listener on each button.
function onBulkEvent(e) {
    switch (dataset(e.target, "action")) {
        case "increment": return onIncrement(e.target);
        case "purchase": return onPurchase(e.target);
        case "raid": return onInvade(e.target);
        case "raid-mult": return onInvadeMult(e.target);
    }
    return false;
}

// Game functions

//This function is called every time a player clicks on a primary resource button
function increment(objId) {
    var purchaseObj = civData[objId];
    var numArmy = 0;

    if (!purchaseObj) {
        console.log("Unknown purchase: " + objId);
        sysLog("Unknown purchase: " + objId);
        return;
    }

    unitData.forEach(function (elem) {
        if ((elem.alignment == alignmentType.player) && (elem.species == speciesType.human)
            && (elem.combatType) && (elem.place == placeType.home)) {
            numArmy += elem.owned;
        }
    }); // Nationalism adds military units.

    purchaseObj.owned += purchaseObj.increment
        + (purchaseObj.increment * 9 * (civData.civilservice.owned))
        + (purchaseObj.increment * 40 * (civData.feudalism.owned))
        + ((civData.serfs.owned) * Math.floor(Math.log(civData.unemployed.owned * 10 + 1)))
        + ((civData.nationalism.owned) * Math.floor(Math.log(numArmy * 10 + 1)));

    //Handles random collection of special resources.
    var specialChance = purchaseObj.specialChance;
    if (specialChance && purchaseObj.specialMaterial && civData[purchaseObj.specialMaterial]) {
        if ((purchaseObj === civData.food) && (civData.flensing.owned)) { specialChance += 0.1; }
        if ((purchaseObj === civData.stone) && (civData.macerating.owned)) { specialChance += 0.1; }
        if ((purchaseObj === civData.wood) && (civData.reaping.owned)) { specialChance += 0.1; }
        if (Math.random() < specialChance) {
            var specialMaterial = civData[purchaseObj.specialMaterial];
            var specialQty = purchaseObj.increment * (1 + (9 * (civData.guilds.owned)));
            specialMaterial.owned += specialQty;
            gameLog("Found " + specialMaterial.getQtyName(specialQty) + " while " + purchaseObj.activity); // I18N
        }
    }
    //Checks to see that resources are not exceeding their limits
    if (purchaseObj.owned > purchaseObj.limit) { purchaseObj.owned = purchaseObj.limit; }

    ui.find("#clicks").innerHTML = prettify(Math.round(++curCiv.resourceClicks));
    updateResourceTotals(); //Update the page with totals
}

function onIncrement(control) {
    // We need a valid target to complete this action.
    var targetId = dataset(control, "target");
    if (targetId === null) { return false; }

    return increment(targetId);
}

// Buys or sells a unit, building, or upgrade.
// Pass a positive number to buy, a negative number to sell.
// If it can't add/remove as many as requested, does as many as it can.
// Pass Infinity/-Infinity as the num to get the max possible.
// Pass "custom" or "-custom" to use the custom increment.
// Returns the actual number bought or sold (negative if fired).
function doPurchase(objId, num) {
    var purchaseObj = civData[objId];
    if (!purchaseObj) {
        console.log("Unknown purchase: " + objId);
        sysLog("Unknown purchase: " + objId);
        return 0;
    }
    if (num === undefined) { num = 1; }
    if (abs(num) == "custom") { num = sgn(num) * getCustomNumber(purchaseObj); }

    num = canPurchase(purchaseObj, num);  // How many can we actually get?

    // Pay for them
    num = payFor(purchaseObj.require, num);
    if (abs(num) < 1) {
        gameLog("Could not build, insufficient resources."); // I18N
        return 0;
    }

    //Then increment the total number of that building
    // Do the actual purchase; coerce to the proper type if needed
    purchaseObj.owned = matchType(purchaseObj.owned + num, purchaseObj.initOwned);
    if (purchaseObj.source) { civData[purchaseObj.source].owned -= num; }

    // Post-purchase triggers
    if (isValid(purchaseObj.onGain)) { purchaseObj.onGain(num); } // Take effect

    //Increase devotion if the purchase provides it.
    if (isValid(purchaseObj.devotion)) {
        civData.devotion.owned += purchaseObj.devotion * num;
        // If we've exceeded this deity's prior max, raise it too.
        if (curCiv.deities[0].maxDev < civData.devotion.owned) {
            curCiv.deities[0].maxDev = civData.devotion.owned;
            makeDeitiesTables();
        }
    }

    // If building, then you use up free land
    if (purchaseObj.type == civObjType.building) {
        civData.freeLand.owned -= num;
        // check for overcrowding
        if (civData.freeLand.owned < 0) {
            gameLog("You are suffering from overcrowding.");  // I18N
            adjustMorale(Math.max(num, -civData.freeLand.owned) * -0.0025 * (civData.codeoflaws.owned ? 0.5 : 1.0));
        }

        // v1.4 managed to get 0.5 land, round down
        civData.freeLand.owned = Math.floor(civData.freeLand.owned);
    }

    updateRequirements(purchaseObj); //Increases buildings' costs
    updateResourceTotals(); //Update page with lower resource values and higher building total
    updatePopulation(); //Updates the army display
    updateResourceRows(); //Update resource display
    updateBuildingButtons(); //Update the buttons themselves
    updateJobButtons(); //Update page with individual worker numbers, since limits might have changed.
    updatePartyButtons();
    updateUpgrades(); //Update which upgrades are available to the player
    updateDevotion(); //might be necessary if building was an altar
    updateTargets(); // might enable/disable raiding

    return num;
}

function onPurchase(control) {
    // We need a valid target and a quantity to complete this action.
    var targetId = dataset(control, "target");
    if (targetId === null) { return false; }

    var qty = dataset(control, "quantity");
    if (qty === null) { return false; }

    return doPurchase(targetId, qty);
}

// Create a cat
function spawnCat() {
    ++civData.cat.owned;
    gameLog("Found a cat!");
}

// Creates or destroys workers
function spawn(num) {
    var newJobId = unitType.unemployed;
    var bums = civData.unemployed;
    if (num == "custom") { num = getCustomNumber(bums); }
    if (num == "-custom") { num = -getCustomNumber(bums); }

    // Find the most workers we can spawn
    num = Math.max(num, -bums.owned);  // Cap firing by # in that job.
    num = Math.min(num, logSearchFn(calcWorkerCost, civData.food.owned));

    // Apply population limit, and only allow whole workers.
    num = Math.min(num, (population.limit - population.living));

    // Update numbers and resource levels
    civData.food.owned -= calcWorkerCost(num);

    // New workers enter as a job that has been selected, but we only destroy idle ones.
    newJobId = ui.find("#newSpawnJobSelection").value;
    if (num >= 0 && typeof civData[newJobId] === "object") {
        civData[newJobId].owned += num;
    } else {
        bums.owned += num;
    }
    calculatePopulation(); //Run through the population->job update cycle

    //This is intentionally independent of the number of workers spawned
    if (Math.random() * 100 < 1 + (civData.lure.owned)) { spawnCat(); }

    updateResourceTotals(); //update with new resource number
    updatePopulation();

    return num;
}

// Culls workers when they starve.
function starve(num) {
    var targetObj, i;
    var starveCount = 0;
    if (num === undefined) { num = 1; }
    num = Math.min(num, population.living);

    for (i = 0; i < num; ++i) {
        starveCount += killUnit(pickStarveTarget());
    }
    return starveCount;
}

function doStarve() {
    var corpsesEaten, numberStarve;
    if (civData.food.owned < 0 && civData.waste.owned) // Workers eat corpses if needed
    {
        corpsesEaten = Math.min(civData.corpses.owned, -civData.food.owned);
        civData.corpses.owned -= corpsesEaten;
        civData.food.owned += corpsesEaten;
    }

    if (civData.food.owned < 0) { // starve if there's not enough food.
        //xxx This is very kind.  Only 0.1% deaths no matter how big the shortage?
        //numberStarve = starve(Math.ceil(population.living / 1000));
        //Only 1.0% deaths no matter how big the shortage?
        numberStarve = starve(Math.ceil(Math.random() * population.living / 100));
        if (numberStarve == 1) {
            gameLog("A citizen starved to death");
        } else if (numberStarve > 1) {
            gameLog(prettify(numberStarve) + " citizens starved to death");
        }
        adjustMorale(-0.0025);
        civData.food.owned = 0;
    }
}

function doHomeless() {
    if (population.living > population.limit) {
        // we have homeless, let some die of exposure
        var numHomeless = population.living - population.limit;
        // kill off up to 1% of homeless
        var numDie = starve(Math.ceil(Math.random() * numHomeless / 100));
        if (numDie == 1) {
            gameLog("A homeless citizen died of exposure");
        } else if (numDie > 1) {
            gameLog(prettify(numDie) + " homeless citizens died of exposure");
        }
    }
}

function killUnit(unit) {
    var killed = 0;
    if (!unit) { return 0; }

    if (unit.ill) { unit.ill -= 1; }
    else { unit.owned -= 1; }

    civData.corpses.owned += 1; //Increments corpse number
    //Workers dying may trigger Book of the Dead
    if (civData.book.owned) { civData.piety.owned += 10; }

    if (population.living > 50) {
        // the greater the population, the less the drop in morale
        adjustMorale(-0.0025 / population.living);
    }

    calculatePopulation();
    return 1;
}

function digGraves(num) {
    //Creates new unfilled graves.
    curCiv.grave.owned += 100 * num;
    updatePopulation(); //Update page with grave numbers
}

function gameLoop() {
    //debugging - mark beginning of loop execution
    //var start = new Date().getTime();

    tickAutosave();

    calculatePopulation();

    // The "net" values for special resources are just running totals of the
    // adjustments made each tick; as such they need to be zero'd out at the
    // start of each new tick.
    clearSpecialResourceNets();

    dismissWorkers(); // sometime we end up with more workers than buildings

    // Production workers do their thing.
    doFarmers();
    doWoodcutters();
    doMiners();
    doBlacksmiths();
    doApothecaries();
    doTanners();
    doClerics();

    // Check for starvation
    doStarve();
    // Need to kill workers who die from exposure.
    doHomeless();

    checkResourceLimits();

    //Timers - routines that do not occur every second
    doMobs();
    doPestControl();
    tickGlory();
    doShades();
    doEsiege(civData.esiege, civData.fortification);
    doRaid(placeType.party, alignmentType.player, alignmentType.enemy);
    doRaidCheck(placeType.party, alignmentType.player, alignmentType.enemy);

    //Population-related
    doGraveyards();
    doHealers();
    doPlague();
    doCorpses();
    doThrone();
    tickGrace();
    tickWalk();
    doLabourers();
    tickTraders();

    updateResourceTotals(); //This is the point where the page is updated with new resource totals
    testAchievements();

    //Data changes should be done; now update the UI.
    updateAll();

    //Debugging - mark end of main loop and calculate delta in milliseconds
    //var end = new Date().getTime();
    //var time = end - start;
    //console.log("Main loop execution time: " + time + "ms");
}

//========== TESTING (cheating)
function ruinFun() {
    //Debug function adds loads of stuff for free to help with testing.
    civData.food.owned += 1000000;
    civData.wood.owned += 1000000;
    civData.stone.owned += 1000000;
    civData.barn.owned += 5000;
    civData.woodstock.owned += 5000;
    civData.stonestock.owned += 5000;
    civData.herbs.owned += 1000000;
    civData.skins.owned += 1000000;
    civData.ore.owned += 1000000;
    civData.leather.owned += 1000000;
    civData.potions.owned += 1000000;
    civData.metal.owned += 1000000;
    civData.piety.owned += 1000000;
    civData.gold.owned += 10000;
    renameRuler("Cheater");
    calculatePopulation();
    updateAll();
}

//========== SETUP (Functions meant to be run once on the DOM)
setup.all = function () {
    ui.find("#main").style.display = "none";
    setup.data();
    setup.civSizes();
    document.addEventListener("DOMContentLoaded", function (e) {
        setup.events();
        setup.game();
        setup.loop();
        // Show the game
        ui.find("#main").style.display = "block";
    });
};

setup.events = function () {
    //var openSettingsElt = ui.find(".openSettings");

    //openSettingsElt.addEventListener("click", function () {
    //	var settingsShown = ui.toggle("#settings");
    //	var header = ui.find("#header");
    //	if (settingsShown) {
    //		header.className = "condensed";
    //		openSettingsElt.className = "selected openSettings";
    //	} else {
    //		header.className = "";
    //		openSettingsElt.className = "openSettings";
    //	}
    //});
};

setup.data = function () {
    setIndexArrays(civData);
};

setup.civSizes = function () {
    indexArrayByAttr(civSizes, "id");

    // Annotate with max population and index.
    civSizes.forEach(function (elem, i, arr) {
        elem.max_pop = (i + 1 < arr.length) ? (arr[i + 1].min_pop - 1) : Infinity;
        elem.idx = i;
    });

    civSizes.getCivSize = function (popcnt) {
        var i;
        for (i = 0; i < this.length; ++i) {
            if (popcnt <= this[i].max_pop) { return this[i]; }
        }
        return this[0];
    };
};

setup.game = function () {
    console.log("Setting up game");
    sysLog("Starting game");
    //document.title = "CivClicker ("+versionData+")"; //xxx Not in XML DOM.

    addUITable(basicResources, "basicResources"); // Dynamically create the basic resource table.
    addUITable(homeBuildings, "buildings"); // Dynamically create the building controls table.
    addUITable(homeUnits, "jobs"); // Dynamically create the job controls table.
    addUITable(armyUnits, "party"); // Dynamically create the party controls table.
    addUpgradeRows(); // This sets up the framework for the upgrade items.
    addUITable(normalUpgrades, "upgrades"); // Place the stubs for most upgrades under the upgrades tab.
    addAchievementRows();
    addRaidRows();
    addWonderSelectText();
    makeDeitiesTables();

    if (!load("localStorage")) { //immediately attempts to load
        //Prompt player for names
        renameCiv();
        renameRuler();
    }

    setInitTradeAmount();

    setDefaultSettings();
};

setup.loop = function () {
    // This sets up the main game loop, which is scheduled to execute once per second.
    console.log("Setting up Main Loop");
    gameLoop();
    loopTimer = window.setInterval(gameLoop, 1000); //updates once per second (1000 milliseconds)
};

setup.all();

/*
 * If you're reading this, thanks for playing!
 * This project was my first major HTML5/Javascript game, and was as
 * much about learning Javascript as it is anything else. I hope it
 * inspires others to make better games. :)
 *
 *     David Holley
 */
//3290