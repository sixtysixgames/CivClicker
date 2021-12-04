"use strict";
/* global achData, civData, civObjType, civSizes, curCiv, population, PATIENT_LIST,
  alignmentType, buildingData, killable, lootable, matchType, placeType, resourceData, sackable, speciesType, subTypes, unitData, unitType, 
  getCurDeityDomain, getCustomNumber, getWonderBonus, updateAchievements, updateBuildingButtons, updateDevotion, updateJobButtons, updateMorale, updatePartyButtons, updatePopulation, 
  updateRequirements, updateResourceRows, updateResourceTotals, updateTargets,  updateUpgrades,
 gameLog, isValid, makeDeitiesTables, prettify, spawnCat, sysLog, valOf,
 abs, calcArithSum, logSearchFn, sgn, ui*/
function getCivType() {
    let civType = civSizes.getCivSize(population.living).name;
    if (population.living === 0 && population.limit >= 1000) {
        civType = "Ghost Town";
    }
    if (population.zombie >= 1000 && population.zombie >= 2 * population.living) { //easter egg
        civType = "Necropolis";
    }
    return civType;
}

// Get an object's requirements in text form.
// Pass it a cost object and optional quantity
function getReqText(costObj, qty) {
    if (!isValid(qty)) { qty = 1; }
    costObj = valOf(costObj, qty); // valOf evals it if it's a function
    if (!isValid(costObj)) { return ""; }

    let num;
    let text = "";
    for (let i in costObj) {
        // If the cost is a function, eval it with qty as a param.  Otherwise
        // just multiply by qty.
        num = (typeof costObj[i] == "function") ? (costObj[i](qty)) : (costObj[i] * qty);
        if (!num) { continue; }
        if (text) { text += ", "; }
        text += prettify(Math.round(num)) + " " + civData[i].getQtyName(num);
    }

    return text;
}

// Returns when the player meets the given upgrade prereqs.
// Undefined prereqs are assumed to mean the item is unpurchasable
function meetsPrereqs(prereqObj) {
    if (!isValid(prereqObj)) { return false; }
    //let i;
    for (let i in prereqObj) {
        //xxx HACK:  Ugly special checks for non-upgrade pre-reqs.
        // This should be simplified/eliminated once the resource
        // system is unified.
        if (i === "deity") { // Deity
            if (getCurDeityDomain() != prereqObj[i]) { return false; }
        } else if (i === "wonderStage") { //xxx Hack to check if we're currently building a wonder.
            if (curCiv.curWonder.stage !== prereqObj[i]) { return false; }
        } else if (isValid(civData[i]) && isValid(civData[i].owned)) { // Resource/Building/Upgrade
            if (civData[i].owned < prereqObj[i]) { return false; }
        }
    }

    return true;
}

// Returns how many of this item the player can afford.
// Looks only at the item's cost and the player's resources, and not
// at any other limits.
// Negative quantities are always fully permitted.
// An undefined cost structure is assumed to mean it cannot be purchased.
// A boolean quantity is converted to +1 (true) -1 (false)
//xxx Caps nonlinear purchases at +1, blocks nonlinear sales.
// costObj - The cost substructure of the object to purchase
function canAfford(costObj, qty) {
    if (!isValid(costObj)) { return 0; }
    if (qty === undefined) { qty = Infinity; } // default to as many as we can
    if (qty === false) { qty = -1; } // Selling back a boolean item.

    for (let i in costObj) {
        if (costObj[i] === 0) { continue; }

        //xxx We don't handle nonlinear costs here yet.
        // Cap nonlinear purchases to one at a time.
        // Block nonlinear sales.
        if (typeof costObj[i] == "function") { qty = Math.max(0, Math.min(1, qty)); }

        qty = Math.min(qty, Math.floor(civData[i].owned / valOf(costObj[i])));
        if (qty === 0) { return qty; }
    }

    return qty;
}

// Tries to pay for the specified quantity of the given cost object.
// Pays for fewer if the whole amount cannot be paid.
// Return the quantity that could be afforded.
//xxx DOES NOT WORK for nonlinear building cost items!
function payFor(costObj, qty) {
    if (qty === undefined) { qty = 1; } // default to 1
    if (qty === false) { qty = -1; } // Selling back a boolean item.
    costObj = valOf(costObj, qty); // valOf evals it if it's a function
    if (!isValid(costObj)) { return 0; }

    qty = Math.min(qty, canAfford(costObj));
    if (qty === 0) { return 0; }

    let num;
    for (let i in costObj) {
        // If the cost is a function, eval it with qty as a param.  Otherwise
        // just multiply by qty.
        num = (typeof costObj[i] == "function") ? (costObj[i](qty)) : (costObj[i] * qty);
        if (!num) { continue; }
        civData[i].owned -= num;
    }
    return qty;
}

// Returns the number of the object that we could buy or sell, taking into
// account any applicable limits.
// purchaseObj - The object to purchase
// qty - Maximum number to buy/sell (use -Infinity for the max salable)
function canPurchase(purchaseObj, qty) {
    if (!purchaseObj) { return 0; }
    if (qty === undefined) { qty = Infinity; } // Default to as many as we can.
    if (qty === false) { qty = -1; } // Selling back a boolean item.

    // Can't buy if we don't meet the prereqs.
    if (!meetsPrereqs(purchaseObj.prereqs)) {
        qty = Math.min(qty, 0);
    }

    // Can't sell more than we have (if salable at all)
    qty = Math.max(qty, -(purchaseObj.salable ? purchaseObj.owned : 0));

    // If this is a relocation, can't shift more than our source pool.
    if (purchaseObj.source) {
        qty = Math.min(qty, civData[purchaseObj.source].owned);
    }

    // If this is a destination item, it's just a relocation of an existing
    // item, so we ignore purchase limits.  Otherwise we check them.
    if (purchaseObj.isDest && !purchaseObj.isDest()) {
        //qty = Math.min(qty, purchaseObj.limit - purchaseObj.total);
        qty = Math.min(qty, Math.max(0, purchaseObj.limit - purchaseObj.total));
    }
    // if source limit has changed ie barracks destroyed, we need to check limit of source
    if (purchaseObj.isDest && purchaseObj.isDest() && qty < 0) {
        // we can't relocate back more than the limit
        qty = Math.max(qty, civData[purchaseObj.source].owned - civData[purchaseObj.source].limit);
    }

    // See if we can afford them; return fewer if we can't afford them all
    return Math.min(qty, canAfford(purchaseObj.require));
}

// Buys or sells a unit, building, or upgrade.
// Pass a positive number to buy, a negative number to sell.
// If it can't add/remove as many as requested, does as many as it can.
// Pass Infinity/-Infinity as the num to get the max possible.
// Pass "custom" or "-custom" to use the custom increment.
// Returns the actual number bought or sold (negative if fired).
function doPurchase(objId, num) {
    let purchaseObj = civData[objId];
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
        gameLog("Could not build, insufficient resources"); // I18N
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
            gameLog("You are suffering from overcrowding");  // I18N
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

function getLandTotals() {
    //Update land values
    let ret = { lands: 0, buildings: 0, free: 0, sackableTotal: 0 };
    buildingData.forEach(function (elem) {
        if (elem.subType == subTypes.land) { ret.free += elem.owned; }
        else { ret.buildings += elem.owned; }

        if (elem.vulnerable == true) { ret.sackableTotal += elem.owned; }
    });
    ret.lands = ret.free + ret.buildings;
    return ret;
}

function getResourceTotal() {
    let res = 0;
    for (let i = 0; i < lootable.length; ++i) {
        // resources can be fractional, so we don't count less than 1
        res += Math.floor(lootable[i].owned);
    }
    return res;
}

function testAchievements() {
    achData.forEach(function (achObj) {
        if (civData[achObj.id].owned) { return true; }
        if (isValid(achObj.test) && !achObj.test()) { return false; }
        civData[achObj.id].owned = true;
        gameLog("Achievement Unlocked: " + achObj.getQtyName());
        return true;
    });

    updateAchievements();
}

//Calculates and returns the cost of adding a certain number of workers at the present population
//xxx Make this work for negative numbers
function calcWorkerCost(num, curPop) {
    if (curPop === undefined) {
        curPop = population.living;
    }
    return (20 * num) + calcArithSum(0.01, curPop, curPop + num);
}

function calcZombieCost(num) {
    return calcWorkerCost(num, population.zombie) / 5;
}

//Selects a random healthy worker based on their proportions in the current job distribution.
//xxx Doesn't currently pick from the army
//xxx Take a parameter for how many people to pick.
//xxx Make this able to return multiples by returning a cost structure.
function getRandomHealthyWorker() {
    let num = Math.random() * population.healthy;
    let chance = 0;

    for (let i = 0; i < killable.length; ++i) {
        chance += civData[killable[i].id].owned;
        if (chance > num) { return killable[i].id; }
    }
    return "";
}
function getRandomWorker() {
    let num = Math.random() * population.living;
    let chance = 0;

    for (let i = 0; i < killable.length; ++i) {
        chance += civData[killable[i].id].owned;
        if (chance > num) { return killable[i].id; }
    }
    return "";
}
//Selects a random sackable building based on its proportions in the current distribution.
function getRandomBuilding() {
    let landTotals = getLandTotals();
    let num = Math.random() * landTotals.sackableTotal;
    let chance = 0;

    for (let i = 0; i < sackable.length; ++i) {
        chance += civData[sackable[i].id].owned;
        //debug(sackable[i].id + ": " + chance + " > " + num);
        if (chance > num) { return sackable[i].id; }
    }
    return "";
}
//Selects a random lootable resource based on its proportions in the current distribution.
function getRandomLootableResource() {
    let total = 0;
    for (let i = 0; i < lootable.length; ++i) {
        //total += civData[lootable[i].id].owned;
        total += lootable[i].owned;
    }
    let num = Math.random() * total;
    let chance = 0;

    for (let i = 0; i < lootable.length; ++i) {
        //chance += civData[lootable[i].id].owned;
        chance += lootable[i].owned;
        if (chance > num) { return lootable[i].id; }
    }
    return "";
}
function getRandomTradeableResource() {
    let total = 0;
    let tradeable = [];
    for (let i = 0; i < lootable.length; ++i) {
        // we only want a resource that is owned
        if (lootable[i].owned >= 1) {
            // >= 1 because resources can be fractional
            tradeable.push(lootable[i]);
        }
    }
    if (tradeable.length == 0) { return ""; }

    let selected = tradeable[Math.floor(Math.random() * tradeable.length)];
    return selected;

}
//xxx Eventually, we should have events like deaths affect morale (scaled by %age of total pop)
function adjustMorale(delta) {
    //Changes and updates morale given a delta value
    if (delta > 1000) {
        //console.warn("Cannot adjust morale by so much", delta);
        return;
    }
    if (population.current > 0) { //dividing by zero is bad for hive
        //calculates zombie proportion (zombies do not become happy or sad)
        let fraction = population.living / population.current;
        let max = 1 + (0.5 * fraction);
        let min = 1 - (0.5 * fraction);
        //alters morale
        curCiv.morale.efficiency += delta * fraction;
        //Then check limits (50 is median, limits are max 0 or 100, but moderated by fraction of zombies)
        if (curCiv.morale.efficiency > max) {
            curCiv.morale.efficiency = max;
        } else if (curCiv.morale.efficiency < min) {
            curCiv.morale.efficiency = min;
        }
        updateMorale(); //update to player
    }
}

// Try to heal the specified number of people in the specified job
// Makes them sick if the number is negative.
function healByJob(job, num) {
    if (!isValid(job) || !job) { return 0; }
    if (num === undefined) { num = 1; } // default to 1
    num = Math.min(num, civData[job].ill);
    num = Math.max(num, -civData[job].owned);
    civData[job].ill -= num;
    civData[job].owned += num;

    calculatePopulation();

    return num;
}

// include sick and healthy
function getTotalByJob(job) {
    if (!isValid(job) || !job) { return 0; }
    let num = civData[job].ill + civData[job].owned;
    return num;
}

//Selects random workers, transfers them to their Ill variants
function spreadPlague(sickNum) {
    let actualNum = 0;

    calculatePopulation();
    // Apply in 1-worker groups to spread it out.
    for (let i = 0; i < sickNum; i++) {
        actualNum += -healByJob(getRandomHealthyWorker(), -1);
    }

    return actualNum;
}

// Select a sick worker type to cure, with certain priorities
function getNextPatient() {
    for (let i = 0; i < PATIENT_LIST.length; ++i) {
        if (civData[PATIENT_LIST[i]].ill > 0) { return PATIENT_LIST[i]; }
    }
    return "";
}

function getRandomPatient(n) {
    let i = Math.floor(Math.random() * PATIENT_LIST.length);
    n = n || 1; // counter to stop infinite loop
    let stop = Math.max(PATIENT_LIST.length, population.totalSick);
    if (n > stop) {
        return false;
    }
    //|| n > 10
    if (civData[PATIENT_LIST[i]].ill > 0) {
        return PATIENT_LIST[i];
    }
    return getRandomPatient(++n);
}

function clearSpecialResourceNets() {
    civData.food.net = 0;
    civData.wood.net = 0;
    civData.stone.net = 0;

    civData.skins.net = 0;
    civData.herbs.net = 0;
    civData.ore.net = 0;

    civData.leather.net = 0;
    civData.potions.net = 0;
    civData.metal.net = 0;

    civData.piety.net = 0;
}

function checkResourceLimits() {
    //Resources occasionally go above their caps. eg after raids
    //Cull the excess /after/ other workers have taken their inputs.
    resourceData.forEach(function (resource) {
        if (resource.owned > resource.limit) {
            let excess = resource.owned - resource.limit;
            excess = Math.ceil(Math.random() * 0.25 * excess);
            resource.owned -= excess;
            resource.net -= excess;
        }
        if (resource.owned < 0) {
            resource.owned = 0;
        }
    });
    // because of desecration
    if (civData.graveyard.owned <= 0) {
        civData.graveyard.owned = 0;
        curCiv.grave.owned = 0;
    }
}

function calculatePopulation() {

    if (curCiv.zombie.owned < 0) {
        curCiv.zombie.owned = 0;
    }
    population = {
        current: 0,
        living: 0,
        zombie: curCiv.zombie.owned,
        limit: 0,
        limitIncludingUndead: 0,
        healthy: 0,
        totalSick: 0,
        extra: 0
    };

    //Update population limit by multiplying out housing numbers
    // 66g todo: limits should be hardcoded with civData
    population.limit = (
        civData.tent.owned
        + (civData.hut.owned * 3)
        + (civData.cottage.owned * 6)
        + (civData.house.owned * (10 + (civData.tenements.owned * 2) + (civData.slums.owned * 2)))
        + (civData.mansion.owned * 50)
        + (civData.palace.owned * 150)
    );
    population.limitIncludingUndead = population.limit + population.zombie;

    //Update sick workers
    unitData.forEach(function (unit) {
        if (unit.isPopulation) { // has to be a player, non-special, non-mechanical
            population.current += unit.owned;

            if (unit.vulnerable) {
                // TODO Should this use 'killable'? Yes
                population.healthy += unit.owned;
            }
            if (unit.ill) {
                population.totalSick += (unit.ill || 0);
                population.healthy -= (unit.ill || 0);
            } else {
                //population.healthy += 1; // TODO: Not sure if this is calculated right
            }
        } else {
            population.extra += unit.owned;
        }
    });

    // Calculate housed/fed population (excludes zombies)
    population.living = Math.max(0, population.current - population.zombie);

    // Calculate healthy workers (should exclude sick, zombies and deployed units)
    // TODO: Doesn't subtracting the zombies here throw off the calculations in randomHealthyWorker()?
    population.healthy = Math.max(0, population.healthy - population.zombie);

    //Zombie soldiers dying can drive population.current negative if they are 
    // killed and zombies are the only thing left.
    // TODO: This seems like a hack that should be given a real fix.
    if (population.current < 0) {
        if (curCiv.zombie.owned > 0) {
            //This fixes that by removing zombies and setting to zero.
            curCiv.zombie.owned += population.current;
            population.current = 0;
        } else {
            console.warn("Warning: Negative current population detected.");
            sysLog("Warning: Negative current population detected in calculatePopulation().");
        }
    }

    // somehow managed to get 0.5 corpse, let's just round down any bits of a body left over
    civData.corpses.owned = Math.floor(civData.corpses.owned);
}
// Picks the next worker to starve.  Kills the sick first, then the healthy.
// Deployed military starve last.
// Return the job ID of the selected target.
function pickStarveTarget() {
    let id = getRandomPatient();
    if (isValid(id) && id) { return civData[id];}

    id = getRandomWorker();
    if (isValid(id) && id) { return civData[id]; }

    // These don't have .ill variants at the moment.
    if (civData.cavalryParty.owned > 0) { return civData.cavalryParty; }
    if (civData.soldierParty.owned > 0) { return civData.soldierParty; }

    return null;
}

function getPietyLimitBonus() {
    let bonus1 = (civData.theism.owned ? 1 : 0) * 25;
    let bonus2 = (civData.polytheism.owned ? 1 : 0) * 50;
    let bonus3 = (civData.monotheism.owned ? 1 : 0) * 100;
    return bonus1 + bonus2 + bonus3;
}
function getPietyEarnedBonus() {
    let pietyEarned = 
            (civData.cleric.efficiency + (civData.cleric.efficiency * (civData.theism.owned + civData.polytheism.owned + civData.monotheism.owned + civData.writing.owned)))
            * (1 + ((civData.secrets.owned) * (1 - 100 / (civData.graveyard.owned + 100))))
            * curCiv.morale.efficiency
            * getWonderBonus(civData.piety);

    return pietyEarned;
}

// Creates or destroys workers
function spawn(num) {
    let newJobId = unitType.unemployed;
    let bums = civData.unemployed;
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
    let targetObj;
    let starveCount = 0;
    if (num === undefined) { num = 1; }
    num = Math.min(num, population.living);

    for (let i = 0; i < num; ++i) {
        starveCount += killUnit(pickStarveTarget());
    }
    return starveCount;
}

function doStarve() {
    let corpsesEaten, numberStarve;
    if (civData.food.owned <= 0 && civData.waste.owned) // Workers eat corpses if needed
    {
        corpsesEaten = Math.min(civData.corpses.owned, -civData.food.owned);
        civData.corpses.owned -= corpsesEaten;
        civData.food.owned += corpsesEaten;
    }

    if (civData.food.owned < 0) { // starve if there's not enough food.
        //Only 1.0% deaths no matter how big the shortage? a larger number will reduce the population quicker
        numberStarve = starve(Math.ceil(Math.random() * population.living / 100));
        if (numberStarve == 1) {
            gameLog("citizen starved to death");
        } else if (numberStarve > 1) {
            //gameLog(prettify(numberStarve) + " citizens starved to death");
            gameLog( "citizens starved to death");
        }
        civData.food.owned = 0;
    }
}

function doHomeless() {
    // 50% chance
    if (population.living > population.limit && Math.random() < 0.5) {
        // we have homeless, let some die of exposure
        let numHomeless = population.living - population.limit;
        // kill off up to 20% of homeless
        let numDie = starve(Math.ceil(Math.random() * numHomeless / 5));
        if (numDie > 0) {
            let who = numDie == 1 ? "homeless citizen" : "homeless citizens";
            let where = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
            let what = Math.random() < 0.99 ? " died of exposure" : " migrated " + where[Math.floor(Math.random() * where.length)];
            //gameLog(prettify(numDie) + who + what);
            gameLog(who + what);
        }
    }
}

function killUnit(unit) {
    if (!unit) { return 0; }
    //let killed = 0;
    if (unit.ill) { unit.ill -= 1; }
    else { unit.owned -= 1; }

    civData.corpses.owned += 1; //Increments corpse number
    //Workers dying may trigger Book of the Dead
    if (civData.book.owned) { civData.piety.owned += getPietyEarnedBonus(); }

    if (population.living > 1) {
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

//This function is called every time a player clicks on a primary resource button
function increment(objId) {
    let purchaseObj = civData[objId];
    let numArmy = 0;

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
    let specialChance = purchaseObj.specialChance;
    if (specialChance && purchaseObj.specialMaterial && civData[purchaseObj.specialMaterial]) {
        if ((purchaseObj === civData.food) && (civData.flensing.owned)) { specialChance += 0.1; }
        if ((purchaseObj === civData.stone) && (civData.macerating.owned)) { specialChance += 0.1; }
        if ((purchaseObj === civData.wood) && (civData.reaping.owned)) { specialChance += 0.1; }
        if (Math.random() < specialChance) {
            let specialMaterial = civData[purchaseObj.specialMaterial];
            let specialQty = purchaseObj.increment * (1 + (9 * (civData.guilds.owned)));
            specialMaterial.owned += specialQty;
            gameLog("Found " + specialMaterial.getQtyName(specialQty) + " while " + purchaseObj.activity); // I18N
        }
    }
    //Checks to see that resources are not exceeding their limits
    if (purchaseObj.owned > purchaseObj.limit) { purchaseObj.owned = purchaseObj.limit; }

    ui.find("#clicks").innerHTML = prettify(Math.round(++curCiv.resourceClicks));
    updateResourceTotals(); //Update the page with totals
}

function getStoreroomBonus() {
    return (civData.storerooms.owned ? 2 : 1) * 50;
}
function getStorehouseBonus() {
    return (civData.storehouses.owned ? 2 : 1) * 100;
}
function getWarehouseBonus() {
    return (civData.warehouses.owned ? 2 : 1) * 200;
}
