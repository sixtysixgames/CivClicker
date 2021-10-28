"use strict";

/* Trade functions */
function setInitTradePrice(civObj) {
    if (!isValid(civObj.initTradeAmount)) { return; }
    updateTradeButton(civObj.id, civObj.initTradeAmount);
}

function startTrader() {
    // check a couple of things, if one of these is missing, then all are probably missing
    if (!checkTradeAmounts(resourceType.food)) { return; }
    if (!checkTradeAmounts(resourceType.herbs)) { return; }
    if (!checkTradeAmounts(resourceType.metal)) { return; }

    // Set timer length (12 sec + 5 sec/upgrade)
    curCiv.trader.timer = 12 + (5 * (civData.currency.owned + civData.commerce.owned + civData.stay.owned));

    //var selected = lootable[Math.floor(Math.random() * lootable.length)];
    // select a resource the player actually has some to trade
    var selected = getRandomTradeableResource();
    if (isValid(selected)) {
        curCiv.trader.materialId = selected.id;
        curCiv.trader.requested = selected.baseTradeAmount * (Math.ceil(Math.random() * 100)); // Up to 20x amount
        // between 75% and 100% of resource limit
        var limit = Math.floor(selected.limit * 0.75) + Math.floor(selected.limit * Math.random() * 0.25)
        curCiv.trader.requested = Math.min(selected.limit, curCiv.trader.requested);
        // and finally, we don't want less than the initial amount
        if (curCiv.trader.requested < selected.initTradeAmount) {
            curCiv.trader.requested = selected.initTradeAmount
        }
        curCiv.trader.userTraded = false; // has the user sold requested
        updateTrader();
    }
}

function trade() {
    var materialId = curCiv.trader.materialId;
    if (!checkTradeAmounts(materialId)) { return; }
    //check we have enough of the right type of resources to trade
    if (!curCiv.trader.materialId || (curCiv.trader.materialId.owned < curCiv.trader.requested)) {
        gameLog("Not enough resources to trade.");
        return;
    }

    //subtract resources, add gold
    var material = civData[curCiv.trader.materialId];

    material.owned -= curCiv.trader.requested;
    curCiv.trader.userTraded = true;
    ++civData.gold.owned;
    updateResourceTotals();

    gameLog("Traded " + prettify(curCiv.trader.requested) + " " + material.getQtyName(curCiv.trader.requested));
}

function isTraderHere() {
    return (curCiv.trader.timer > 0);
}

function checkTradeAmounts(materialId) {
    var ret = true;
    if (!isValid(curCiv[materialId].tradeAmount)) { sysLog("Missing curCiv tradeAmount for " + materialId); ret = false; }
    if (!isValid(civData[materialId].baseTradeAmount)) { sysLog("Missing civData baseTradeAmount for " + materialId); ret = false; }
    return ret;
}

function buy(materialId) {
    if (!checkTradeAmounts(materialId)) { return; }
    if (civData.gold.owned < 1) { return; }

    var material = civData[materialId];
    var currentAmount = curCiv[materialId].tradeAmount;

    material.owned += currentAmount;
    --civData.gold.owned;

    updateResourceTotals();
}

function updateTradeButton(materialId, cost) {
    var materialCostID = "#" + materialId + "Cost";
    var elem = ui.find(materialCostID);
    if (!elem) { console.warn("Missing UI element for " + materialCostID); return; }

    elem.innerHTML = prettify(cost);
}

function updateTradeButtons() {
    updateTradeButton(resourceType.food, curCiv.food.tradeAmount);
    updateTradeButton(resourceType.wood, curCiv.wood.tradeAmount);
    updateTradeButton(resourceType.stone, curCiv.stone.tradeAmount);
    updateTradeButton(resourceType.skins, curCiv.skins.tradeAmount);
    updateTradeButton(resourceType.herbs, curCiv.herbs.tradeAmount);
    updateTradeButton(resourceType.ore, curCiv.ore.tradeAmount);
    updateTradeButton(resourceType.leather, curCiv.leather.tradeAmount);
    updateTradeButton(resourceType.potions, curCiv.potions.tradeAmount);
    updateTradeButton(resourceType.metal, curCiv.metal.tradeAmount);
}

function tickTraders() {
    var delayMult = 60 * (3 - ((civData.currency.owned) + (civData.commerce.owned)));
    var check;
    //traders occasionally show up
    if (population.current > 0) {
        ++curCiv.trader.counter;
    }
    if (population.current > 0 && curCiv.trader.counter > delayMult) {
        check = Math.random() * delayMult;
        if (check < (1 + (0.2 * (civData.comfort.owned)))) {
            curCiv.trader.counter = 0;
            startTrader();
        }
    }

    if (curCiv.trader.timer > 0) {
        curCiv.trader.timer--;
    }
    if (curCiv.trader.timer == 1 && civData.cornexchange.owned) {
        // here we call a function to change price on trade buttons just before trader leaves
        updateTradeAmount();
    }
}

function updateTradeAmount() {
    var materialId = curCiv.trader.materialId;

    // simply change to 10% whatever was requested
    curCiv[materialId].tradeAmount = Math.floor(curCiv.trader.requested / 10);
    // don't offer less than base amount
    curCiv[materialId].tradeAmount = Math.max(civData[materialId].baseTradeAmount, curCiv[materialId].tradeAmount);

    updateTradeButton(materialId, curCiv[materialId].tradeAmount);
}