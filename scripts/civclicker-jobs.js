"use strict";


// TODO: Need to improve 'net' handling.
function doFarmers() {
    var millMod = 1;
    if (population.current > 0) {
        millMod = population.living / population.current;
    }
    civData.food.net = (
        civData.farmer.owned
        * (1 + (civData.farmer.efficiency * curCiv.morale.efficiency))
        * ((civData.pestControl.timer > 0) ? 1.01 : 1)
        * getWonderBonus(civData.food)
        * (1 + civData.walk.rate / 120)
        * (1 + civData.mill.owned * millMod / 200) //Farmers farm food
    );
    civData.food.net -= population.living; //The living population eats food.
    civData.food.owned += civData.food.net;

    if (civData.skinning.owned && civData.farmer.owned > 0) { //and sometimes get skins
        var specialChance = civData.food.specialChance + (0.1 * civData.flensing.owned);
        var skinsChance = specialChance * (civData.food.increment + ((civData.butchering.owned) * civData.farmer.owned / 15.0)) * getWonderBonus(civData.skins);
        var skinsEarned = rndRound(skinsChance);
        civData.skins.net += skinsEarned;
        civData.skins.owned += skinsEarned;
    }
}

function doWoodcutters() {
    var efficiency = civData.woodcutter.efficiency + (0.1 * civData.woodcutter.efficiency * civData.felling.owned);
    //civData.wood.net = civData.woodcutter.owned * (civData.woodcutter.efficiency * curCiv.morale.efficiency) * getWonderBonus(civData.wood); //Woodcutters cut wood
    civData.wood.net = civData.woodcutter.owned * (efficiency * curCiv.morale.efficiency) * getWonderBonus(civData.wood); //Woodcutters cut wood
    civData.wood.owned += civData.wood.net;

    if (civData.harvesting.owned && civData.woodcutter.owned > 0) { //and sometimes get herbs
        var specialChance = civData.wood.specialChance + (0.1 * civData.reaping.owned);
        var herbsChance = specialChance * (civData.wood.increment + ((civData.gardening.owned) * civData.woodcutter.owned / 5.0)) * getWonderBonus(civData.herbs);
        var herbsEarned = rndRound(herbsChance);
        civData.herbs.net += herbsEarned;
        civData.herbs.owned += herbsEarned;
    }
}

function doMiners() {
    var efficiency = civData.miner.efficiency + (0.1 * civData.miner.efficiency * civData.mining.owned);
    //civData.stone.net = civData.miner.owned * (civData.miner.efficiency * curCiv.morale.efficiency) * getWonderBonus(civData.stone); //Miners mine stone
    civData.stone.net = civData.miner.owned * (efficiency * curCiv.morale.efficiency) * getWonderBonus(civData.stone); //Miners mine stone
    civData.stone.owned += civData.stone.net;

    if (civData.prospecting.owned && civData.miner.owned > 0) { //and sometimes get ore
        var specialChance = civData.stone.specialChance + (civData.macerating.owned ? 0.1 : 0);
        var oreChance = specialChance * (civData.stone.increment + ((civData.extraction.owned) * civData.miner.owned / 5.0)) * getWonderBonus(civData.ore);
        var oreEarned = rndRound(oreChance);
        civData.ore.net += oreEarned;
        civData.ore.owned += oreEarned;
    }
}

function doBlacksmiths() {
    // we don't want to use up ore if we aren't making metal
    if (civData.metal.owned < civData.metal.limit) {
        var efficiency = civData.blacksmith.efficiency + (0.1 * civData.blacksmith.efficiency * civData.mathematics.owned);
        var oreUsed = Math.min(civData.ore.owned, (civData.blacksmith.owned * efficiency * curCiv.morale.efficiency));
        oreUsed = Math.min(oreUsed, civData.metal.limit - civData.metal.owned); // can't make more than we can store
        var metalEarned = oreUsed * getWonderBonus(civData.metal);
        civData.ore.net -= oreUsed;
        civData.ore.owned -= oreUsed;

        civData.metal.net += metalEarned;
        civData.metal.owned += metalEarned;
    }
}

function doTanners() {
     // we don't want to use up skins if we aren't making leather
    if (civData.leather.owned < civData.leather.limit) {
        var efficiency = civData.tanner.efficiency + (0.1 * civData.tanner.efficiency * civData.astronomy.owned);
        var skinsUsed = Math.min(civData.skins.owned, (civData.tanner.owned * efficiency * curCiv.morale.efficiency));
        skinsUsed = Math.min(skinsUsed, civData.leather.limit - civData.leather.owned); // can't make more than we can store
        var leatherEarned = skinsUsed * getWonderBonus(civData.leather);
        civData.skins.net -= skinsUsed;
        civData.skins.owned -= skinsUsed;

        civData.leather.net += leatherEarned;
        civData.leather.owned += leatherEarned;
    }
}
function doApothecaries() {
    // we don't want to use up herbs if we aren't making potions
    if (civData.potions.owned < civData.potions.limit) {
        var efficiency = civData.healer.efficiency + (0.1 * civData.healer.efficiency * civData.medicine.owned);
        var herbsUsed = Math.min(civData.herbs.owned, (civData.healer.owned * efficiency * curCiv.morale.efficiency));
        herbsUsed = Math.min(herbsUsed, civData.potions.limit - civData.potions.owned); // can't make more than we can store
        var potionsEarned = herbsUsed * getWonderBonus(civData.potions);
        civData.herbs.net -= herbsUsed;
        civData.herbs.owned -= herbsUsed;

        civData.potions.net += potionsEarned;
        civData.potions.owned += potionsEarned;
    }
}
function doClerics() {
    var pietyEarned = (
        civData.cleric.owned
        * (civData.cleric.efficiency + (civData.cleric.efficiency * (civData.theism.owned + civData.polytheism.owned + civData.monotheism.owned + civData.writing.owned)))
        * (1 + ((civData.secrets.owned)
            * (1 - 100 / (civData.graveyard.owned + 100))))
        * curCiv.morale.efficiency
        * getWonderBonus(civData.piety)
    );
    // lose piety for having temples but no clerics
    if (civData.cleric.owned == 0 && civData.temple.owned > 0 && civData.piety.owned > 0) { pietyEarned = -civData.cleric.efficiency; }

    civData.piety.net += pietyEarned;
    civData.piety.owned += pietyEarned;
}

function doHealers() {
    if (civData.potions.owned <= 0 || population.totalSick <= 0) { return 0;} // we can't heal without potions
    var job, numHealed = 0;
    var numHealers = civData.healer.owned + (civData.cat.owned * (civData.companion.owned));
    // How much healing can we do?
    civData.healer.cureCount += (numHealers * civData.healer.efficiency * curCiv.morale.efficiency);

    var cureCount = (numHealers * civData.healer.efficiency * curCiv.morale.efficiency);
    // We can't cure more sick people than there are
    civData.healer.cureCount = Math.min(civData.healer.cureCount, population.totalSick);
    // We can't cure more sick people than there are potions
    civData.healer.cureCount = Math.min(civData.healer.cureCount, civData.potions.owned);

    // Cure people until we run out of healing capacity or potions
    while (civData.healer.cureCount >= 1 && civData.potions.owned >= 1) {
        job = getNextPatient();
        if (!job) {break;}
        healByJob(job);
        --civData.healer.cureCount;
        --civData.potions.owned;
        --civData.potions.net;
        ++numHealed;
    }
    return numHealed;
}
//function doHealers() {
//    if (civData.herbs.owned <= 0) { return 0;} // we can't heal without herbs
//    var job, numHealed = 0;
//    var numHealers = civData.healer.owned + (civData.cat.owned * (civData.companion.owned));
//    // How much healing can we do?
//    // this doesn't need to be a global variable
//    var cureCount = (numHealers * civData.healer.efficiency * curCiv.morale.efficiency);

//    // We can't cure more sick people than there are
//    civData.healer.cureCount = Math.min(cureCount, population.totalSick);

//    // Cure people until we run out of healing capacity or herbs
//    while (cureCount >= 1 && civData.herbs.owned >= 1) {
//        job = getNextPatient();
//        if (!job) {break;}
//        healByJob(job);
//        --cureCount;
//        --civData.herbs.owned;
//        --civData.herbs.net;
//        ++numHealed;
//    }
//    return numHealed;
//}
function doPlague() {
    if (population.totalSick <= 0) {
        return false;
    }
    //var jobInfected = getRandomPatient();
    //var unitInfected = civData[jobInfected];
    //if (unitInfected.ill <= 0 || unitInfected.owned <= 0) {
    //    return false;
    //}

    var deathRoll = (100 * Math.random());

    if (deathRoll <= 1) { // 1% chance that up to 1% ill people dies
        var victims = Math.floor(population.totalSick / 100 * Math.random());

        if (victims <= 0) { return false; }
        var died = 0;
        var lastVictim = "citizen";
        for (var d = 1; d <= victims; d++) {
            var jobInfected = getRandomPatient();
            //if (!isValid(jobInfected) || !jobInfected) { continue; }
            if (isValid(jobInfected)) {
                var unitInfected = civData[jobInfected];

                if (unitInfected.ill > 0 && unitInfected.owned > 0) {
                    killUnit(unitInfected);
                    lastVictim = unitInfected.singular;
                    died++;
                }
            }
        }

        if (died == 1) {
            gameLog("A sick " + lastVictim + " died of the plague.");
        }
        else if (died > 1) {
            gameLog(prettify(died) + " sick citizens died of the plague.");
        }
        calculatePopulation();
        return true;
    }
    else if (deathRoll <= 2) {
        // some sick victims recover naturally
        var survivors = Math.floor(population.totalSick / 100 * Math.random());
        if (survivors <= 0) { return false; }
        var survived = 0;
        var lastJob = "citizen";
        for (var s = 1; s <= survivors; s++) {
            var job = getRandomPatient();

            if (isValid(job)) {
                healByJob(job);
                lastJob = civData[job].singular;
                survived++;
            }
        }
        if (survived == 1) {
            gameLog("A sick " + lastJob + " recovered from the plague.");
        }
        else if (survived > 1) {
            gameLog(prettify(survived) + " sick citizens recovered from the plague.");
        }
        calculatePopulation();
        return true;
    } else if (deathRoll > 99) { // 1% chance that it spreads 
        // Infect up to 0.1% of the healthy population.
        var infected = Math.floor(population.healthy / 100 * Math.random()) + 1;

        var num = spreadPlague(infected);
        if (num == 1) {
            gameLog("The plague spreads to a new citizen.");
        }
        else {
            gameLog("The plague spreads to " + prettify(num) + " new citizens.");
        }
        return true;
    }
    return false;
}

function doGraveyards() {
    var i;

    if (civData.corpses.owned > 0 && curCiv.grave.owned > 0) {
        //Clerics will bury corpses if there are graves to fill and corpses lying around
        for (i = 0; i < civData.cleric.owned; i++) {
            if (civData.corpses.owned > 0 && curCiv.grave.owned > 0) {
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

function doCorpses() {
    var sickChance;
    var infected;
    // Nothing happens if there are no corpses
    if (civData.corpses.owned <= 0) { return; }

    // if we have enough clerics to bury the dead, then do nothing
    // why 7?  Because after about 7 days corpses start decaying
    if (civData.corpses.owned <= civData.cleric.owned * 7 && curCiv.grave.owned > 0 ) { return; }

    // Corpses lying around will occasionally make people sick.
    // 1-in-50 chance (1-in-100 with feast)
    //sickChance = 50 * Math.random() * (1 + civData.feast.owned);
    //if (sickChance >= 1) { return; }

    // more corpses should mean more chance of disease
    sickChance = civData.corpses.owned / (1 + civData.feast.owned) * Math.random();
    // increase percentage to reduce frequency
    var test = population.healthy * 0.33 * Math.random();

    // if corpses owned is greater than upto %age of population, then chance of sickness spreading
    if (sickChance < test) { return; }

    // Infect up to 1% of the healthy population.
    // if there are sick already, then see doPlague()
    if (population.healthy > 0 && population.totalSick == 0) {
        infected = Math.floor(population.healthy / 100 * Math.random());
        if (infected <= 0) { return; }

        infected = spreadPlague(infected);
        if (infected > 0) {
            calculatePopulation();
            //notify player
            if (infected == 1) {
                gameLog("A citizen caught the plague");
            } else {
                gameLog(prettify(infected) + " citizens caught the plague");
            }
        }
    }

    // Corpses have a slight chance of decaying (at least there is a bright side)
    if (Math.random() < 1 / 100) {
        //civData.corpses.owned -= 1;
        var gone = 1 + Math.floor((Math.random() * civData.corpses.owned / 100));
        civData.corpses.owned -= gone;
        var corpse = " corpse" + ((gone > 1) ? "s" : "");
        var action = " rotted away";
        if (Math.random() < 0.33) {
            action = " eaten by vermin";
        } else if (Math.random() < 0.66) {
            action = " devoured by scavengers";
        }

        gameLog(prettify(gone) + corpse + action);
    }
    if (civData.corpses.owned < 0) { civData.corpses.owned = 0; }
}

// sometime, for example, we have more tanners than we have tannerys
// usually because of buildings being sacked i.e. destroyed
// this is called in the main game loop
// 66g TODO: this could be improved.  maybe add id of worker to building type
function dismissWorkers() {
    // we only lose a worker if an occupied building is destroyed
    var diff = 0;
    var total = 0;

    total = totalByJob(unitType.tanner);
    if (total > 0 && total > civData.tannery.owned) {
        diff = total - civData.tannery.owned;
        civData.tanner.owned -= diff;
        civData.unemployed.owned += diff;
    }

    total = totalByJob(unitType.blacksmith);
    if (total > 0 && total > civData.smithy.owned) {
        diff = total - civData.smithy.owned;
        civData.blacksmith.owned -= diff;
        civData.unemployed.owned += diff;
    }

    total = totalByJob(unitType.healer);
    if (total > 0 && total > civData.apothecary.owned) {
        diff = total - civData.apothecary.owned;
        civData.healer.owned -= diff;
        civData.unemployed.owned += diff;
    }

    total = totalByJob(unitType.cleric);
    if (total > 0 && total > civData.temple.owned) {
        diff = total - civData.temple.owned;
        civData.cleric.owned -= diff;
        civData.unemployed.owned += diff;
    }

    // these buildings have 10 units
    total = totalByJob(unitType.soldier);
    if (total > 0 && total > civData.barracks.owned * 10) {
        diff = total - (civData.barracks.owned * 10);
        civData.soldier.owned -= diff;
        civData.unemployed.owned += diff;
    }

    total = totalByJob(unitType.cavalry);
    if (total > 0 && total > civData.stable.owned * 10) {
        diff = total - (civData.stable.owned * 10);
        civData.cavalry.owned -= diff;
        civData.unemployed.owned += diff;
    }
}

function farmerMods(efficiency_base) {
    //+ civData.domestication.owned
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

