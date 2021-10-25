"use strict";

/* Trade functions */

function startTrader() {
    // check a couple of things, if one of these is missing, then all are probably missing
    if (!checkTradeAmounts("food")) { return; }
    if (!checkTradeAmounts("herbs")) { return; }
    if (!checkTradeAmounts("metal")) { return; }

    // Set timer length (12 sec + 5 sec/upgrade)
    curCiv.trader.timer = 12 + (5 * (civData.currency.owned + civData.commerce.owned + civData.stay.owned));

    //then set material and requested amount
    //var tradeItems = [ // Item and base amount
    //    { materialId: "food", requested: 5000 },
    //    { materialId: "wood", requested: 5000 },
    //    { materialId: "stone", requested: 5000 },
    //    { materialId: "skins", requested: 500 },
    //    { materialId: "herbs", requested: 500 },
    //    { materialId: "ore", requested: 500 },
    //    { materialId: "leather", requested: 250 },
    //    { materialId: "metal", requested: 250 }
    //];
    // TODO: should probably use the lootable array
    //var tradeItems = [ // Item and base amount
    //    { materialId: "food", requested: civData["food"].baseTradeAmount },
    //    { materialId: "wood", requested: civData["wood"].baseTradeAmount },
    //    { materialId: "stone", requested: civData["stone"].baseTradeAmount },
    //    { materialId: "skins", requested: civData["skins"].baseTradeAmount },
    //    { materialId: "herbs", requested: civData["herbs"].baseTradeAmount },
    //    { materialId: "ore", requested: civData["ore"].baseTradeAmount },
    //    { materialId: "leather", requested: civData["leather"].baseTradeAmount },
    //    { materialId: "metal", requested: civData["metal"].baseTradeAmount }
    //];

    //// Randomly select and merge one of the above.
    //var selected = tradeItems[Math.floor(Math.random() * tradeItems.length)];
    //curCiv.trader.materialId = selected.materialId;
    //curCiv.trader.requested = selected.requested * (Math.ceil(Math.random() * 100)); // Up to 20x amount

    var selected = lootable[Math.floor(Math.random() * lootable.length)];
    curCiv.trader.materialId = selected.id;
    curCiv.trader.requested = selected.baseTradeAmount * (Math.ceil(Math.random() * 100)); // Up to 20x amount

    curCiv.trader.userTraded = false; // has the user sold requested

    updateTrader();
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

    // gain 1% when we sell;  see buy() for decreasing prices
    //curCiv[materialId].tradeAmount += Math.round(curCiv[materialId].tradeAmount * 0.01);
    //curCiv[materialId].tradeAmount = Math.max(civData[materialId].baseTradeAmount, curCiv[materialId].tradeAmount);
    //updateTradeButton(materialId, curCiv[materialId].tradeAmount);

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

    // lose 1% when we buy;  see trade() for increasing prices
    //currentAmount -= Math.round(currentAmount * 0.01);
    //curCiv[materialId].tradeAmount = Math.max(civData[materialId].baseTradeAmount, currentAmount);
    //updateTradeButton(materialId, curCiv[materialId].tradeAmount);
    //elem.innerHTML = civData[materialId].tradeAmount;
    //}
    //if (material == civData.food || material == civData.wood || material == civData.stone) { material.owned += 5000; }
    //if (material == civData.skins || material == civData.herbs || material == civData.ore) { material.owned += 500; }
    //if (material == civData.leather || material == civData.metal) { material.owned += 250; }

    updateResourceTotals();
}

function updateTradeButton(materialId, cost) {
    var materialCostID = "#" + materialId + "Cost";
    var elem = ui.find(materialCostID);
    if (!elem) { console.warn("Missing UI element for " + materialCostID); return; }

    elem.innerHTML = prettify(cost);
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
    if (curCiv.trader.timer == 1) {
        // here we call a function to change price on trade buttons just before trader leaves
        updateTradeAmount();
    }
}

function updateTradeAmount() {
    
    var materialId = curCiv.trader.materialId;
    // randomly set new trade amount
    //curCiv[materialId].tradeAmount = Math.round(Math.random() * civData[materialId].baseTradeAmount) * 10;

    // if user trades then price goes down, else price randomly goes up or down
    // the logic runs something like:
    // if the user sells something then they probably don't need it, so there's no demand, so cost goes down, amount goes up
    // if the user doesn't sell something, they probably need it, so have to pay more, so cost goes up, so amount goes down
    //if (curCiv.trader.userTraded) {
    //    curCiv[materialId].tradeAmount += Math.round(curCiv[materialId].tradeAmount / 10);
    //}
    //else {
    //    if (Math.random() < 0.5) {
    //        curCiv[materialId].tradeAmount -= Math.round(Math.random() * curCiv[materialId].tradeAmount / 10);
    //    }
    //    else {
    //        curCiv[materialId].tradeAmount += Math.round(Math.random() * curCiv[materialId].tradeAmount / 10);
    //    }
    //}
    // far too complicated. simply change to 10% whatever was requested
    curCiv[materialId].tradeAmount = Math.floor(curCiv.trader.requested / 10);
    // don't offer less than base amount
    curCiv[materialId].tradeAmount = Math.max(civData[materialId].baseTradeAmount, curCiv[materialId].tradeAmount);

    updateTradeButton(materialId, curCiv[materialId].tradeAmount);
}