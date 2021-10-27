"use strict";

// there might be a better way to check this
// loop over all enemy types
function isUnderAttack() {
    return (curCiv.wolf.owned > 0) ||
        (curCiv.bandit.owned > 0) ||
        (curCiv.barbarian.owned > 0) ||
        (curCiv.invader.owned > 0);
}

// Reset the raid data.
function resetRaiding() {
    curCiv.raid.raiding = false;
    curCiv.raid.victory = false;
    curCiv.raid.epop = 0;
    curCiv.raid.plunderLoot = {};
    curCiv.raid.last = "";

    // Also reset the enemy party units.
    unitData.filter(function (elem) { return ((elem.alignment == alignmentType.enemy) && (elem.place == placeType.party)); })
        .forEach(function (elem) { elem.reset(); });
}

function playerCombatMods() {
    return (0.01 * ((civData.riddle.owned) + (civData.weaponry.owned) + (civData.shields.owned)));
}

/* Enemies */
function spawnMob(mobObj, num) {
    var num_sge = 0, msg = "";

    if (num === undefined) { // By default, base numbers on current population
        var max_mob = (population.current / 50); // is this 2% too small? 
        //No! According to research a standing army was about 1% of total population
        num = Math.ceil(max_mob * Math.random());
    }

    if (num === 0) { return num; }  // Nobody came

    // Human mobs might bring siege engines.
    if (mobObj.species == speciesType.human) { num_sge = Math.floor(Math.random() * num / 100); }

    mobObj.owned += num;
    civData.esiege.owned += num_sge;

    msg = prettify(num) + " " + mobObj.getQtyName(num) + " attacked";  //xxx L10N
    if (num_sge > 0) { msg += ", with " + prettify(num_sge) + " " + civData.esiege.getQtyName(num_sge); }  //xxx L10N 
    gameLog(msg);

    return num;
}

/* War Functions */
function invade(ecivtype) {
    //invades a certain type of civilisation based on the button clicked
    curCiv.raid.raiding = true;
    curCiv.raid.last = ecivtype;

    curCiv.raid.epop = civSizes[ecivtype].max_pop + 1;
    // If no max pop, use 2x min pop.
    if (curCiv.raid.epop === Infinity) { curCiv.raid.epop = civSizes[ecivtype].min_pop * 2; }
    if (civData.glory.timer > 0) { curCiv.raid.epop *= 2; } //doubles soldiers fought

    // 5-25% of enemy population is soldiers.
    civData.esoldier.owned += (curCiv.raid.epop / 20) + Math.floor(Math.random() * (curCiv.raid.epop / 5));
    civData.efort.owned += Math.floor(Math.random() * (curCiv.raid.epop / 5000));

    // Glory redoubles rewards (doubled here because doubled already above)
    var baseLoot = curCiv.raid.epop / (1 + (civData.glory.timer <= 0));

    // Set rewards of land and other random plunder.
    //xxx Maybe these should be partially proportionate to the actual number of defenders?
    //curCiv.raid.plunderLoot = { 
    //	freeLand: Math.round(baseLoot * (1 + (civData.administration.owned))) 
    //};
    // land between 75 and 95%
    var baseLand = baseLoot * (1 + (civData.administration.owned));
    curCiv.raid.plunderLoot = {
        freeLand: Math.floor((baseLand * 0.75) + Math.floor(Math.random() * (baseLand * 0.2)))
    };
    lootable.forEach(function (elem) { curCiv.raid.plunderLoot[elem.id] = Math.round(baseLoot * Math.random()); });

    ui.hide("#raidNews");
    updateTargets(); //Hides raid buttons until the raid is finished
    updatePartyButtons();
}
function onInvade(control) { return invade(dataset(control, "target")); }

function onInvadeMult(control) {
    var times = dataset(control, "value");
    //console.log('inv mult', times)

    curCiv.raid.invadeciv = dataset(control, "target");
    switch (times.toString()) {
        case '10': {
            curCiv.raid.left = 10;
            invade(dataset(control, "target"));
            break;
        }
        case '100': {
            curCiv.raid.left = 100;
            invade(dataset(control, "target"));
            break;
        }
        case 'inf': {
            curCiv.raid.left = Infinity;
            invade(dataset(control, "target"));
            break;
        }
    }
}

function breakInvadeLoop() {
    curCiv.raid.left = 0;
    curCiv.raid.invadeciv = null;
}

function plunder() {
    var plunderMsg = "";
    var raidNewsElt = ui.find("#raidNews");

    // If we fought our largest eligible foe, but not the largest possible, raise the limit.
    if ((curCiv.raid.targetMax != civSizes[civSizes.length - 1].id) && curCiv.raid.last == curCiv.raid.targetMax) {
        curCiv.raid.targetMax = civSizes[civSizes[curCiv.raid.targetMax].idx + 1].id;
    }

    // Improve morale based on size of defeated foe.
    adjustMorale((civSizes[curCiv.raid.last].idx + 1) / 100);

    // Lamentation
    if (civData.lament.owned) { curCiv.attackCounter -= Math.ceil(curCiv.raid.epop / 2000); }

    // Collect loot
    //payFor(curCiv.raid.plunderLoot, -1);  // We pay for -1 of these to receive them. 
    // Why?  If land is negative, this results in incorrect value
    var i, num;
    var lootObj = curCiv.raid.plunderLoot;
    for (i in lootObj) {
        num = lootObj[i];
        if (!num) { continue; }
        civData[i].owned += num;
    }

    // Create message to notify player
    plunderMsg = civSizes[curCiv.raid.last].name + " raided! ";
    plunderMsg += "Plundered " + getReqText(curCiv.raid.plunderLoot) + ". ";
    gameLog(plunderMsg);

    ui.show(raidNewsElt, true);
    raidNewsElt.innerHTML = "Results of last raid: " + plunderMsg;

    // Victory outcome has been handled, end raid
    resetRaiding();
    updateResourceTotals();
    updateTargets();

}

// Returns all of the combatants present for a given place and alignment that.
function getCombatants(place, alignment) {
    return unitData.filter(function (elem) {
        return ((elem.alignment == alignment) && (elem.place == place)
            && (elem.combatType) && (elem.owned > 0));
    });
}

// Some attackers get a damage mod against some defenders
function getCasualtyMod(attacker, defender) {
    // Cavalry take 50% more casualties vs infantry
    if ((defender.combatType == combatTypes.cavalry) && (attacker.combatType == combatTypes.infantry)) { return 1.50; }

    return 1.0; // Otherwise no modifier
}

function doFight(attacker, defender) {
    if ((attacker.owned <= 0) || (defender.owned <= 0)) { return; }

    // Defenses vary depending on whether the player is attacking or defending.
    var fortMod = (defender.alignment == alignmentType.player ?
        (civData.fortification.owned * civData.fortification.efficiency)
        : (civData.efort.owned * civData.efort.efficiency));
    var palisadeMod = ((defender.alignment == alignmentType.player) && (civData.palisade.owned)) * civData.palisade.efficiency;

    // Determine casualties on each side.  Round fractional casualties
    // probabilistically, and don't inflict more than 100% casualties.
    var attackerCas = Math.min(attacker.owned, rndRound(getCasualtyMod(defender, attacker) * defender.owned * defender.efficiency));
    var defenderCas = Math.min(defender.owned, rndRound(getCasualtyMod(attacker, defender) * attacker.owned * (attacker.efficiency - palisadeMod) * Math.max(1 - fortMod, 0)));

    attacker.owned -= attackerCas;
    defender.owned -= defenderCas;

    // Give player credit for kills.
    var playerCredit = ((attacker.alignment == alignmentType.player) ? defenderCas : (defender.alignment == alignmentType.player) ? attackerCas : 0);

    //Increments enemies slain, corpses, and piety
    curCiv.enemySlain.owned += playerCredit;
    if (civData.throne.owned) { civData.throne.count += playerCredit; }
    civData.corpses.owned += (attackerCas + defenderCas);
    if (civData.book.owned) { civData.piety.owned += (attackerCas + defenderCas) * 10; }

    // increase morale for enemy kills.  This is the opposite of losing morale for citizens dying
    // see doStarve and killUnit
    if (playerCredit > 0) {
        adjustMorale(0.0025 / playerCredit);
    }
    //Updates population figures (including total population)
    calculatePopulation();
}

function doWolves(attacker) {
    // eat corpses first
    if (civData.corpses.owned > 0) {
        var gone = Math.ceil((Math.random() * attacker.owned / 100));
        civData.corpses.owned -= gone;
        attacker.owned -= gone; // wolves leave after eating
        // just in case
        if (civData.corpses.owned < 0) { civData.corpses.owned = 0; }

        gameLog(prettify(gone) + " rotting " + civData.corpses.getQtyName(gone) + " devoured by wolves");

    } else {
        doSlaughter(attacker);
    }
}
function doBandits(attacker) {
    // bandits mainly loot
    var r = Math.random();
    if (r < 0.1) { doSlaughter(attacker); }
    else if (r < 0.2) { doSack(attacker); }
    else { doLoot(attacker); }
}
function doBarbarians(attacker) {
    //barbarians mainly kill, steal and destroy
    var r = Math.random();
    if (r < 0.3) {
        if (Math.random() < 0.5) {
            doSlaughter(attacker);
        } else {
            doSlaughterMulti(attacker);
        }
    }
    else if (r < 0.6) { doLoot(attacker); }
    else if (r < 0.9) {
        if (Math.random() < 0.5) {
            doSack(attacker);
        } else {
            doSackMulti(attacker);
        }
    }
    else { doConquer(attacker); }
}
function doInvaders(attacker) {
    var r = Math.random();
    if (r < 0.25) { doSlaughterMulti(attacker); }
    else if (r < 0.5) { doLoot(attacker); }
    else if (r < 0.75) { doSackMulti(attacker); }
    else { doConquer(attacker); }
}

// kill
function doSlaughter(attacker) {
    var killVerb = (attacker.species == speciesType.animal) ? "eaten" : "killed";
    //var target = getRandomHealthyWorker(); //Choose random worker
    var target = getRandomWorker(); //Choose random worker
    if (target) {
        var targetUnit = civData[target];
        if (targetUnit.owned >= 1) {
            // An attacker may disappear after killing
            if (Math.random() < attacker.killStop) { --attacker.owned; }

            targetUnit.owned -= 1;
            // Animals will eat the corpse
            if (attacker.species != speciesType.animal) {
                civData.corpses.owned += 1;
            }

            if (population.living > 50) {
                // the greater the population, the less the drop in morale
                adjustMorale(-0.0025 / population.living);
            }

            gameLog("1 " + targetUnit.getQtyName(1) + " " + killVerb + " by " + attacker.getQtyName(2)); // always use plural
        }
        if (targetUnit.owned <= 0) { // Attackers slowly leave once everyone is dead
            var leaving = Math.ceil(attacker.owned * Math.random() * attacker.killFatigue);
            attacker.owned -= leaving;
        }
    }
    calculatePopulation();
    if (attacker.owned < 0) { attacker.owned = 0; }
}
function doSlaughterMulti(attacker) {
    //var killVerb = (attacker.species == speciesType.animal) ? "eaten" : "killed";

    // kill up to 25% of attacking force
    var targets = 1 + Math.ceil(Math.random() * attacker.owned * 0.25);
    var kills = 0;
    for (var k = 1; k <= targets; k++) {
        //var target = getRandomHealthyWorker(); //Choose random worker
        // sick people get killed as well
        var target = getRandomWorker(); //Choose random worker
        var lastTarget = "citizen";
        var targetUnit = civData[target];
        if (target) {
            if (targetUnit.owned >= 1) {
                // An attacker may disappear after killing
                if (Math.random() < attacker.killStop) { --attacker.owned; }

                targetUnit.owned -= 1;
                kills++;
                lastTarget = targetUnit.singular;

                // Animals will eat the corpse
                if (attacker.species != speciesType.animal) {
                    civData.corpses.owned += 1;
                }

                if (population.living > 50) {
                    // the greater the population, the less the drop in morale
                    adjustMorale(-0.0025 / population.living);
                }
            }
            if (targetUnit.owned <= 0) { // Attackers slowly leave once everyone is dead
                var leaving = Math.ceil(attacker.owned * Math.random() * attacker.killFatigue);
                attacker.owned -= leaving;
            }
        }
    }
    if (kills > 0) {
        var killVerb = (kills == 1) ? " " + lastTarget + " murdered by " : " citizens slaughtered by ";
        gameLog(prettify(kills) + killVerb + attacker.getQtyName(2)); // always use plural attacker
        calculatePopulation();
    }
    if (attacker.owned < 0) { attacker.owned = 0; }
}

// rob
function doLoot(attacker) {
    // Select random resource, steal random amount of it.
    //var target = lootable[Math.floor(Math.random() * lootable.length)];
    var targetID = getRandomResource();
    var target = civData[targetID];
    if (isValid(target) && target.owned > 0) {
        var stolenQty = Math.ceil((Math.random() * attacker.owned * 0.25)); //up to 25% of attackers steal.
        stolenQty = stolenQty * (1 + Math.floor((Math.random() * 10))); // attackers steal up to 10 items
        // target.owned can be decimal.  we can't loot more than is available
        stolenQty = Math.min(stolenQty, Math.floor(target.owned));
        if (stolenQty > 0) {
            target.owned -= stolenQty;
            if (Math.random() < attacker.lootStop) { --attacker.owned; } // Attackers might leave after stealing something.
            gameLog(prettify(stolenQty) + " " + target.getQtyName(stolenQty) + " stolen by " + attacker.getQtyName(2)); // always plural
        }
    }
    if (isValid(target) && target.owned <= 0) {
        //some will leave
        var leaving = Math.ceil(attacker.owned * Math.random() * attacker.lootFatigue);
        attacker.owned -= leaving;
    }

    if (attacker.owned < 0) { attacker.owned = 0; }
    updateResourceTotals();
}

// burn
function doSack(attacker) {
    //Destroy building
    var target = sackable[Math.floor(Math.random() * sackable.length)];

    if (target.owned > 0) {
        var destroyVerb = (Math.random() < 0.5) ? "burned" : "destroyed";
        // Slightly different phrasing for fortifications
        if (target == civData.fortification) { destroyVerb = "damaged"; }

        --target.owned;
        ++civData.freeLand.owned;

        if (Math.random() < attacker.sackStop) { --attacker.owned; } // Attackers might leave after sacking something.
        updateRequirements(target);
        updateResourceTotals();
        calculatePopulation(); // Limits might change

        gameLog("1 " + target.getQtyName(1) + " " + destroyVerb + " by " + attacker.getQtyName(2)); // always plural
    }
    if (target.owned <= 0) {
        //some will leave
        var leaving = Math.ceil(attacker.owned * Math.random() * attacker.sackFatigue);
        attacker.owned -= leaving;
    }
    if (attacker.owned < 0) { attacker.owned = 0; }
}

function doSackMulti(attacker) {
    //Destroy buildings

    // sack up to 25% of attacking force
    var targets = 1 + Math.ceil(Math.random() * attacker.owned * 0.25);
    var sacks = 0;
    var lastTarget = "building";
    for (var s = 1; s <= targets; s++) {
        var targetID = getRandomBuilding(); //sackable[Math.floor(Math.random() * sackable.length)];
        var target = civData[targetID];

        if (isValid(target) && target.owned > 0) {
            --target.owned;
            ++civData.freeLand.owned;
            sacks++;
            lastTarget = target.singular;

            if (Math.random() < attacker.sackStop) { --attacker.owned; } // Attackers might leave after sacking something.
            updateRequirements(target);

        }
        if (isValid(target) && target.owned <= 0) {
            //some will leave
            var leaving = Math.ceil(attacker.owned * Math.random() * attacker.sackFatigue);
            attacker.owned -= leaving;
        }
        if (attacker.owned < 0) { attacker.owned = 0; }
        updateRequirements(target);
    }

    if (sacks > 0) {
        var destroyVerb = (sacks == 1) ? " " + lastTarget + " burned by " : " buildings destroyed by ";
        gameLog(prettify(sacks) + destroyVerb + attacker.getQtyName(2)); // always use plural attacker
        updateResourceTotals();
        calculatePopulation(); // Limits might change
    }

    if (attacker.owned < 0) { attacker.owned = 0; }
}

// occupy land
function doConquer(attacker) {
    if (civData.freeLand.owned > 0) {
        // up to 25% of attacking force or land - this might need adjusting
        var targets = Math.min(attacker.owned, civData.freeLand.owned);
        var land = Math.ceil(Math.random() * targets * 0.25);
        land = Math.min(civData.freeLand.owned, land);
        if (land > 0) {
            civData.freeLand.owned -= land;
            gameLog(prettify(land) + " land occupied by " + attacker.getQtyName(2)); // always plural
            // Attackers might leave after conquering land.
            if (Math.random() < attacker.conquerStop) { attacker.owned -= land; }
        }
    }
    if (civData.freeLand.owned <= 0) {
        //some will leave
        var leaving = Math.ceil(attacker.owned * Math.random() * attacker.conquerFatigue);
        attacker.owned -= leaving;
    }
    if (attacker.owned < 0) { attacker.owned = 0; }
}

function doShades() {
    var defender = civData.shade;
    if (defender.owned <= 0) { return; }

    // Attack each enemy in turn.
    getCombatants(defender.place, alignmentType.enemy).forEach(function (attacker) {
        var num = Math.floor(Math.min((attacker.owned / 4), defender.owned));
        //xxx Should we give book and throne credit here?
        defender.owned -= num;
        attacker.owned -= num;
    });

    // Shades fade away even if not killed.
    defender.owned = Math.max(Math.floor(defender.owned * 0.95), 0);
}

// Deals with potentially capturing enemy siege engines.
function doEsiege(siegeObj, targetObj) {
    if (siegeObj.owned <= 0) { return; }

    //First check there are enemies there defending them
    if (!getCombatants(siegeObj.place, siegeObj.alignment).length &&
        getCombatants(targetObj.place, targetObj.alignment).length) {
        //the siege engines are undefended; maybe capture them.
        if ((targetObj.alignment == alignmentType.player) && civData.mathematics.owned) { //Can we use them?
            gameLog("Captured " + prettify(siegeObj.owned) + " enemy siege engines.");
            civData.siege.owned += siegeObj.owned; //capture them
        }
        siegeObj.owned = 0;
    }
    else if (doSiege(siegeObj, targetObj) > 0) {
        if (targetObj.id === buildingType.fortification) {
            updateRequirements(targetObj);
            gameLog("Enemy siege engine damaged our fortifications");
        }
    }
}

// Process siege engine attack.
// Returns the number of hits.
function doSiege(siegeObj, targetObj) {
    var i, hit, hits = 0;
    // Only half can fire every round due to reloading time.
    // We also allow no more than 2 per defending fortification.
    var firing = Math.ceil(Math.min(siegeObj.owned / 2, targetObj.owned * 2));
    for (i = 0; i < firing; ++i) {
        hit = Math.random();
        if (hit > 0.95) { --siegeObj.owned; } // misfire; destroys itself
        if (hit >= siegeObj.efficiency) { continue; } // miss
        ++hits; // hit
        if (--targetObj.owned <= 0) { break; }
    }

    return hits;
}

//Handling raids
function doRaid(place, attackAlignment, defendAlignment) {
    if (!curCiv.raid.raiding) { return; } // We're not raiding right now.

    var attackers = getCombatants(place, attackAlignment);
    var defenders = getCombatants(place, defendAlignment);

    if (attackers.length && !defenders.length) { // Win check.
        // Slaughter any losing noncombatant units.
        //xxx Should give throne and corpses for any human ones?
        unitData.filter(function (elem) { return ((elem.alignment == defendAlignment) && (elem.place == place)); })
            .forEach(function (elem) { elem.owned = 0; });

        if (!curCiv.raid.victory) { gameLog("Raid victorious!"); } // Notify player on initial win.
        curCiv.raid.victory = true;  // Flag victory for future handling
    }

    if (!attackers.length && defenders.length) { // Loss check.
        curCiv.raid.left = 0;
        curCiv.raid.invadeciv = null;
        // Slaughter any losing noncombatant units.
        //xxx Should give throne and corpses for any human ones?
        unitData.filter(function (elem) { return ((elem.alignment == attackAlignment) && (elem.place == place)); })
            .forEach(function (elem) { elem.owned = 0; });

        gameLog("Raid defeated");  // Notify player
        resetRaiding();
        return;
    }

    // Do the actual combat.
    attackers.forEach(function (attacker) {
        defenders.forEach(function (defender) { doFight(attacker, defender); }); // FIGHT!
    });

    // Handle siege engines
    doSiege(civData.siege, civData.efort);
}

function doRaidCheck(place, attackAlignment, defendAlignment) {
    if (curCiv.raid.raiding && curCiv.raid.victory) {
        var attackers = getCombatants(place, attackAlignment);
        if (curCiv.raid.left > 0) {
            plunder(); // plunder resources before new raid
            var troopsCount = attackers.reduce((acc, val) => acc + val.owned, 0);
            if (troopsCount > 0) { // attack
                curCiv.raid.left -= 1;
                invade(curCiv.raid.invadeciv);
            }
        } else {
            curCiv.raid.invadeciv = null;
        }
    }
}

function doMobs() {
    //Checks when mobs will attack
    //xxx Perhaps this should go after the mobs attack, so we give 1 turn's warning?
    var mobType, choose;
    if (population.current > 0) { // No attacks if deserted.
        ++curCiv.attackCounter;
    }

    // we don't want mobs attacking tiny populations
    //population.current > 1 &&
    if (curCiv.attackCounter > (60 * 5)) { //Minimum 5 minutes
        var rnum = population.current * Math.random();

        // attempt at forcing attacks more frequently the larger the civ
        // 50 because that is max pop of a thorp
        //if (600 * Math.random() < 1) {
        if (rnum < population.current / 50) {
            curCiv.attackCounter = 0;
            //Choose which kind of mob will attack
            //mobType = mobTypeIds.wolf; // Default to wolves
            //if (population.current >= 10000) {
            //    choose = Math.random();
            //    if (choose > 0.5) { mobType = "barbarian"; }
            //    else if (choose > 0.2) { mobType = "bandit"; }
            //} else if (population.current >= 1000) {
            //    if (Math.random() > 0.5) { mobType = "bandit"; }
            //}

            // we don't want wolves/bandits attacking large settlements/nations
            // or barbarians/invaders attacking small ones
            if (population.current < civSizes.thorp.min_pop) {
                // mostly wolves
                if (Math.random() < 0.95) {
                    mobType = mobTypeIds.wolf;
                }
                else {
                    mobType = mobTypeIds.bandit;
                }
            }
            else if (population.current >= civSizes.thorp.min_pop && population.current < civSizes.village.min_pop) {
                // mostly wolves
                if (Math.random() < 0.75) {
                    mobType = mobTypeIds.wolf;
                }
                else {
                    mobType = mobTypeIds.bandit;
                }
            }
            else if (population.current >= civSizes.village.min_pop && population.current < civSizes.town.min_pop) {
                // wolf or bandit
                if (Math.random() < 0.5) {
                    mobType = mobTypeIds.wolf;
                }
                else {
                    mobType = mobTypeIds.bandit;
                }
            }
            else if (population.current >= civSizes.town.min_pop && population.current < civSizes.smallCity.min_pop) {
                // mostly bandits
                if (Math.random() < 0.75) {
                    mobType = mobTypeIds.bandit;
                }
                else {
                    mobType = mobTypeIds.barbarian;
                }
            }
            else if (population.current >= civSizes.smallCity.min_pop && population.current < civSizes.largeCity.min_pop) {
                // bandits or barbarians
                if (Math.random() < 0.5) {
                    mobType = mobTypeIds.bandit;
                }
                else {
                    mobType = mobTypeIds.barbarian;
                }
            }
            else if (population.current >= civSizes.largeCity.min_pop && population.current < civSizes.smallNation.min_pop) {
                // mostly barbarians
                if (Math.random() < 0.75) {
                    mobType = mobTypeIds.barbarian;
                }
                else {
                    mobType = mobTypeIds.invader;
                }
            }
            else if (population.current >= civSizes.smallNation.min_pop && population.current < civSizes.largeNation.min_pop) {
                // barbarians or invaders
                if (Math.random() < 0.5) {
                    mobType = mobTypeIds.barbarian;
                }
                else {
                    mobType = mobTypeIds.invader;
                }
            }
            else if (population.current >= civSizes.largeNation.min_pop) {
                // mainly invaders 
                if (Math.random() < 0.25) {
                    mobType = mobTypeIds.barbarian;
                }
                else {
                    mobType = mobTypeIds.invader;
                }
            }
            spawnMob(civData[mobType]);
        }
    }

    //Handling mob attacks
    getCombatants(placeType.home, alignmentType.enemy).forEach(function (attacker) {
        if (attacker.owned <= 0) { return; } // In case the last one was killed in an earlier iteration.

        var defenders = getCombatants(attacker.place, alignmentType.player);
        if (!defenders.length) { attacker.onWin(); return; } // Undefended 

        defenders.forEach(function (defender) { doFight(attacker, defender); }); // FIGHT!
    });
}
