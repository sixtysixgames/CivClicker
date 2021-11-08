"use strict";
//========== UI functions

// Called when user switches between the various panes on the left hand side of the interface
// Returns the target pane element.
function paneSelect(control) {
    let oldTarget;

    // Identify the target pane to be activated, and the currently active
    // selector tab(s).
    let newTarget = dataset(control, "target");
    let selectors = ui.find("#selectors");
    if (!selectors) {
        console.log("No selectors found");
        sysLog("No selectors found");
        return null;
    }
    let curSelects = selectors.getElementsByClassName("selected");

    // Deselect the old panels.
    for (let i = 0; i < curSelects.length; ++i) {
        oldTarget = dataset(curSelects[i], "target");
        if (oldTarget == newTarget) { continue; }
        document.getElementById(oldTarget).classList.remove("selected");
        curSelects[i].classList.remove("selected");
    }

    // Select the new panel.
    control.classList.add("selected");
    let targetElem = document.getElementById(newTarget);
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
    let i;
    let elems;
    let curPop = population.current;
    let totLand = getLandTotals().lands;

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

    let elems = document.getElementsByClassName("note");
    for (let i = 0; i < elems.length; ++i) {
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
    let shadowStyle = "3px 0 0 #fff, -3px 0 0 #fff, 0 3px 0 #fff, 0 -3px 0 #fff"
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

    let elems = document.getElementsByClassName("icon");
    for (let i = 0; i < elems.length; ++i) {
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

// Generate two HTML <span> texts to display an item's cost and effect note.
function getCostNote(civObj) {
    // Only add a ":" if both items are present.
    let reqText = getReqText(civObj.require);
    let effectText = (isValid(civObj.effectText)) ? civObj.effectText : "";
    let separator = (reqText && effectText) ? ": " : "";

    return "<span id='" + civObj.id + "Cost' class='cost'>" + reqText + "</span>"
        + "<span id='" + civObj.id + "Note' class='note'>" + separator + civObj.effectText + "</span>";
}

// TODO: we should probably pass the relevant table to a single function
// even better would be to use a div with a scrollbars so that no messages are lost
function gameLog(message) {
    //get the current date, extract the current time in HH.MM format
    //xxx It would be nice to use Date.getLocaleTimeString(locale,options) here, but most browsers don't allow the options yet.
    //let d = new Date();
    // todo: output some sort of in-game date based on how long played
    //let curTime = d.getHours() + ":" + ((d.getMinutes() < 10) ? "0" : "") + d.getMinutes();
    //let curTime = getGameDateTime();
    let curTime = getPlayingTimeShort();
    message = sentenceCase(message);

    //Check to see if the last message was the same as this one, if so just increment the (xNumber) value
    if (ui.find("#logL").innerHTML != message) {
        app.logRepeat = 0; //Reset the (xNumber) value

        //Go through all the logs in order, moving them down one and successively overwriting them.
        let i = 30; // Number of lines of log to keep. See the logTable in index.html
        while (--i > 1) { ui.find("#log" + i).innerHTML = ui.find("#log" + (i - 1)).innerHTML; }
        //Since ids need to be unique, log1 strips the ids from the log0 elements when copying the contents.
        ui.find("#log1").innerHTML = (
            "<td>" + ui.find("#logT").innerHTML
            + "</td><td>" + ui.find("#logL").innerHTML
            + "</td><td>" + ui.find("#logR").innerHTML + "</td>"
        );
    }
    // Updates most recent line with new time, message, and xNumber.
    let s = "<td id='logT'>" + curTime + "</td><td id='logL'>" + message + "</td><td id='logR'>";
    if (++app.logRepeat > 1) { s += "(x" + app.logRepeat + ")"; } // Optional (xNumber)
    s += "</td>";
    ui.find("#log0").innerHTML = s;
}

//Not strictly a debug function so much as it is letting the user know when 
//something happens without needing to watch the console.
function debug(message) {
    sysLog(message); // simply call other method.  Makes it easier to distinguish find when done debugging
}
// a copy of the gameLog function above
// outputs to the Event Log tab
function sysLog(message) {
    //get the current date, extract the current time in HH.MM format
    //xxx It would be nice to use Date.getLocaleTimeString(locale,options) here, but most browsers don't allow the options yet.
    let d = new Date();
    let curTime = d.getHours() + ":" + ((d.getMinutes() < 10) ? "0" : "") + d.getMinutes();

    console.log(message);

    //Check to see if the last message was the same as this one, if so just increment the (xNumber) value
    if (ui.find("#syslogL").innerHTML != message) {
        app.sysLogRepeat = 0; //Reset the (xNumber) value

        //Go through all the logs in order, moving them down one and successively overwriting them.
        let i = 20; // Number of lines of log to keep.
        while (--i > 1) { ui.find("#syslog" + i).innerHTML = ui.find("#syslog" + (i - 1)).innerHTML; }
        //Since ids need to be unique, log1 strips the ids from the log0 elements when copying the contents.
        ui.find("#syslog1").innerHTML = (
            "<td>" + ui.find("#syslogT").innerHTML
            + "</td><td>" + ui.find("#syslogL").innerHTML
            + "</td><td>" + ui.find("#syslogR").innerHTML + "</td>"
        );
    }
    // Updates most recent line with new time, message, and xNumber.
    let s = "<td id='syslogT'>" + curTime + "</td><td id='syslogL'>" + message + "</td><td id='syslogR'>";
    if (++app.sysLogRepeat > 1) { s += "(x" + app.sysLogRepeat + ")"; } // Optional (xNumber)
    s += "</td>";
    ui.find("#syslog0").innerHTML = s;
}

function getCustomNumber(civObj) {
    if (!civObj || !civObj.customQtyId) { return undefined; }
    let elem = document.getElementById(civObj.customQtyId);
    if (!elem) { return undefined; }

    let num = Number(elem.value);

    // Check the above operations haven't returned NaN
    // Also don't allow negative increments.
    if (isNaN(num) || num < 0) {
        elem.style.background = "#f99"; //notify user that the input failed
        return 0;
    }

    num = Math.floor(num); // Round down

    elem.value = num; //reset fractional numbers, check nothing odd happened
    elem.style.background = "#fff";

    return num;
}

function sentenceCase(message) {
    // capitalize first letter
    if (!message || !isValid(message)) {
        return message;
    }
    return message.charAt(0).toUpperCase() + message.slice(1);
}
