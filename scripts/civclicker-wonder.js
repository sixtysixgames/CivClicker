"use strict";

// Tallies the number of each wonder from the wonders array.
function tallyWonderCount() {
    wonderCount = {};
    curCiv.wonders.forEach(function (elem) {
        var resourceId = elem.resourceId;
        if (!isValid(wonderCount[resourceId])) { wonderCount[resourceId] = 0; }
        ++wonderCount[resourceId];
    });
}

// Return the production multiplier from wonders for a resource.
function getWonderBonus(resourceObj) {
    let ret = 0;
    if (!resourceObj) {
        //return 1;
        ret = 1;
    }
    else {
        //return (1 + (wonderCount[resourceObj.id] || 0) / 10);
        ret = 1 + (wonderCount[resourceObj.id] || 0) / 10;
    }
    //debug("getWonderBonus=" + ret);
    return ret;
}

/* Wonders functions */
function startWonder() {
    if (curCiv.curWonder.stage !== 0) { return; }
    ++curCiv.curWonder.stage;
    renameWonder();
    updateWonder();
}

function renameWonder() {
    // Can't rename before you start, or after you finish.
    if (curCiv.curWonder.stage === 0 || curCiv.curWonder.stage > 2) { return; }
    let n = prompt("Please name your Wonder:", curCiv.curWonder.name);
    if (!n) { return; }
    curCiv.curWonder.name = n;
    let wp = ui.find("#wonderNameP");
    if (wp) { wp.innerHTML = curCiv.curWonder.name; }
    let wc = ui.find("#wonderNameC");
    if (wc) { wc.innerHTML = curCiv.curWonder.name; }
}

function wonderSelect(resourceId) {
    if (curCiv.curWonder.stage !== 2) { return; }
    ++curCiv.curWonder.stage;
    ++curCiv.curWonder[resourceId];
    gameLog("You now have a permanent bonus to " + resourceId + " production");
    curCiv.wonders.push({ name: curCiv.curWonder.name, resourceId: resourceId });
    curCiv.curWonder.name = "";
    curCiv.curWonder.progress = 0;
    updateWonder();
}

function getWonderCostMultiplier() { // Based on the most wonders in any single resource.
    //var i;
    let mostWonders = 0;
    for (let i in wonderCount) { if (wonderCount.hasOwnProperty(i)) { mostWonders = Math.max(mostWonders, wonderCount[i]); } }
    return Math.pow(1.5, mostWonders);
}

function speedWonder() {
    if (civData.gold.owned < 100) { return; }
    civData.gold.owned -= 100;
    curCiv.curWonder.progress += 1 / getWonderCostMultiplier();
    curCiv.curWonder.rushed = true;
    updateWonder();
}

// Note:  Returns the index (which could be 0), or 'false'.
function haveDeity(name) {
    //var i;
    for (let i = 0; i < curCiv.deities.length; ++i) {
        if (curCiv.deities[i].name == name) { return i; }
    }
    return false;
}

function doLabourers() {
    if (curCiv.curWonder.stage !== 1) { return; }

    let prod = 0;

    if (curCiv.curWonder.progress >= 100) {
        //Wonder is finished! First, send workers home
        civData.unemployed.owned += civData.labourer.owned;
        civData.unemployed.ill += civData.labourer.ill;
        civData.labourer.owned = 0;
        civData.labourer.ill = 0;
        calculatePopulation();

        //then set wonder.stage so things will be updated appropriately
        ++curCiv.curWonder.stage;
    } else { //we're still building
        //if (!isWonderLimited()) {
            prod = getWonderProduction();

            //remove resources
            wonderResources.forEach(function (resource) {
                resource.owned -= prod;
                resource.net -= prod;
            });

            // labourers use prods more efficiently with mods
            prod += getLabourerMods();
            //increase progress
            curCiv.curWonder.progress += prod / (1000000 * getWonderCostMultiplier());
        //}
    }
}

function getWonderLowItem() {
    let lowItem = null;
    //var i = 0;
    for (let i = 0; i < wonderResources.length; ++i) {
        if (wonderResources[i].owned < 1) {
            lowItem = wonderResources[i];
            break;
        }
    }
    return lowItem;
}

function getWonderProduction() {
    let prod = civData.labourer.owned;
    // First, check our labourers and other resources to see if we're limited.
    wonderResources.forEach(function (resource) {
        prod = Math.min(prod, resource.owned);
    });
    return prod;
}

function isWonderLimited() {
    if (curCiv.curWonder.stage !== 1) {
        return false;
    }
    let prod = getWonderProduction();
    return (prod < civData.labourer.owned);
}

function getLabourerMods() {
    let mod = 0;
    mod += civData.civilservice.owned ? 0.0001 : 0;
    mod += civData.guilds.owned ? 0.0002 : 0;
    mod += civData.feudalism.owned ? 0.0005 : 0;
    mod += civData.serfs.owned ? 0.0005 : 0;
    mod += civData.nationalism.owned ? 0.001 : 0;
    return mod;
}
