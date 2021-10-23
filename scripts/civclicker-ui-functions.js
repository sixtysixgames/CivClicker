"use strict";
//========== UI functions

// Called when user switches between the various panes on the left hand side of the interface
// Returns the target pane element.
function paneSelect(control) {
    var i, oldTarget;
    //alert("hello");

    // Identify the target pane to be activated, and the currently active
    // selector tab(s).
    var newTarget = dataset(control, "target");
    var selectors = ui.find("#selectors");
    if (!selectors) {
        console.log("No selectors found");
        sysLog("No selectors found");
        return null;
    }
    var curSelects = selectors.getElementsByClassName("selected");

    // Deselect the old panels.
    for (i = 0; i < curSelects.length; ++i) {
        oldTarget = dataset(curSelects[i], "target");
        if (oldTarget == newTarget) { continue; }
        document.getElementById(oldTarget).classList.remove("selected");
        curSelects[i].classList.remove("selected");
    }

    // Select the new panel.
    control.classList.add("selected");
    var targetElem = document.getElementById(newTarget);
    if (targetElem) { targetElem.classList.add("selected"); }
    return targetElem;
}

function versionAlert() {
    console.log("New Version Available");
    ui.find("#versionAlert").style.display = "inline";
}

function prettify(input) {
    //xxx TODO: Add appropriate format options
    return (settings.delimiters) ? Number(input).toLocaleString() : input.toString();
}


function setAutosave(value) {
    if (value !== undefined) { settings.autosave = value; }
    ui.find("#toggleAutosave").checked = settings.autosave;
}
function onToggleAutosave(control) { return setAutosave(control.checked); }

function setCustomQuantities(value) {
    var i;
    var elems;
    var curPop = population.current;
    var totLand = getLandTotals().lands;

    if (value !== undefined) { settings.customIncr = value; }
    ui.find("#toggleCustomQuantities").checked = settings.customIncr;

    ui.show("#customJobQuantity", settings.customIncr);
    ui.show("#customPartyQuantity", settings.customIncr);
    ui.show("#customBuildQuantity", settings.customIncr);
    ui.show("#customSpawnQuantity", settings.customIncr);

    elems = document.getElementsByClassName("unit10");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], !settings.customIncr && (curPop >= 10));
    }

    elems = document.getElementsByClassName("unit100");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], !settings.customIncr && (curPop >= 100));
    }

    elems = document.getElementsByClassName("unit1000");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], !settings.customIncr && (curPop >= 1000));
    }

    elems = document.getElementsByClassName("unit10000");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], !settings.customIncr && (curPop >= 10000));
    }

    elems = document.getElementsByClassName("unit100000");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], !settings.customIncr && (curPop >= 100000));
    }

    elems = document.getElementsByClassName("unitInfinity");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], !settings.customIncr && (curPop >= 1000));
    }

    //totLand
    elems = document.getElementsByClassName("building10");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], !settings.customIncr && (totLand >= 100));
    }

    elems = document.getElementsByClassName("building100");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], !settings.customIncr && (totLand >= 1000));
    }

    elems = document.getElementsByClassName("building1000");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], !settings.customIncr && (totLand >= 10000));
    }

    elems = document.getElementsByClassName("building10000");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], !settings.customIncr && (totLand >= 100000));
    }

    elems = document.getElementsByClassName("building100000");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], !settings.customIncr && (totLand >= 1000000));
    }

    elems = document.getElementsByClassName("buildingInfinity");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], !settings.customIncr && (totLand >= 1000));
    }

    elems = document.getElementsByClassName("buycustom");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], settings.customIncr);
    }
}

function onToggleCustomQuantities(control) {
    return setCustomQuantities(control.checked);
}

// Toggles the display of the .notes class
function setNotes(value) {
    if (value !== undefined) { settings.notes = value; }
    ui.find("#toggleNotes").checked = settings.notes;

    var i;
    var elems = document.getElementsByClassName("note");
    for (i = 0; i < elems.length; ++i) {
        ui.show(elems[i], settings.notes);
    }
}

function onToggleNotes(control) {
    return setNotes(control.checked);
}

// value is the desired change in 0.1em units.
function textSize(value) {
    if (value !== undefined) { settings.fontSize += 0.1 * value; }
    ui.find("#smallerText").disabled = (settings.fontSize <= 0.5);

    //xxx Should this be applied to the document instead of the body?
    ui.body.style.fontSize = settings.fontSize + "em";
}

function setShadow(value) {
    if (value !== undefined) { settings.textShadow = value; }
    ui.find("#toggleShadow").checked = settings.textShadow;
    var shadowStyle = "3px 0 0 #fff, -3px 0 0 #fff, 0 3px 0 #fff, 0 -3px 0 #fff"
        + ", 2px 2px 0 #fff, -2px -2px 0 #fff, 2px -2px 0 #fff, -2px 2px 0 #fff";
    ui.body.style.textShadow = settings.textShadow ? shadowStyle : "none";
}
function onToggleShadow(control) {
    return setShadow(control.checked);
}

// Does nothing yet, will probably toggle display for "icon" and "word" classes 
// as that's probably the simplest way to do this.
function setIcons(value) {
    if (value !== undefined) { settings.useIcons = value; }
    ui.find("#toggleIcons").checked = settings.useIcons;

    var i;
    var elems = document.getElementsByClassName("icon");
    for (i = 0; i < elems.length; ++i) {
        // Worksafe implies no icons.
        elems[i].style.visibility = (settings.useIcons && !settings.worksafe) ? "visible" : "hidden";
    }
}
function onToggleIcons(control) {
    return setIcons(control.checked);
}

function setDelimiters(value) {
    if (value !== undefined) { settings.delimiters = value; }
    ui.find("#toggleDelimiters").checked = settings.delimiters;
    updateResourceTotals();
}
function onToggleDelimiters(control) {
    return setDelimiters(control.checked);
}

function setWorksafe(value) {
    if (value !== undefined) { settings.worksafe = value; }
    ui.find("#toggleWorksafe").checked = settings.worksafe;

    //xxx Should this be applied to the document instead of the body?
    if (settings.worksafe) {
        ui.body.classList.remove("hasBackground");
    } else {
        ui.body.classList.add("hasBackground");
    }

    setIcons(); // Worksafe overrides icon settings.
}
function onToggleWorksafe(control) {
    return setWorksafe(control.checked);
}
