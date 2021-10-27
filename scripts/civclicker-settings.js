"use strict";

function setDefaultSettings() {
    // Here, we ensure that UI is properly configured for our settings.
    // Calling these with no parameter makes them update the UI for the current values.
    setAutosave();
    setCustomQuantities();
    textSize(0);
    setDelimiters();
    setShadow();
    setNotes();
    setWorksafe();
    setIcons();
}

// Game infrastructure functions
function handleStorageError(err) {
    var msg;
    if ((err instanceof DOMException) && (err.code == DOMException.SECURITY_ERR)) { msg = "Browser security settings blocked access to local storage."; }
    else { msg = "Cannot access localStorage - browser may not support localStorage, or storage may be corrupt"; }
    console.error(err.toString());
    console.error(msg);
}

// Load in saved data
function load(loadType) {
    //define load variables
    var loadVar = {},
        loadVar2 = {},
        settingsVar = {};
    var saveVersion = new VersionData(1, 0, 0, "legacy");

    if (loadType === "cookie") {
        //check for cookies
        if (read_cookie(saveTag) && read_cookie(saveTag2)) {
            //set variables to load from
            loadVar = read_cookie(saveTag);
            loadVar2 = read_cookie(saveTag2);
            loadVar = mergeObj(loadVar, loadVar2);
            loadVar2 = undefined;
            //notify user
            sysLog("Loaded saved game from cookie");
            sysLog("Save system switching to localStorage.");
        } else {
            console.log("Unable to find cookie");
            sysLog("Unable to find cookie");
            return false;
        }
    }

    if (loadType === "localStorage") {
        //check for local storage
        var string1;
        var string2;
        var settingsString;
        try {
            settingsString = localStorage.getItem(saveSettingsTag);
            string1 = localStorage.getItem(saveTag);
            string2 = localStorage.getItem(saveTag2);

            if (!string1) {
                console.log("Unable to find variables in localStorage. Attempting to load cookie.");
                sysLog("Unable to find variables in localStorage. Attempting to load cookie.");
                return load("cookie");
            }
        } catch (err) {
            if (!string1) { // It could be fine if string2 or settingsString fail.
                handleStorageError(err);
                return load("cookie");
            }
        }

        // Try to parse the strings
        if (string1) { try { loadVar = JSON.parse(string1); } catch (ignore) { sysLog("Failed to parse string1");} }
        if (string2) { try { loadVar2 = JSON.parse(string2); } catch (ignore) { sysLog("Failed to parse string2");} }
        if (settingsString) { try { settingsVar = JSON.parse(settingsString); } catch (ignore) { sysLog("Failed to parse settingsString");} }

        // If there's a second string (old save game format), merge it in.
        if (loadVar2) { loadVar = mergeObj(loadVar, loadVar2); loadVar2 = undefined; }

        if (!loadVar) {
            console.log("Unable to parse variables in localStorage. Attempting to load cookie.");
            sysLog("Unable to parse variables in localStorage. Attempting to load cookie.");
            return load("cookie");
        }

        //notify user
        sysLog("Loaded saved game from localStorage");
    }

    if (loadType === "import") {
        loadVar = importByInput(ui.find("#impexpField"));
    }

    saveVersion = mergeObj(saveVersion, loadVar.versionData);
    if (saveVersion.toNumber() > versionData.toNumber()) {
        // Refuse to load saved games from future versions.
        var alertStr = "Cannot load; saved game version " + saveVersion + " is newer than game version " + versionData;
        console.log(alertStr);
        sysLog(alertStr);
        alert(alertStr);
        return false;
    }
    if (saveVersion.toNumber() < versionData.toNumber()) {
        // Migrate saved game data from older versions.
        var settingsVarReturn = { val: {} };
        migrateGameData(loadVar, settingsVarReturn);
        settingsVar = settingsVarReturn.val;

        // Merge the loaded data into our own, in case we've added fields.
        mergeObj(curCiv, loadVar.curCiv);
    } else {
        curCiv = loadVar.curCiv; // No need to merge if the versions match; this is quicker.
    }

    var lsgv = "Loaded save game version " + saveVersion.major + "." + saveVersion.minor + "." + saveVersion.sub + "(" + saveVersion.mod + ") via";
    console.log(lsgv, loadType);
    sysLog(lsgv);

    if (isValid(settingsVar)) { settings = mergeObj(settings, settingsVar); }

    adjustMorale(0);
    updateRequirements(civData.mill);
    updateRequirements(civData.fortification);
    updateRequirements(civData.battleAltar);
    updateRequirements(civData.fieldsAltar);
    updateRequirements(civData.underworldAltar);
    updateRequirements(civData.catAltar);
    updateResourceTotals();
    updateJobButtons();
    makeDeitiesTables();
    updateDeity();
    updateUpgrades();
    updateTargets();
    updateDevotion();
    updatePartyButtons();
    updateMorale();
    updateWonder();
    tallyWonderCount();
    ui.find("#clicks").innerHTML = prettify(Math.round(curCiv.resourceClicks));
    ui.find("#civName").innerHTML = curCiv.civName;
    ui.find("#rulerName").innerHTML = curCiv.rulerName;
    ui.find("#wonderNameP").innerHTML = curCiv.curWonder.name;
    ui.find("#wonderNameC").innerHTML = curCiv.curWonder.name;

    updateTradeButtons();

    return true;
}

function importByInput(elt) {
    //take the import string, decompress and parse it
    var compressed = elt.value;
    var decompressed = LZString.decompressFromBase64(compressed);
    var revived = JSON.parse(decompressed);
    //set variables to load from
    var loadVar = revived[0];
    var loadVar2;
    if (isValid(revived[1])) {
        loadVar2 = revived[1];
        // If there's a second string (old save game format), merge it in.
        if (loadVar2) { loadVar = mergeObj(loadVar, loadVar2); loadVar2 = undefined; }
    }
    if (!loadVar) {
        console.log("Unable to parse saved game string.");
        sysLog("Unable to parse saved game string.");
        return false;
    }

    //notify user
    sysLog("Imported saved game");
    //close import/export dialog
    //impexp();	
    return loadVar;
}

// Create objects and populate them with the variables, these will be stored in HTML5 localStorage.
// Cookie-based saves are no longer supported.
function save(savetype) {
    var xmlhttp;

    var saveVar = {
        versionData: versionData, // Version information header
        curCiv: curCiv // Game data
    };

    var settingsVar = settings; // UI Settings are saved separately.

    // Handle export
    if (savetype == saveTypes.export) {
        var savestring = "[" + JSON.stringify(saveVar) + "]";
        var compressed = LZString.compressToBase64(savestring);
        console.log("Compressed save from " + savestring.length + " to " + compressed.length + " characters");
        ui.find("#impexpField").value = compressed;
        sysLog("Exported game to text");
        return true;
    }

    //set localstorage
    try {
        // Delete the old cookie-based save to avoid mismatched saves
        deleteCookie(saveTag);
        deleteCookie(saveTag2);

        localStorage.setItem(saveTag, JSON.stringify(saveVar));

        // We always save the game settings.
        localStorage.setItem(saveSettingsTag, JSON.stringify(settingsVar));

        //Update console for debugging, also the player depending on the type of save (manual/auto)
        if (savetype == saveTypes.auto) {
            console.log("Autosave");
            sysLog("Autosaved");
        } else if (savetype == saveTypes.manual) {
            alert("Game Saved");
            console.log("Manual Save");
            sysLog("Saved game");
        }
    } catch (err) {
        handleStorageError(err);

        if (savetype == saveTypes.auto) {
            console.log("Autosave Failed");
            sysLog("Autosave Failed");
        } else if (savetype == saveTypes.manual) {
            alert("Save Failed!");
            console.log("Save Failed");
            sysLog("Save Failed");
        }
        return false;
    }

    return true;
}

function deleteSave() {
    //Deletes the current savegame by setting the game's cookies to expire in the past.
    if (!confirm("All progress and achievements will be lost.\nReally delete save?")) { return; } //Check the player really wanted to do that.

    try {
        deleteCookie(saveTag);
        deleteCookie(saveTag2);
        localStorage.removeItem(saveTag);
        localStorage.removeItem(saveTag2);
        localStorage.removeItem(saveSettingsTag);
        sysLog("Save Deleted");
        if (confirm("Save Deleted. Refresh page to start over?")) {
            window.location.reload();
        }
    } catch (err) {
        handleStorageError(err);
        alert("Save Deletion Failed!");
    }
}

function renameCiv(newName) {
    //Prompts player, uses result as new civName
    while (!newName) {
        newName = prompt("Please name your civilization", (newName || curCiv.civName || "Tribe"));
        if ((newName === null) && (curCiv.civName)) { return; } // Cancelled
    }

    curCiv.civName = newName;
    ui.find("#civName").innerHTML = curCiv.civName;
}

function renameRuler(newName) {
    if (curCiv.rulerName == "Cheater") { return; } // Reputations suck, don't they?
    //Prompts player, uses result as rulerName
    while (!newName || haveDeity(newName) !== false) {
        newName = prompt("What is your name?", (newName || curCiv.rulerName || "Chief"));
        if ((newName === null) && (curCiv.rulerName)) { return; } // Cancelled
        if (haveDeity(newName) !== false) {
            alert("That would be a blasphemy against the deity " + newName + ".");
            newName = "";
        }
    }

    curCiv.rulerName = newName;

    ui.find("#rulerName").innerHTML = curCiv.rulerName;
}

// Looks to see if the deity already exists.  If it does, that deity
// is moved to the first slot, overwriting the current entry, and the
// player's domain is automatically assigned to match (for free).
function renameDeity(newName) {
    var i = false;
    while (!newName) {
        // Default to ruler's name.  Hey, despots tend to have big egos.
        newName = prompt("Whom do your people worship?", (newName || curCiv.deities[0].name || curCiv.rulerName));
        if ((newName === null) && (curCiv.deities[0].name)) { return; } // Cancelled

        // If haveDeity returns a number > 0, the name is used by a legacy deity.
        // This is only allowed when naming (not renaming) the active deity.
        i = haveDeity(newName);
        if (i && curCiv.deities[0].name) {
            alert("That deity already exists.");
            newName = "";
        }
    }

    // Rename the active deity.
    curCiv.deities[0].name = newName;

    // If the name matches a legacy deity, make the legacy deity the active deity.
    if (i) {
        curCiv.deities[0] = curCiv.deities[i]; // Copy to front position
        curCiv.deities.splice(i, 1); // Remove from old position
        if (getCurDeityDomain()) { // Does deity have a domain?
            selectDeity(getCurDeityDomain(), true); // Automatically pick that domain.
        }
    }

    makeDeitiesTables();
}

function reset() {
    console.log("Reset");
    //Resets the game, keeping some values but resetting most back to their initial values.
    var msg = "Really reset? You will keep past deities and wonders (and cats)"; //Check player really wanted to do that.
    if (!confirm(msg)) { return false; } // declined

    // Let each data subpoint re-init.
    civData.forEach(function (elem) { if (elem instanceof CivObj) { elem.reset(); } });

    curCiv.zombie.owned = 0;
    curCiv.grave.owned = 0;
    curCiv.enemySlain.owned = 0;
    curCiv.resourceClicks = 0; // For NeverClick
    curCiv.attackCounter = 0; // How long since last attack?
    curCiv.morale = { mod: 1.0, efficiency: 1.0 };

    // If our current deity is powerless, delete it.
    if (!curCiv.deities[0].maxDev) {
        curCiv.deities.shift();
    }
    // Insert space for a fresh deity.
    curCiv.deities.unshift({ name: "", domain: "", maxDev: 0 });

    population = {
        current: 0,
        limit: 0,
        healthy: 0,
        totalSick: 0
    };

    resetRaiding();
    curCiv.raid.targetMax = civSizes[0].id;

    curCiv.trader.materialId = "";
    curCiv.trader.requested = 0;
    curCiv.trader.timer = 0;
    curCiv.trader.counter = 0; // How long since last trader?
    curCiv.trader.userTraded = false;

    curCiv.curWonder.name = "";
    curCiv.curWonder.stage = 0;
    curCiv.curWonder.rushed = false;
    curCiv.curWonder.progress = 0;

    resetTradeAmounts();

    updateAfterReset();
    sysLog("Game Reset"); //Inform player.

    renameCiv();
    renameRuler();

    return true;
}

function resetTradeAmounts() {
    curCiv.food.tradeAmount = civData.food.initTradeAmount;
    curCiv.wood.tradeAmount = civData.wood.initTradeAmount;
    curCiv.stone.tradeAmount = civData.stone.initTradeAmount;
    curCiv.skins.tradeAmount = civData.skins.initTradeAmount;
    curCiv.herbs.tradeAmount = civData.herbs.initTradeAmount;
    curCiv.ore.tradeAmount = civData.ore.initTradeAmount;
    curCiv.leather.tradeAmount = civData.leather.initTradeAmount;
    curCiv.potions.tradeAmount = civData.potions.initTradeAmount;
    curCiv.metal.tradeAmount = civData.metal.initTradeAmount;
}

function setInitTradeAmount() {
    if (!isValid(curCiv.food.tradeAmount)) {
        curCiv.food.tradeAmount = civData.food.initTradeAmount;
    }
    if (!isValid(curCiv.wood.tradeAmount)) {
        curCiv.wood.tradeAmount = civData.wood.initTradeAmount;
    }
    if (!isValid(curCiv.stone.tradeAmount)) {
        curCiv.stone.tradeAmount = civData.stone.initTradeAmount;
    }
    if (!isValid(curCiv.skins.tradeAmount)) {
        curCiv.skins.tradeAmount = civData.skins.initTradeAmount;
    }
    if (!isValid(curCiv.herbs.tradeAmount)) {
        curCiv.herbs.tradeAmount = civData.herbs.initTradeAmount;
    }
    if (!isValid(curCiv.ore.tradeAmount)) {
        curCiv.ore.tradeAmount = civData.ore.initTradeAmount;
    }
    if (!isValid(curCiv.leather.tradeAmount)) {
        curCiv.leather.tradeAmount = civData.leather.initTradeAmount;
    }
    if (!isValid(curCiv.potions.tradeAmount)) {
        curCiv.potions.tradeAmount = civData.potions.initTradeAmount;
    }
    if (!isValid(curCiv.metal.tradeAmount)) {
        curCiv.metal.tradeAmount = civData.metal.initTradeAmount;
    }
}

function tickAutosave() {
    if (settings.autosave && (++settings.autosaveCounter >= settings.autosaveTime)) {
        settings.autosaveCounter = 0;
        // If autosave fails, disable it.
        if (!save(saveTypes.auto)) { settings.autosave = false; }
    }
}
