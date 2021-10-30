"use strict";

function createUIComponents() {
    return {
        raidRow: (elem) => {
            return `
            <div>
                <button class='raid' data-action='raid' data-target='${elem.id}' disabled='disabled'>
                    Raid ${elem.name}
                </button>
                <button class='raid-mult mult-10' data-action='raid-mult' data-value='10' data-target='${elem.id}' disabled='disabled'>x10</button>
                <button class='raid-mult mult-100' data-action='raid-mult' data-value='100' data-target='${elem.id}' disabled='disabled'>x100</button>
                <button class='raid-mult mult-inf' data-action='raid-mult' data-value='inf' data-target='${elem.id}' disabled='disabled'>🔁</button>
            </div>
            `;
        }
    };
}

var UIComponents = createUIComponents();

// Pass this the item definition object.
// Or pass nothing, to create a blank row.
function getResourceRowText(purchaseObj) {
    // Make sure to update this if the number of columns changes.
    if (!purchaseObj) { return "<tr class='purchaseRow'><td colspan='3'/>&nbsp;</tr>"; }

    let objId = purchaseObj.id;
    let objName = purchaseObj.getQtyName(0);
    let s = (
        '<tr id="' + objId + 'Row" class="purchaseRow" data-target="' + objId + '">'
        + '<td>'
        + '<img src="images/' + objId + '.png" class="icon icon-lg" alt="' + objName + '"/>'
        + '<button data-action="increment">' + purchaseObj.verb + '</button>'
        + '<label>' + objName + ':</label>'
        + '</td>'
        + '<td class="number" ><span class="mainNumber" data-action="display">.</span>&nbsp;/&nbsp;<span class="maxNumber" id="max' + objId + '">...</span></td>'
        + '<td class="number net"><span data-action="displayNet">..</span><span class="perSecond">/s</span></td>'
        + '</tr>'
    );
    return s;
}

function getPurchaseCellText(purchaseObj, qty, inTable) {
    if (inTable === undefined) { inTable = true; }
    // Internal utility functions.
    function sgnchr(x) { return (x > 0) ? "+" : (x < 0) ? "&minus;" : ""; }
    //xxx Hack: Special formatting for booleans, Infinity and 1k, 10k.
    function infchr(x) { return (x == Infinity) ? "&infin;" : (x == 1000) ? "1k" : (x == 10000) ? "10k" : (x == 100000) ? "100k" : x; }
    function fmtbool(x) {
        let neg = (sgn(x) < 0);
        return (neg ? "(" : "") + purchaseObj.getQtyName(0) + (neg ? ")" : "");
    }
    function fmtqty(x) { return (typeof x == "boolean") ? fmtbool(x) : sgnchr(sgn(x)) + infchr(abs(x)); }
    function allowPurchase() {
        if (!qty) { return false; } // No-op

        // Can't buy/sell items not controlled by player
        if (purchaseObj.alignment && (purchaseObj.alignment != alignmentType.player)) { return false; }

        // Quantities > 1 are meaningless for boolean items.
        if ((typeof purchaseObj.initOwned == "boolean") && (abs(qty) > 1)) { return false; }

        // Don't buy/sell unbuyable/unsalable items.
        if ((sgn(qty) > 0) && (purchaseObj.require === undefined)) { return false; }
        if ((sgn(qty) < 0) && (!purchaseObj.salable)) { return false; }

        //xxx Right now, variable-cost items can't be sold, and are bought one-at-a-time.
        if ((qty != 1) && purchaseObj.hasVariableCost()) { return false; }

        return true;
    }

    let tagName = inTable ? "td" : "span";
    let className = (abs(qty) == "custom") ? "buy" : purchaseObj.type;  // 'custom' buttons all use the same class.

    let s = "<" + tagName + " class='" + className + abs(qty) + "' data-quantity='" + qty + "' >";
    if (allowPurchase()) {
        s += "<button class='x" + abs(qty) + "' data-action='purchase'" + " disabled='disabled'>" + fmtqty(qty) + "</button>";
    }
    s += "</" + tagName + ">";
    return s;
}

// Pass this the item definition object.
// Or pass nothing, to create a blank row.
function getPurchaseRowText(purchaseObj) {
    // Make sure to update this if the number of columns changes.
    if (!purchaseObj) { return "<tr class='purchaseRow'><td colspan='17'/>&nbsp;</tr>"; }
    let showSellButtons = true;

    if (purchaseObj.type === civObjType.building) {
        // we don't sell buildings, yet
        showSellButtons = false;
    }
    let objId = purchaseObj.id;
    let s = "<tr id='" + objId + "Row' class='purchaseRow' data-target='" + purchaseObj.id + "'>";

    if (showSellButtons) {
        [-Infinity, "-custom", -100000, -10000, -1000, -100, -10, -1]
            .forEach(function (elem) {
                s += getPurchaseCellText(purchaseObj, elem);
            });
    }

    let flag = "";
    if (purchaseObj.alignment == alignmentType.enemy) {flag = " enemy";}
    else if (purchaseObj.id == unitType.totalSick ) {flag = " sick";}
    s += "<td class='itemname" + flag + "'>" + purchaseObj.getQtyName(0) + ": </td>";

    let action = (isValid(population[objId])) ? "display_pop" : "display"; //xxx Hack
    s += "<td class='number'><span data-action='" + action + "'>0</span></td>";

    // Don't allow Infinite (max) purchase on things we can't sell back. 
    [1, 10, 100, 1000, 10000, 100000, "custom", (purchaseObj.salable) ? Infinity : 0]
        .forEach(function (elem) { s += getPurchaseCellText(purchaseObj, elem); });

    s += "<td>" + getCostNote(purchaseObj) + "</td>";
    s += "</tr>";

    return s;
}

function addUITable(civObjs, groupElemName) {
    let s = "";
    civObjs.forEach(function (elem) {
        s += elem.type == civObjType.resource ? getResourceRowText(elem)
            : elem.type == civObjType.upgrade ? getUpgradeRowText(elem)
                : getPurchaseRowText(elem);
    });
    let groupElem = document.getElementById(groupElemName);
    groupElem.innerHTML += s;
    groupElem.onmousedown = onBulkEvent;
    return groupElem;
}

// We have a separate row generation function for upgrades, because their
// layout is differs greatly from buildings/units:
//  - Upgrades are boolean, so they don't need multi-purchase buttons.
//  - Upgrades don't need quantity labels, and put the name in the button.
//  - Upgrades are sometimes generated in a table with <tr>, but sometimes
//    outside of one with <span>.
function getUpgradeRowText(upgradeObj, inTable) {
    if (inTable === undefined) { inTable = true; }
    let cellTagName = inTable ? "td" : "span";
    let rowTagName = inTable ? "tr" : "span";
    // Make sure to update this if the number of columns changes.
    if (!upgradeObj) { return inTable ? "<" + rowTagName + " class='purchaseRow'><td colspan='2'/>&nbsp;</" + rowTagName + ">" : ""; }

    let s = "<" + rowTagName + " id='" + upgradeObj.id + "Row' class='purchaseRow'";
    s += " data-target='" + upgradeObj.id + "'>";
    s += getPurchaseCellText(upgradeObj, true, inTable);
    s += "<" + cellTagName + ">" + getCostNote(upgradeObj) + "</" + cellTagName + ">";
    if (!inTable) { s += "<br />"; }
    s += "</" + rowTagName + ">";
    return s;
}

function getPantheonUpgradeRowText(upgradeObj) {
    if (!upgradeObj) { return ""; }

    let s = "<tr id='" + upgradeObj.id + "Row' class='purchaseRow'>";
    // Don't include devotion if it isn't valid.
    //xxx Should write a chained dereference eval
    s += "<td class='devcost'>";
    s += ((isValid(upgradeObj.prereqs) && isValid(upgradeObj.prereqs.devotion))
        ? (upgradeObj.prereqs.devotion + "d&nbsp;") : "") + "</td>";
    //xxx The 'fooRow' id is added to make altars work, but should be redesigned.
    s += "<td class='" + upgradeObj.type + "true'><button id='" + upgradeObj.id + "' class='xtrue'";
    s += " data-action='purchase' data-quantity='true' data-target=" + upgradeObj.id;
    s += " disabled='disabled' onmousedown=\"";
    // The event handler can take three forms, depending on whether this is
    // an altar, a prayer, or a pantheon upgrade.
    s += ((upgradeObj.subType == subTypes.prayer) ? (upgradeObj.id + "()")
        : ("onPurchase(this)"));
    s += "\">" + upgradeObj.getQtyName() + "</button>";
    s += (isValid(upgradeObj.extraText) ? upgradeObj.extraText : "") + "</td>";
    s += "<td>" + getCostNote(upgradeObj) + "</td>";
    s += "</tr>";

    return s;
}

// Returns the new element
function setPantheonUpgradeRowText(upgradeObj) {
    if (!upgradeObj) { return null; }
    let elem = document.getElementById(upgradeObj.id + "Row");
    if (!elem) { return null; }

    elem.outerHTML = getPantheonUpgradeRowText(upgradeObj); // Replaces elem
    return document.getElementById(upgradeObj.id + "Row"); // Return replaced element
}

// Dynamically create the upgrade purchase buttons.
function addUpgradeRows() {
    // Fill in any pre-existing stubs.
    upgradeData.forEach(function (elem) {
        if (elem.subType == subTypes.upgrade) { return; } // Did these in getUpgradeRowText.
        if (elem.subType == subTypes.pantheon) { setPantheonUpgradeRowText(elem); }
        else { // One of the 'atypical' upgrades not displayed in the main upgrade list.
            let stubElem = document.getElementById(elem.id + "Row");
            if (!stubElem) {
                console.log("Missing UI element for " + elem.id);
                sysLog("Missing UI element for " + elem.id);
                return;
            }
            stubElem.outerHTML = getUpgradeRowText(elem, false); // Replaces stubElem
            stubElem = document.getElementById(elem.id + "Row"); // Get stubElem again.
            stubElem.onmousedown = onBulkEvent;
        }
    });

    // Altars
    buildingData.forEach(function (elem) { if (elem.subType == subTypes.altar) { setPantheonUpgradeRowText(elem); } });

    // Deity granted powers
    powerData.forEach(function (elem) { if (elem.subType == subTypes.prayer) { setPantheonUpgradeRowText(elem); } });

    // Dynamically create two lists for purchased upgrades.
    // One for regular upgrades, one for pantheon upgrades.
    let text = "", standardUpgStr = "", pantheonUpgStr = "";

    upgradeData.forEach(function (upgradeObj) {
        text = "<span id='P" + upgradeObj.id + "' class='Pupgrade'>"
            + "<strong>" + upgradeObj.getQtyName() + "</strong>"
            + " &ndash; " + upgradeObj.effectText + "<br/></span>";
        if (upgradeObj.subType == subTypes.pantheon) { pantheonUpgStr += text; }
        else { standardUpgStr += text; }
    });

    ui.find("#purchasedUpgrades").innerHTML += standardUpgStr;
    ui.find("#purchasedPantheon").innerHTML = pantheonUpgStr;
}
