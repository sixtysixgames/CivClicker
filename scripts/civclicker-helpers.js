"use strict";

function getCivType() {
    var civType = civSizes.getCivSize(population.living).name;
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

    var i, num;
    var text = "";
    for (i in costObj) {
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
    var i;
    for (i in prereqObj) {
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
    var i;
    for (i in costObj) {
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

    var i, num;
    for (i in costObj) {
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
        qty = Math.min(qty, purchaseObj.limit - purchaseObj.total);
    }

    // See if we can afford them; return fewer if we can't afford them all
    return Math.min(qty, canAfford(purchaseObj.require));
}

function getLandTotals() {
    //Update land values
    var ret = { lands: 0, buildings: 0, free: 0, sackableTotal: 0 };
    buildingData.forEach(function (elem) {
        if (elem.subType == subTypes.land) { ret.free += elem.owned; }
        else { ret.buildings += elem.owned; }

        if (elem.vulnerable == true) { ret.sackableTotal += elem.owned; }
    });
    ret.lands = ret.free + ret.buildings;
    return ret;
}

function testAchievements() {
    achData.forEach(function (achObj) {
        // if (!isValid(civData[achObj.id])) { return false}
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
    var num = Math.random() * population.healthy;
    var chance = 0;
    var i;
    for (i = 0; i < killable.length; ++i) {
        chance += civData[killable[i].id].owned;
        if (chance > num) { return killable[i].id; }
    }
    return "";
}
function getRandomWorker() {
    var num = Math.random() * population.living;
    var chance = 0;
    var i;
    for (i = 0; i < killable.length; ++i) {
        chance += civData[killable[i].id].owned;
        if (chance > num) { return killable[i].id; }
    }
    return "";
}
//Selects a random sackable building based on its proportions in the current distribution.
function getRandomBuilding() {
    var landTotals = getLandTotals();
    var num = Math.random() * landTotals.sackableTotal;
    var chance = 0;
    var i;
    for (i = 0; i < sackable.length; ++i) {
        chance += civData[sackable[i].id].owned;
        if (chance > num) { return sackable[i].id; }
    }
    return "";
}
//Selects a random lootable resource based on its proportions in the current distribution.
function getRandomLootableResource() {
    var i;
    var total = 0;
    for (i = 0; i < lootable.length; ++i) {
        //total += civData[lootable[i].id].owned;
        total += lootable[i].owned;
    }
    var num = Math.random() * total;
    var chance = 0;

    for (i = 0; i < lootable.length; ++i) {
        //chance += civData[lootable[i].id].owned;
        chance += lootable[i].owned;
        if (chance > num) { return lootable[i].id; }
    }
    return "";
}
function getRandomTradeableResource() {
    var i;
    var total = 0;
    var tradeable = [];
    for (i = 0; i < lootable.length; ++i) {
        if (lootable[i].owned > 0) {
            tradeable.push(lootable[i]);
        }
    }
    if (tradeable.length == 0) { return ""; }

    var selected = tradeable[Math.floor(Math.random() * tradeable.length)];
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
        var fraction = population.living / population.current;
        var max = 1 + (0.5 * fraction);
        var min = 1 - (0.5 * fraction);
        //alters morale
        curCiv.morale.efficiency += delta * fraction;
        //Then check limits (50 is median, limits are max 0 or 100, but moderated by fraction of zombies)
        if (curCiv.morale.efficiency > max) {
            curCiv.morale.efficiency = max;
        } else if (curCiv.morale.efficiency < min) {
            curCiv.morale.efficiency = min;
        }
        updateMorale(); //update to player

        //debug("adjustMorale.delta: " + delta + ". curCiv.morale.efficiency: " + curCiv.morale.efficiency + ". fraction: " + fraction);
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
function totalByJob(job) {
    if (!isValid(job) || !job) { return 0; }

    var num = civData[job].ill + civData[job].owned;
    return num;
}

//Selects random workers, transfers them to their Ill variants
function spreadPlague(sickNum) {
    var actualNum = 0;
    var i;

    calculatePopulation();
    // Apply in 1-worker groups to spread it out.
    for (i = 0; i < sickNum; i++) {
        actualNum += -healByJob(getRandomHealthyWorker(), -1);
    }

    return actualNum;
}

// Select a sick worker type to cure, with certain priorities
function getNextPatient() {
    var i;
    for (i = 0; i < PATIENT_LIST.length; ++i) {
        if (civData[PATIENT_LIST[i]].ill > 0) { return PATIENT_LIST[i]; }
    }
    return "";
}

function getRandomPatient(n) {
    var i = Math.floor(Math.random() * PATIENT_LIST.length);
    n = n || 1; // counter to stop infinite loop
    var stop = Math.max(PATIENT_LIST.length, population.totalSick);
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
    civData.piety.net = 0;
    civData.metal.net = 0;
}

function checkResourceLimits() {
    //Resources occasionally go above their caps.
    //Cull the excess /after/ other workers have taken their inputs.
    resourceData.forEach(function (resource) {
        if (resource.owned > resource.limit) {
            resource.owned = resource.limit;
        }
    });
}

function calculatePopulation() {
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
    var modNum, jobNum;
    var modList = ["ill", "owned"]; // The sick starve first
    //xxx Remove this hard-coded list.  Priority of least to most importance
    // todo: should probably be random job
    var jobList = [unitType.unemployed, unitType.labourer, unitType.cleric, unitType.healer, unitType.blacksmith, unitType.tanner, unitType.miner,
        unitType.woodcutter, unitType.cavalry, unitType.soldier, unitType.farmer];

    for (modNum = 0; modNum < modList.length; ++modNum) {
        for (jobNum = 0; jobNum < jobList.length; ++jobNum) {
            if (civData[jobList[jobNum]][modList[modNum]] > 0) { return civData[jobList[jobNum]]; }
        }
    }
    // These don't have Ill variants at the moment.
    if (civData.cavalryParty.owned > 0) { return civData.cavalryParty; }
    if (civData.soldierParty.owned > 0) { return civData.soldierParty; }

    return null;
}
