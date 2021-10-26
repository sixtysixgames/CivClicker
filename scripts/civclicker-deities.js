"use strict";

function getCurDeityDomain() {
    return (curCiv.deities.length > 0) ? curCiv.deities[0].domain : undefined;
}

// todo make an associative array of dieties
function typeToId(deityType) {
    if (deityType == deityTypes.Battle) { return deityDomains.battle; }
    if (deityType == deityTypes.Cats) { return deityDomains.cats; }
    if (deityType == deityTypes.Fields) { return deityDomains.fields; }
    if (deityType == deityTypes.Underworld) { return deityDomains.underworld; }
    return deityType;
}
function idToType(domainId) {
    if (domainId == deityDomains.battle) { return deityTypes.Battle; }
    if (domainId == deityDomains.cats) { return deityTypes.Cats; }
    if (domainId == deityDomains.fields) { return deityTypes.Fields; }
    if (domainId == deityDomains.underworld) { return deityTypes.Underworld; }
    return domainId;
}

function getDeityRowText(deityId, deityObj) {
    if (!deityObj) { deityObj = { name: "No deity", domain: "", maxDev: 0 }; }

    return "<tr id='" + deityId + "'>"
        + "<td><strong><span id='" + deityId + "Name'>" + deityObj.name + "</span></strong>"
        + "<span id=" + deityId + "Domain' class='deityDomain'>" + "</td><td>" + idToType(deityObj.domain) + "</span></td>"
        + "<td><span id='" + deityId + "Devotion'>" + deityObj.maxDev + "</span></td></tr>";
}

function makeDeitiesTables() {
    // Display the active deity
    var deityId = "deityA";
    ui.find("#activeDeity").innerHTML = '<tr id="' + deityId + '">'
        + '<td><strong><span id="' + deityId + 'Name">' + '</span></strong>'
        + '<span id="' + deityId + 'Domain" class="deityDomain">' + '</span></td>'
        + '<td>Devotion: <span id="' + deityId + 'Devotion">' + '</span></td></tr>';

    // Display the table of prior deities.
    //xxx Change this to <th>, need to realign left.
    var s = "<tr><td><b>Name</b></td><td><b>Domain</b></td><td><b>Max Devotion</b></td></tr>";
    curCiv.deities.forEach(function (elem, i) {
        if ((i === 0) && (!elem.name)) { return; } // Don't display current deity-in-waiting.
        s += getDeityRowText("deity" + i, elem);
    });
    ui.find("#oldDeities").innerHTML = s;

    updateDeity();
}

// Creates or destroys zombies
// Pass a positive number to create, a negative number to destroy.
// Only idle zombies can be destroyed.
// If it can't create/destroy as many as requested, does as many as it can.
// Pass Infinity/-Infinity as the num to get the max possible.
// Pass "custom" or "-custom" to use the custom increment.
// Returns the actual number created or destroyed (negative if destroyed).
function raiseDead(num) {
    if (num === undefined) { num = 1; }
    if (num == "custom") { num = getCustomNumber(civData.unemployed); }
    if (num == "-custom") { num = -getCustomNumber(civData.unemployed); }

    // Find the most zombies we can raise
    num = Math.min(num, civData.corpses.owned);
    num = Math.max(num, -curCiv.zombie.owned);  // Cap firing by # in that job.
    num = Math.min(num, logSearchFn(calcZombieCost, civData.piety.owned));

    //Update numbers and resource levels
    civData.piety.owned -= calcZombieCost(num);
    curCiv.zombie.owned += num;
    civData.unemployed.owned += num;
    civData.corpses.owned -= num;

    //Notify player
    if (num == 1) { gameLog("A corpse rises, eager to do your bidding."); }
    else if (num > 1) { gameLog("The corpses rise, eager to do your bidding."); }
    else if (num == -1) { gameLog("A zombie crumples to the ground, inanimate."); }
    else if (num < -1) { gameLog("The zombies fall, mere corpses once again."); }

    calculatePopulation(); //Run through population->jobs cycle to update page with zombie and corpse totals
    updatePopulation();
    updateResourceTotals(); //Update any piety spent

    return num;
}

function summonShade() {
    if (curCiv.enemySlain.owned <= 0) { return 0; }
    if (!payFor(civData.summonShade.require)) { return 0; }

    var num = Math.ceil(curCiv.enemySlain.owned / 4 + (Math.random() * curCiv.enemySlain.owned / 4));
    curCiv.enemySlain.owned -= num;
    civData.shade.owned += num;

    return num;
}

//Deity Domains upgrades
function selectDeity(domain, force) {
    if (!force) {
        if (civData.piety.owned < 500) { return; } // Can't pay
        civData.piety.owned -= 500;
    }
    curCiv.deities[0].domain = domain;

    makeDeitiesTables();
    updateUpgrades();
}


//Selects a random worker, kills them, and then adds a random resource
//xxx This should probably scale based on population (and maybe devotion).
function wickerman() {
    //Select a random worker
    var job = getRandomHealthyWorker();
    if (!job) { return; }

    //Pay the price
    if (!payFor(civData.wickerman.require)) { return; }
    --civData[job].owned;
    calculatePopulation(); //Removes killed worker

    //Select a random lootable resource
    var rewardObj = lootable[Math.floor(Math.random() * lootable.length)];

    var qty = Math.floor(Math.random() * 1000);
    //xxx Note that this presumes the price is 500 wood.
    if (rewardObj.id == resourceType.wood) { qty = (qty / 2) + 500; } // Guaranteed to at least restore initial cost.
    rewardObj.owned += qty;

    function getRewardMessage(rewardObj) {
        switch (rewardObj.id) {
            case resourceType.food: return "The crops are abundant!";
            case resourceType.wood: return "The trees grow stout!";
            case resourceType.stone: return "The stone splits easily!";
            case resourceType.skins: return "The animals are healthy!";
            case resourceType.herbs: return "The gardens flourish!";
            case resourceType.ore: return "A new vein is struck!";
            case resourceType.leather: return "The tanneries are productive!";
            case resourceType.metal: return "The steel runs pure.";
            default: return "You gain " + rewardObj.getQtyName(qty) + "!";
        }
    }

    gameLog("Burned a " + civData[job].getQtyName(1) + ". " + getRewardMessage(rewardObj));
    updateResourceTotals(); //Adds new resources
    updatePopulation();
}

function walk(increment) {
    if (increment === undefined) { increment = 1; }
    if (increment === false) { increment = 0; civData.walk.rate = 0; }

    civData.walk.rate += increment;

    //xxx This needs to move into the main loop in case it's reloaded.
    ui.find("#walkStat").innerHTML = prettify(civData.walk.rate);
    ui.find("#ceaseWalk").disabled = (civData.walk.rate === 0);
    ui.show("#walkGroup", (civData.walk.rate > 0));
}

function tickWalk() {
    var i;
    var target = "";
    if (civData.walk.rate > population.healthy) {
        civData.walk.rate = population.healthy;
        ui.find("#ceaseWalk").disabled = true;
    }
    if (civData.walk.rate <= 0) { return; }

    for (i = 0; i < civData.walk.rate; ++i) {
        target = getRandomHealthyWorker(); //xxx Need to modify this to do them all at once.
        if (!target) { break; }
        --civData[target].owned;
    }
    updatePopulation(true);
}

// Give a temporary bonus based on the number of cats owned.
function pestControl(length) {
    if (length === undefined) { length = 10; }
    if (civData.piety.owned < (10 * length)) { return; }
    civData.piety.owned -= (10 * length);
    civData.pestControl.timer = length * civData.cat.owned;
    gameLog("The vermin are exterminated.");
}

/* Iconoclasm */
function iconoclasmList() {
    var i;
    //Lists the deities for removing
    if (civData.piety.owned >= 1000) {
        civData.piety.owned -= 1000;
        updateResourceTotals();
        ui.find("#iconoclasm").disabled = true;
        var append = "<br />";
        for (i = 1; i < curCiv.deities.length; ++i) {
            append += '<button onclick="iconoclasm(' + i + ')">';
            append += curCiv.deities[i].name;
            append += '</button><br />';
        }
        append += '<br /><button onclick=\'iconoclasm("cancel")\'>Cancel</button>';
        ui.find("#iconoclasmList").innerHTML = append;
    }
}

function iconoclasm(index) {
    //will splice a deity from the deities array unless the user has cancelled
    ui.find("#iconoclasmList").innerHTML = "";
    ui.find("#iconoclasm").disabled = false;
    if ((index == "cancel") || (index >= curCiv.deities.length)) {
        //return the piety
        civData.piety.owned += 1000;
        return;
    }

    //give gold
    civData.gold.owned += Math.floor(Math.pow(curCiv.deities[index].maxDev, 1 / 1.25));

    //remove the deity
    curCiv.deities.splice(index, 1);

    makeDeitiesTables();
}


function smiteMob(mobObj) {
    if (!isValid(mobObj.owned) || mobObj.owned <= 0) { return 0; }
    var num = Math.min(mobObj.owned, Math.floor(civData.piety.owned / 100));
    civData.piety.owned -= num * 100;
    mobObj.owned -= num;
    civData.corpses.owned += num; //xxx Should dead wolves count as corpses?
    curCiv.enemySlain.owned += num;
    if (civData.throne.owned) { civData.throne.count += num; }
    if (civData.book.owned) { civData.piety.owned += num * 10; }
    gameLog("Struck down " + num + " " + mobObj.getQtyName(num)); // L10N
    return num;
}

function smite() {
    smiteMob(civData.invader);
    smiteMob(civData.barbarian);
    smiteMob(civData.bandit);
    smiteMob(civData.wolf);
    updateResourceTotals();
    updateJobButtons();
}


function glory(time) {
    if (time === undefined) { time = 180; }
    if (!payFor(civData.glory.require)) { return; } //check it can be bought

    civData.glory.timer = time; //set timer
    //xxx This needs to move into the main loop in case it's reloaded.
    ui.find("#gloryTimer").innerHTML = civData.glory.timer; //update timer to player
    ui.find("#gloryGroup").style.display = "block";
}

function grace(delta) {
    if (delta === undefined) { delta = 0.1; }
    if (civData.piety.owned >= civData.grace.cost) {
        civData.piety.owned -= civData.grace.cost;
        civData.grace.cost = Math.floor(civData.grace.cost * 1.2);
        ui.find("#graceCost").innerHTML = prettify(civData.grace.cost);
        adjustMorale(delta);
        updateResourceTotals();
        updateMorale();
    }
}

function doPestControl() {
    //Decrements the pestControl Timer
    if (civData.pestControl.timer > 0) { --civData.pestControl.timer; }
}

function tickGlory() {
    //Handles the Glory bonus
    if (civData.glory.timer > 0) {
        ui.find("#gloryTimer").innerHTML = civData.glory.timer--;
    } else {
        ui.find("#gloryGroup").style.display = "none";
    }
}

function doThrone() {
    if (civData.throne.count >= 100) {
        //If sufficient enemies have been slain, build new temples for free
        civData.temple.owned += Math.floor(civData.throne.count / 100);
        civData.throne.count = 0; //xxx This loses the leftovers.
        updateResourceTotals();
    }
}

function tickGrace() {
    if (civData.grace.cost > 1000) {
        civData.grace.cost = Math.floor(--civData.grace.cost);
        ui.find("#graceCost").innerHTML = prettify(civData.grace.cost);
    }
}
