"use strict";
/* global adjustMorale, Building, buildingType, civData, deityDomains, digGraves, getPietyLimitBonus, getStorehouseBonus, getStoreroomBonus, getWarehouseBonus, 
 population, subTypes, updateNote */

function getBuildingData() {
    let buildData = [
        new Building({
            id: buildingType.freeLand, name: "free land", plural: "free land",
            subType: subTypes.land,
            prereqs: undefined,  // Cannot be purchased.
            require: undefined,  // Cannot be purchased.
            vulnerable: false, // Cannot be stolen by looting
            initOwned: 100, // used to be 1000, let's make it more difficult
            effectText: "Conquer more from your neighbors"
        }),
        new Building({
            id: buildingType.tent, singular: "tent", plural: "tents",
            require: { wood: 2, skins: 2 },
            effectText: "+1 citizen"
        }),
        new Building({
            id: buildingType.hut, singular: "wooden hut", plural: "wooden huts",
            prereqs: { carpentry: true },
            require: { wood: 20, skins: 1 },
            effectText: "+3 citizens"
        }),
        new Building({
            id: buildingType.cottage, singular: "cottage", plural: "cottages",
            prereqs: { masonry: true },
            require: { wood: 10, stone: 30 },
            effectText: "+6 citizens"
        }),
        new Building({
            id: buildingType.house, singular: "house", plural: "houses",
            prereqs: { construction: true },
            require: { wood: 30, stone: 70 },
            get effectText() {
                let maxPop = 10 + 2 * (civData.slums.owned + civData.tenements.owned);
                return "+" + maxPop + " citizens";
            },
            set effectText(value) { return this.require; }, // Only here for JSLint.
            update: function () {
                updateNote(this.id, this.effectText);
            }
        }),
        new Building({
            id: buildingType.mansion, singular: "mansion", plural: "mansions",
            prereqs: { engineering: true },
            require: { wood: 500, stone: 500, leather: 100, metal: 100 },
            effectText: "+50 citizens"
        }),
        new Building({
            id: buildingType.palace, singular: "palace", plural: "palaces",
            prereqs: { architecture: true },
            require: { wood: 1000, stone: 1000, leather: 250, metal: 250, gold: 10 },
            effectText: "+150 citizens"
        }),
        new Building({
            id: buildingType.barn, singular: "barn", plural: "barns",
            prereqs: { carpentry: true },
            require: { wood: 100, stone: 10 },
            get effectText() {
                let fbonus = ((civData.granaries.owned ? 2 : 1) * 200);
                let sbonus = ((civData.storehouses.owned ? 2 : 1) * 100);
                return "+" + fbonus + " food storage; +" + sbonus + " skin storage";
            },
            set effectText(value) { return this.effectText; },
            update: function () {
                updateNote(this.id, this.effectText);
            }
        }),
        new Building({
            id: buildingType.woodstock, singular: "wood stockpile", plural: "wood stockpiles",
            prereqs: { carpentry: true },
            require: { wood: 100, stone: 10 },
            get effectText() {
                let wbonus = getWarehouseBonus();
                let hbonus = getStorehouseBonus();
                return "+" + wbonus + " wood storage; +" + hbonus + " herb storage";
            },
            set effectText(value) { return this.effectText; },
            update: function () {
                updateNote(this.id, this.effectText);
            }
        }),
        new Building({
            id: buildingType.stonestock, singular: "stone stockpile", plural: "stone stockpiles",
            prereqs: { carpentry: true },
            require: { wood: 100, stone: 10 },
            get effectText() {
                let sbonus = getWarehouseBonus();
                let obonus = getStorehouseBonus();
                return "+" + sbonus + " stone storage; +" + obonus + " ore storage";
            },
            set effectText(value) { return this.effectText; },
            update: function () {
                updateNote(this.id, this.effectText);
            }
        }),
        new Building({
            id: buildingType.tannery, singular: "tannery", plural: "tanneries",
            prereqs: { masonry: true },
            require: { wood: 30, stone: 70, skins: 5 },
            get effectText() {
                let bonus = getStoreroomBonus();
                return "allows 1 tanner; +" + bonus + " leather storage";
            },
            set effectText(value) { return this.effectText; },
            update: function () {
                updateNote(this.id, this.effectText);
            }
        }),
        new Building({
            id: buildingType.smithy, singular: "smithy", plural: "smithies",
            prereqs: { masonry: true },
            require: { wood: 30, stone: 70, ore: 5 },
            get effectText() {
                let bonus = getStoreroomBonus();
                return "allows 1 blacksmith; +" + bonus + " metal storage";
            },
            set effectText(value) { return this.effectText; },
            update: function () {
                updateNote(this.id, this.effectText);
            }
        }),
        new Building({
            id: buildingType.apothecary, singular: "apothecary", plural: "apothecaries",
            prereqs: { masonry: true },
            require: { wood: 30, stone: 70, herbs: 5 },
            get effectText() {
                let bonus = getStoreroomBonus();
                return "allows 1 healer; +" + bonus + " potion storage";
            },
            set effectText(value) { return this.effectText; },
            update: function () {
                updateNote(this.id, this.effectText);
            }
        }),
        new Building({
            id: buildingType.temple, singular: "temple", plural: "temples",
            prereqs: { masonry: true },
            require: { wood: 30, stone: 120, herbs: 10 },
            get effectText() {
                let bonus = 50 + getPietyLimitBonus();
                return "allows 1 cleric; +" + bonus + " piety limit";
            },
            set effectText(value) { return this.effectText; },
            update: function () {
                updateNote(this.id, this.effectText);
            },
            // If purchase was a temple and aesthetics has been activated, increase morale
            // If population is large, temples have less effect.
            onGain: function (num) {
                if (civData.aesthetics && civData.aesthetics.owned && num) {
                    adjustMorale(num * 25 / population.living);
                }
            }
        }),
        new Building({
            id: buildingType.barracks, name: "barracks",
            prereqs: { masonry: true },
            require: { food: 20, wood: 60, stone: 120, metal: 10 },
            effectText: "allows 10 soldiers"
        }),
        new Building({
            id: buildingType.stable, singular: "stable", plural: "stables",
            prereqs: { horseback: true },
            require: { food: 60, wood: 60, stone: 120, leather: 10 },
            effectText: "allows 10 cavalry"
        }),
        new Building({
            id: buildingType.graveyard, singular: "graveyard", plural: "graveyards",
            prereqs: { masonry: true },
            require: { wood: 100, stone: 250 },
            vulnerable: false, // Graveyards can't be sacked, but they can be descrated
            effectText: "contains 100 graves",
            onGain: function (num) { if (num === undefined) { num = 1; } digGraves(num); }
        }),
        new Building({
            id: buildingType.mill, singular: "mill", plural: "mills",
            prereqs: { wheel: true },
            get require() {
                return {
                    wood: 100 * (this.owned + 1) * Math.pow(1.05, this.owned),
                    stone: 100 * (this.owned + 1) * Math.pow(1.05, this.owned)
                };
            },
            set require(value) { return this.require; }, // Only here for JSLint.
            effectText: "improves farmers"
        }),
        new Building({
            id: buildingType.fortification, singular: "fortification", plural: "fortifications", efficiency: 0.01,
            prereqs: { engineering: true },
            //xxx This is testing a new technique that allows a function for the cost items.
            // Eventually, this will take a qty parameter
            get require() {
                return {
                    stone: function () { return 100 * (this.owned + 1) * Math.pow(1.05, this.owned); }.bind(this)
                };
            },
            set require(value) { return this.require; }, // Only here for JSLint.
            effectText: "helps protect against attack"
        }),
        // Altars
        // The 'name' on the altars is really the label on the button to make them.
        //xxx This should probably change.
        new Building({
            id: buildingType.battleAltar, name: "Build Altar", singular: "battle altar", plural: "battle altars",
            subType: subTypes.altar, devotion: 1,
            prereqs: { deity: deityDomains.battle },
            get require() { return { stone: 200, piety: 200 + (this.owned * this.owned), metal: 50 + (50 * this.owned) }; },
            set require(value) { return this.require; }, // Only here for JSLint.
            effectText: "+1 Devotion"
        }),
        new Building({
            id: buildingType.fieldsAltar, name: "Build Altar", singular: "fields altar", plural: "fields altars",
            subType: subTypes.altar, devotion: 1,
            prereqs: { deity: deityDomains.fields },
            get require() { return { stone: 200, piety: 200 + (this.owned * this.owned), food: 500 + (250 * this.owned), wood: 500 + (250 * this.owned) }; },
            set require(value) { return this.require; }, // Only here for JSLint.
            effectText: "+1 Devotion"
        }),
        new Building({
            id: buildingType.underworldAltar, name: "Build Altar", singular: "underworld altar", plural: "underworld altars",
            subType: subTypes.altar, devotion: 1,
            prereqs: { deity: deityDomains.underworld },
            get require() { return { stone: 200, piety: 200 + (this.owned * this.owned), corpses: 1 + this.owned }; },
            set require(value) { return this.require; }, // Only here for JSLint.
            effectText: "+1 Devotion"
        }),
        new Building({
            id: buildingType.catAltar, name: "Build Altar", singular: "cat altar", plural: "cat altars",
            subType: subTypes.altar, devotion: 1,
            prereqs: { deity: deityDomains.cats },
            get require() { return { stone: 200, piety: 200 + (this.owned * this.owned), herbs: 100 + (50 * this.owned) }; },
            set require(value) { return this.require; }, // Only here for JSLint.
            effectText: "+1 Devotion"
        })
    ];

    return buildData;
}