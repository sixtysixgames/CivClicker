"use strict";
/* global civData, curCiv, population, buildingType, unitType,
 calculatePopulation, getNextPatient, getPietyEarnedBonus, getRandomPatient, getTotalByJob, getWonderBonus, healByJob, spreadPlague,
 updatePopulation,
 gameLog, isValid, killUnit, rndRound*/
// TODO: Need to improve 'net' handling.
function doFarmers() {
    //Farmers farm food
    let millMod = 1;
    if (population.current > 0) {
        millMod = population.living / population.current;
    }
    civData.food.net = (
        civData.farmer.owned
        * (1 + (civData.farmer.efficiency * curCiv.morale.efficiency))
        * ((civData.pestControl.timer > 0) ? 1.01 : 1)
        * getWonderBonus(civData.food)
        * (1 + civData.walk.rate / 120)
        * (1 + civData.mill.owned * millMod / 200) 
    );
    civData.food.net -= population.living; //The living population eats food.
    let foodEarned = Math.min(civData.food.net, civData.food.limit - civData.food.owned); // can't make more than we can store
    //civData.food.owned += civData.food.net;
    civData.food.net = foodEarned;
    civData.food.owned += foodEarned;

    if (civData.skinning.owned && civData.farmer.owned > 0 && civData.skins.owned < civData.skins.limit) { //and sometimes get skins
        let specialChance = civData.food.specialChance + (0.1 * civData.flensing.owned);
        let skinsChance = specialChance * (civData.food.increment + ((civData.butchering.owned) * civData.farmer.owned / 15.0)) * getWonderBonus(civData.skins);
        let skinsEarned = rndRound(skinsChance);
        skinsEarned = Math.min(skinsEarned, civData.skins.limit - civData.skins.owned); // can't make more than we can store
        civData.skins.net += skinsEarned;
        civData.skins.owned += skinsEarned;
    }
}

function doWoodcutters() {
    //Woodcutters cut wood
    if (civData.wood.owned < civData.wood.limit) {
        let efficiency = civData.woodcutter.efficiency + (0.1 * civData.woodcutter.efficiency * civData.felling.owned); 
        civData.wood.net = civData.woodcutter.owned * (efficiency * curCiv.morale.efficiency) * getWonderBonus(civData.wood); 
        let woodEarned = Math.min(civData.wood.net, civData.wood.limit - civData.wood.owned); // can't make more than we can store
        civData.wood.net = woodEarned;
        civData.wood.owned += woodEarned;
    }
    if (civData.harvesting.owned && civData.woodcutter.owned > 0 && civData.herbs.owned < civData.herbs.limit) { //and sometimes get herbs
        let specialChance = civData.wood.specialChance + (0.1 * civData.reaping.owned);
        let herbsChance = specialChance * (civData.wood.increment + ((civData.gardening.owned) * civData.woodcutter.owned / 5.0)) * getWonderBonus(civData.herbs);
        let herbsEarned = rndRound(herbsChance);
        herbsEarned = Math.min(herbsEarned, civData.herbs.limit - civData.herbs.owned); // can't make more than we can store
        civData.herbs.net += herbsEarned;
        civData.herbs.owned += herbsEarned;
    }
}

function doMiners() {
    //Miners mine stone
    if (civData.stone.owned < civData.stone.limit) {
        let efficiency = civData.miner.efficiency + (0.1 * civData.miner.efficiency * civData.mining.owned);
        civData.stone.net = civData.miner.owned * (efficiency * curCiv.morale.efficiency) * getWonderBonus(civData.stone); 
        let stoneEarned = Math.min(civData.stone.net, civData.stone.limit - civData.stone.owned); // can't make more than we can store
        civData.stone.net = stoneEarned;
        civData.stone.owned += stoneEarned;
    }
    if (civData.prospecting.owned && civData.miner.owned > 0 && civData.ore.owned < civData.ore.limit) { //and sometimes get ore
        let specialChance = civData.stone.specialChance + (civData.macerating.owned ? 0.1 : 0);
        let oreChance = specialChance * (civData.stone.increment + ((civData.extraction.owned) * civData.miner.owned / 5.0)) * getWonderBonus(civData.ore);
        let oreEarned = rndRound(oreChance);
        oreEarned = Math.min(oreEarned, civData.ore.limit - civData.ore.owned); // can't make more than we can store
        civData.ore.net += oreEarned;
        civData.ore.owned += oreEarned;
    }
}

function doBlacksmiths() {
    if (civData.blacksmith.owned <= 0) { return; }
    // we don't want to use up ore if we aren't making metal
    if (civData.metal.owned < civData.metal.limit) {
        let efficiency = civData.blacksmith.efficiency + (0.1 * civData.blacksmith.efficiency * civData.mathematics.owned);
        let oreUsed = Math.min(civData.ore.owned, (civData.blacksmith.owned * efficiency * curCiv.morale.efficiency));

        oreUsed = Math.min(oreUsed, civData.metal.limit - civData.metal.owned); // can't make more than we can store
        civData.ore.net -= oreUsed;
        civData.ore.owned -= oreUsed;

        let metalEarned = oreUsed * getWonderBonus(civData.metal);
        metalEarned = Math.min(metalEarned, civData.metal.limit - civData.metal.owned); // can't make more than we can store
        civData.metal.net += metalEarned;
        civData.metal.owned += metalEarned;
    }
}

function doTanners() {
    if (civData.tanner.owned <= 0) { return; }
    // we don't want to use up skins if we aren't making leather
    if (civData.leather.owned < civData.leather.limit) {
        let efficiency = civData.tanner.efficiency + (0.1 * civData.tanner.efficiency * civData.astronomy.owned);
        let skinsUsed = Math.min(civData.skins.owned, (civData.tanner.owned * efficiency * curCiv.morale.efficiency));

        skinsUsed = Math.min(skinsUsed, civData.leather.limit - civData.leather.owned); // can't make more than we can store
        civData.skins.net -= skinsUsed;
        civData.skins.owned -= skinsUsed;

        let leatherEarned = skinsUsed * getWonderBonus(civData.leather);
        leatherEarned = Math.min(leatherEarned, civData.leather.limit - civData.leather.owned); // can't make more than we can store
        civData.leather.net += leatherEarned;
        civData.leather.owned += leatherEarned;
    }
}
function doApothecaries() {
    if (civData.healer.owned <= 0) { return; }
    // we don't want to use up herbs if we aren't making potions
    if (civData.potions.owned < civData.potions.limit) {
        let efficiency = civData.healer.efficiency + (0.1 * civData.healer.efficiency * civData.medicine.owned);
        let herbsUsed = Math.min(civData.herbs.owned, (civData.healer.owned * efficiency * curCiv.morale.efficiency));

        herbsUsed = Math.min(herbsUsed, civData.potions.limit - civData.potions.owned); // can't make more than we can store
        civData.herbs.net -= herbsUsed;
        civData.herbs.owned -= herbsUsed;

        let potionsEarned = herbsUsed * getWonderBonus(civData.potions);
        potionsEarned = Math.min(potionsEarned, civData.potions.limit - civData.potions.owned); // can't make more than we can store
        civData.potions.net += potionsEarned;
        civData.potions.owned += potionsEarned;
    }
}
function doClerics() {
    let bonus = getPietyEarnedBonus();
    let pietyEarned = civData.cleric.owned * bonus;
    pietyEarned = Math.min(pietyEarned, civData.piety.limit - civData.piety.owned); // can't make more than we can store

    // lose piety for having temples but no clerics or population
    if (civData.cleric.owned === 0 && civData.temple.owned > 0 && civData.piety.owned > 0) { pietyEarned = -bonus; }

    civData.piety.net += pietyEarned;
    civData.piety.owned += pietyEarned;
}

function doHealers() {
    if (civData.healer.owned <= 0 || civData.potions.owned <= 0 || population.totalSick <= 0) { return 0; } // we can't heal without potions

    let job, numHealed = 0;
    let numHealers = civData.healer.owned + (civData.cat.owned * (civData.companion.owned));
    // How much healing can we do?
    civData.healer.cureCount += (numHealers * civData.healer.efficiency * curCiv.morale.efficiency);

    let cureCount = (numHealers * civData.healer.efficiency * curCiv.morale.efficiency);
    // We can't cure more sick people than there are
    civData.healer.cureCount = Math.min(civData.healer.cureCount, population.totalSick);
    // We can't cure more sick people than there are potions
    civData.healer.cureCount = Math.min(civData.healer.cureCount, civData.potions.owned);

    // Cure people until we run out of healing capacity or potions
    while (civData.healer.cureCount >= 1 && civData.potions.owned >= 1) {
        job = getNextPatient();
        if (!job) { break; }
        healByJob(job);
        --civData.healer.cureCount;
        --civData.potions.owned;
        --civData.potions.net;
        ++numHealed;
    }
    return numHealed;
}
//https://www.bbc.co.uk/bitesize/guides/z7r7hyc/revision/3
/*
 * An estimated 30% to 60% of the population of Europe died from the plague. This is often referred to as the 'mortality rate'.
 * victims of bubonic plague itself had a 50% chance of death.
 * */
function doPlague() {
    if (population.totalSick <= 0) { return false; }

    //let deathRoll = (100 * Math.random());
    // there are 4 possibilities: die, survive, spread, nothing 
    let chance = 0.015;

    if (Math.random() < chance) {
        let victims = Math.ceil(population.totalSick / 2 * Math.random());

        if (victims <= 0) { return false; }
        let died = 0;
        let lastVictim = "citizen";
        for (let d = 1; d <= victims; d++) {
            let jobInfected = getRandomPatient();

            if (isValid(jobInfected)) {
                let unitInfected = civData[jobInfected];
                if (isValid(unitInfected) && unitInfected.ill > 0 && unitInfected.owned > 0) {
                    killUnit(unitInfected);
                    lastVictim = unitInfected.singular;
                    died++;
                }
            }
        }

        if (died == 1) {
            gameLog("A sick " + lastVictim + " died of the plague");
        }
        else if (died > 1) {
            //gameLog(prettify(died) + " plague victims died");
            gameLog("plague victims died");
        }
        calculatePopulation();
        return true;
    }
    else if (Math.random() < chance) {
        // some sick victims recover naturally
        let survivors = Math.ceil(population.totalSick / 2 * Math.random());
        if (survivors <= 0) { return false; }
        let survived = 0;
        let lastJob = "citizen";
        for (let s = 1; s <= survivors; s++) {
            let job = getRandomPatient();

            if (isValid(job) && isValid(civData[job])) {
                healByJob(job);
                lastJob = civData[job].singular;
                survived++;
            }
        }
        if (survived == 1) {
            gameLog("sick " + lastJob + " recovered");
        }
        else if (survived > 1) {
            //gameLog(prettify(survived) + " sick citizens recovered");
            gameLog( "sick citizens recovered");
        }
        calculatePopulation();
        return true;
    } else if (Math.random() < chance && canSpreadPlague()) {
        // plague spreads
        // needs to be same odds as catching plague in doCorpses civData.corpses.owned
        let infected = Math.floor(population.healthy / 100 * Math.random());
        if (infected <= 0) { return false; }
        let num = spreadPlague(infected);
        if (num == 1) {
            gameLog("The plague spreads to a new citizen");
        }
        else {
            //gameLog("The plague infects " + prettify(num) + " new citizens");
            gameLog("The plague infects new citizens");
        }
        return true;
    }
    return false;
}

function doGraveyards() {
    if (civData.corpses.owned > 0 && curCiv.grave.owned > 0 && civData.piety.owned > 0) {
        //Clerics will bury corpses if there are graves to fill and corpses lying around
        for (let i = 0; i < civData.cleric.owned; i++) {
            if (civData.corpses.owned > 0 && curCiv.grave.owned > 0 && civData.piety.owned > 0) {
                civData.corpses.owned -= 1;
                curCiv.grave.owned -= 1;
            }
            else {
                // if criteria not met, no point continuing
                break;
            }
        }
        updatePopulation();
    }
}

//https://www.bbc.co.uk/bitesize/guides/z7r7hyc/revision/3
/*
 * An estimated 30% to 60% of the population of Europe died from the plague. This is often referred to as the 'mortality rate'.
 * victims of bubonic plague itself had a 50% chance of death.
 * other research show 50% chance of dying/surviving/catching plague
 * */
function doCorpses() {
    // Nothing happens if there are no corpses
    if (civData.corpses.owned <= 0) { return; }

    // if we have enough clerics to bury the dead, then do nothing
    // why 7?  Because after about 7 days corpses start decaying
    if (civData.corpses.owned <= civData.cleric.owned * 7 && curCiv.grave.owned > 0) { return; }

    // Corpses lying around will occasionally make people sick.
    // Infect up to 1% of the healthy population.
    // if there are sick already, then see doPlague()
    if (canSpreadPlague() && population.healthy > 0 && population.totalSick == 0) {
        let infected = Math.floor(population.healthy / 100 * Math.random());
        if (infected <= 0) { return; }

        infected = spreadPlague(infected);
        if (infected > 0) {
            calculatePopulation();
            //notify player
            if (infected == 1) {
                gameLog("citizen caught the plague");
            } else {
                //gameLog(prettify(infected) + " citizens caught the plague");
                gameLog( "citizens caught the plague");
            }
        }
    }

    // Corpses have a slight chance of decaying (at least there is a bright side)
    if (Math.random() < 1 / 100) {
        //civData.corpses.owned -= 1;
        let gone = 1 + Math.floor((Math.random() * civData.corpses.owned / 100));
        civData.corpses.owned -= gone;
        //let what = " corpse" + ((gone > 1) ? "s" : "");
        let what = ((gone > 1) ? "corpses" : "corpse");
        let action = " rotted away";
        if (Math.random() < 0.33) {
            action = " eaten by vermin";
        } else if (Math.random() < 0.66) {
            action = " devoured by scavengers";
        }

        //gameLog(prettify(gone) + what + action);
        gameLog( what + action);
    }
    if (civData.corpses.owned < 0) { civData.corpses.owned = 0; }
}

function canSpreadPlague() {
    // more corpses should mean more chance of disease
    let sickChance = civData.corpses.owned / (1 + civData.feast.owned) * Math.random();
    // increase percentage to reduce frequency
    let test = population.healthy * (1 + civData.feast.owned) * Math.random();

    return sickChance > test;
}
// sometime, for example, we have more tanners than we have tannerys
// usually because of buildings being sacked i.e. destroyed
// this is called in the main game loop
// 66g TODO: this could be improved.  maybe add id of worker to building type
function dismissWorkers() {
    // we only lose a worker if an occupied building is destroyed
    //let diff = 0;
    //let total = 0;

    dismissWorker(unitType.tanner, buildingType.tannery, 1);
    //total = getTotalByJob(unitType.tanner);
    //if (total > 0 && total > civData.tannery.owned) {
    //    diff = total - civData.tannery.owned;
    //    civData.tanner.owned -= diff;
    //    civData.unemployed.owned += diff;
    //}

    dismissWorker(unitType.blacksmith, buildingType.smithy, 1);
    //total = getTotalByJob(unitType.blacksmith);
    //if (total > 0 && total > civData.smithy.owned) {
    //    diff = total - civData.smithy.owned;
    //    civData.blacksmith.owned -= diff;
    //    civData.unemployed.owned += diff;
    //}

    dismissWorker(unitType.healer, buildingType.apothecary, 1);
    //total = getTotalByJob(unitType.healer);
    //if (total > 0 && total > civData.apothecary.owned) {
    //    diff = total - civData.apothecary.owned;
    //    civData.healer.owned -= diff;
    //    civData.unemployed.owned += diff;
    //}

    dismissWorker(unitType.cleric, buildingType.temple, 1);
    //total = getTotalByJob(unitType.cleric);
    //if (total > 0 && total > civData.temple.owned) {
    //    diff = total - civData.temple.owned;
    //    civData.cleric.owned -= diff;
    //    civData.unemployed.owned += diff;
    //}

    // these buildings have 10 units
    dismissWorker(unitType.soldier, buildingType.barracks, 10);
    //total = getTotalByJob(unitType.soldier);
    //if (total > 0 && total > civData.barracks.owned * 10) {
    //    diff = total - (civData.barracks.owned * 10);
    //    civData.soldier.owned -= diff;
    //    civData.unemployed.owned += diff;
    //}

    // cavalry 
    dismissWorker(unitType.cavalry, buildingType.stable, 10);
    //total = getTotalByJob(unitType.cavalry);
    //if (total > 0 && total > civData.stable.owned * 10) {
    //    diff = total - (civData.stable.owned * 10);
    //    civData.cavalry.owned -= diff;
    //    civData.unemployed.owned += diff;
    //}
}
function dismissWorker(unitTypeId, buildingTypeId, limit) {
    let diff = 0;
    let total = 0;

    total = getTotalByJob(unitTypeId);
    if (total > 0 && total > civData[buildingTypeId].owned * limit) {
        diff = total - (civData[buildingTypeId].owned * limit);
        civData[unitTypeId].owned -= diff;
        civData.unemployed.owned += diff;
    }
}

function farmerMods(efficiency_base) {
    return efficiency_base + (0.1 * (
        + civData.farming.owned + civData.agriculture.owned
        + civData.ploughshares.owned + civData.irrigation.owned
        + civData.croprotation.owned + civData.selectivebreeding.owned + civData.fertilisers.owned
        + civData.blessing.owned));
}

function woodcutterMods(efficiency_base) {
    return efficiency_base + (0.1 * (civData.astronomy.owned));
}

function minerMods(efficiency_base) {
    return efficiency_base + (0.1 * (civData.mathematics.owned));
}
