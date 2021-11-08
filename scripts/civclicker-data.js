"use strict";

// Requires 

function getCivData() {
    // Initialize Data
    let civData = [
        // Resources
        new Resource({
            id: resourceType.food, name: "food", increment: 1, specialChance: 0.1,
            subType: subTypes.basic,
            specialMaterial: resourceType.skins, verb: "harvest", activity: "harvesting", //I18N
            initTradeAmount: 5000, // how much to offer on Trade for 1 gold
            baseTradeAmount: 1000, // the least on offer
            get limit() {
                let barnBonus = (civData.granaries.owned ? 2 : 1) * 200;
                return 200 + (civData.barn.owned * barnBonus);
            },
            set limit(value) { return this.limit; } // Only here for JSLint.
        }),
        new Resource({
            id: resourceType.wood, name: "wood", increment: 1, specialChance: 0.1,
            subType: subTypes.basic,
            specialMaterial: resourceType.herbs, verb: "cut", activity: "woodcutting", //I18N
            initTradeAmount: 5000, // how much to offer on Trade for 1 gold
            baseTradeAmount: 1000, // the least on offer
            get limit() {
                let bonus = getWarehouseBonus();
                return 200 + (civData.woodstock.owned * bonus);
            },
            set limit(value) { return this.limit; } // Only here for JSLint.
        }),
        new Resource({
            id: resourceType.stone, name: "stone", increment: 1, specialChance: 0.1,
            subType: subTypes.basic,
            specialMaterial: resourceType.ore, verb: "mine", activity: "mining", //I18N
            initTradeAmount: 5000, // how much to offer on Trade for 1 gold
            baseTradeAmount: 1000, // the least on offer
            get limit() {
                let bonus = getWarehouseBonus();
                return 200 + (civData.stonestock.owned * bonus);
            },
            set limit(value) { return this.limit; } // Only here for JSLint.
        }),
        new Resource({
            id: resourceType.skins, singular: "skin", plural: "skins",
            subType: subTypes.special,
            initTradeAmount: 500, // how much to offer on Trade for 1 gold
            baseTradeAmount: 100, // the least on offer
            get limit() {
                let bonus = getStorehouseBonus();
                return 100 + (civData.barn.owned * bonus);
            },
            set limit(value) { return this.limit; } // Only here for JSLint.
        }),
        new Resource({
            id: resourceType.herbs, singular: "herb", plural: "herbs",
            subType: subTypes.special,
            initTradeAmount: 500, // how much to offer on Trade for 1 gold
            baseTradeAmount: 100, // the least on offer
            get limit() {
                let bonus = getStorehouseBonus();
                return 100 + (civData.woodstock.owned * bonus);
            },
            set limit(value) { return this.limit; } // Only here for JSLint.
        }),
        new Resource({
            id: resourceType.ore, name: "ore",
            subType: subTypes.special,
            initTradeAmount: 500, // how much to offer on Trade for 1 gold
            baseTradeAmount: 100, // the least on offer
            get limit() {
                let bonus = getStorehouseBonus();
                return 100 + (civData.stonestock.owned * bonus);
            },
            set limit(value) { return this.limit; } // Only here for JSLint.
        }),
        new Resource({
            id: resourceType.leather, name: "leather",
            subType: subTypes.special,
            initTradeAmount: 250, // how much to offer on Trade for 1 gold
            baseTradeAmount: 50, // the least on offer
            get limit() {
                let bonus = getStoreroomBonus();
                return 50 + (civData.tannery.owned * bonus);
            },
            set limit(value) { return this.limit; } // Only here for JSLint.
        }),
        new Resource({
            id: resourceType.potions, singular: "potion", plural: "potions",
            subType: subTypes.special,
            initTradeAmount: 250, // how much to offer on Trade for 1 gold
            baseTradeAmount: 50, // the least on offer
            get limit() {
                let bonus = getStoreroomBonus();
                return 50 + (civData.apothecary.owned * bonus);
            },
            set limit(value) { return this.limit; } // Only here for JSLint.
        }),
        new Resource({
            id: resourceType.metal, name: "metal",
            subType: subTypes.special,
            initTradeAmount: 250, // how much to offer on Trade for 1 gold
            baseTradeAmount: 50, // the least on offer
            get limit() {
                let bonus = getStoreroomBonus();
                return 50 + (civData.smithy.owned * bonus);
            },
            set limit(value) { return this.limit; } // Only here for JSLint.
        }),
        new Resource({
            id: resourceType.piety, name: "piety",
            vulnerable: false, // Can't be stolen
            get limit() {
                let bonus = getPietyLimitBonus();
                return 50 + (civData.temple.owned * 50) + (civData.temple.owned * bonus);
            },
            set limit(value) { return this.limit; } // Only here for JSLint.
        }), 
        new Resource({ id: resourceType.gold, name: "gold", vulnerable: false }), // Can't be stolen
        new Resource({ id: resourceType.corpses, singular: "corpse", plural: "corpses", vulnerable: false }), // Can't be stolen
        new Resource({ id: resourceType.devotion, name: "devotion", vulnerable: false }), // Can't be stolen

        // Buildings
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
                return "allows 1 cleric; +" + bonus + " piety storage";
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
        }),
        // Upgrades
        new Upgrade({
            id: "domestication", name: "Domestication", subType: subTypes.upgrade,
            //prereqs: { farmer: 1 },
            require: { food: 20 },
            effectText: "Unlock more upgrades"
        }),
        new Upgrade({
            id: "carpentry", name: "Carpentry", subType: subTypes.upgrade,
            //prereqs: { woodcutter: 1 },
            require: { wood: 20 },
            effectText: "Unlock more buildings and upgrades"
        }),
        new Upgrade({
            id: "quarrying", name: "Quarrying", subType: subTypes.upgrade,
            //prereqs: { miner: 1 },
            require: { stone: 20 },
            effectText: "Unlock more buildings and upgrades"
        }),
        new Upgrade({
            id: "skinning", name: "Skinning", subType: subTypes.upgrade,
            prereqs: { domestication: true },
            require: { skins: 10 },
            effectText: "Farmers can collect skins"
        }),
        new Upgrade({
            id: "harvesting", name: "Harvesting", subType: subTypes.upgrade,
            prereqs: { carpentry: true },
            require: { herbs: 10 },
            effectText: "Woodcutters can collect herbs"
        }),
        new Upgrade({
            id: "prospecting", name: "Prospecting", subType: subTypes.upgrade,
            prereqs: { quarrying: true },
            require: { ore: 10 },
            effectText: "Miners can collect ore"
        }),
        new Upgrade({
            id: "farming", name: "Farming", subType: subTypes.upgrade,
            prereqs: { domestication: true },
            require: { skins: 100, herbs: 100 },
            effectText: "Increase farmer food output.  Unlock more upgrades"
        }),
        new Upgrade({
            id: "felling", name: "Felling", subType: subTypes.upgrade,
            prereqs: { carpentry: true },
            require: { herbs: 100, ore: 100 },
            effectText: "Increase woodcutter wood output. Unlock more upgrades"
        }),
        new Upgrade({
            id: "mining", name: "Mining", subType: subTypes.upgrade,
            prereqs: { quarrying: true },
            require: { ore: 100, skins: 100 },
            effectText: "Increase miner stone output. Unlock more upgrades"
        }),
        
        new Upgrade({
            id: "agriculture", name: "Agriculture", subType: subTypes.upgrade,
            prereqs: { farming: true },
            require: { leather: 1000, metal: 1000 },
            effectText: "Increase farmer food output.  Unlock more upgrades"
        }),
        
        new Upgrade({
            id: "masonry", name: "Masonry", subType: subTypes.upgrade,
            prereqs: { carpentry: true },
            require: { wood: 250, stone: 250 },
            effectText: "Unlock more buildings and upgrades"
        }),
        new Upgrade({
            id: "metalwork", name: "Metalwork", subType: subTypes.upgrade,
            prereqs: { mining: true },
            require: { wood: 250, stone: 250, ore: 50 },
            effectText: "Unlock more buildings and upgrades"
        }),
        
        new Upgrade({
            id: "construction", name: "Construction", subType: subTypes.upgrade,
            prereqs: { masonry: true },
            require: { wood: 1000, stone: 1000 },
            effectText: "Unlock more buildings and upgrades"
        }),
        new Upgrade({
            id: "engineering", name: "Engineering", subType: subTypes.upgrade,
            prereqs: { construction: true },
            require: { wood: 5000, stone: 5000 },
            effectText: "Unlock more buildings and upgrades"
        }),
        new Upgrade({
            id: "architecture", name: "Architecture", subType: subTypes.upgrade,
            prereqs: { engineering: true },
            require: { wood: 10000, stone: 10000 },
            effectText: "Unlock more buildings and upgrades"
        }),
        
        new Upgrade({
            id: "ploughshares", name: "Ploughshares", subType: subTypes.upgrade,
            prereqs: { domestication: true, metalwork: true },
            require: { metal: 200 },
            effectText: "Increase farmer food output"
        }),
        new Upgrade({
            id: "irrigation", name: "Irrigation", subType: subTypes.upgrade,
            prereqs: { domestication: true, masonry: true },
            require: { wood: 500, stone: 250 },
            effectText: "Increase farmer food output"
        }),

        new Upgrade({
            id: "butchering", name: "Butchering", subType: subTypes.upgrade,
            prereqs: { tannery: 1 },
            require: { leather: 40 },
            effectText: "More farmers collect more skins"
        }),
        new Upgrade({
            id: "gardening", name: "Gardening", subType: subTypes.upgrade,
            prereqs: { apothecary: 1 },
            require: { potions: 40 },
            effectText: "More woodcutters collect more herbs"
        }),
        new Upgrade({
            id: "extraction", name: "Extraction", subType: subTypes.upgrade,
            prereqs: { prospecting: true, smithy: 1 },
            require: { metal: 40 },
            effectText: "More miners collect more ore"
        }),

        new Upgrade({
            id: "flensing", name: "Flensing", subType: subTypes.upgrade,
            prereqs: { farming: true },
            require: { leather: 500, food: 500 },
            effectText: "Collect skins more frequently"
        }),
        new Upgrade({
            id: "reaping", name: "Reaping", subType: subTypes.upgrade,
            prereqs: { farming: true },
            require: { potions: 500, wood: 500 },
            effectText: "Collect herbs more frequently"
        }),
        new Upgrade({
            id: "macerating", name: "Macerating", subType: subTypes.upgrade,
            prereqs: { extraction: true },
            require: { metal: 500, stone: 500 },
            effectText: "Collect ore more frequently"
        }),
        
        new Upgrade({
            id: "croprotation", name: "Crop Rotation", subType: subTypes.upgrade,
            prereqs: { agriculture: true },
            require: { skins: 5000, herbs: 5000 },
            effectText: "Increase farmer food output"
        }),
        new Upgrade({
            id: "selectivebreeding", name: "Selective Breeding", subType: subTypes.upgrade,
            prereqs: { agriculture: true },
            require: { herbs: 5000, ore: 5000 },
            effectText: "Increase farmer food output"
        }),
        new Upgrade({
            id: "fertilisers", name: "Fertilisers", subType: subTypes.upgrade,
            prereqs: { agriculture: true },
            require: { ore: 5000, skins: 5000 },
            effectText: "Increase farmer food output"
        }),

        new Upgrade({
            id: "tenements", name: "Tenements", subType: subTypes.upgrade,
            prereqs: { construction: true },
            require: { food: 250, wood: 500, stone: 500 },
            effectText: "Houses support +2 workers",
            onGain: function () {
                updatePopulation();//due to population limits changing 
            } 
        }),
        new Upgrade({
            id: "slums", name: "Slums", subType: subTypes.upgrade,
            prereqs: { engineering: true },
            require: { food: 500, wood: 1000, stone: 1000 },
            effectText: "Houses support +2 workers",
            onGain: function () {
                updatePopulation();//due to population limits changing 
            } 
        }),
        new Upgrade({
            id: "granaries", name: "Granaries", subType: subTypes.upgrade,
            prereqs: { construction: true },
            require: { wood: 1200, stone: 1200 },
            effectText: "Barns store double the amount of food",
            onGain: function () {
                updateResourceTotals();//due to resource limits increasing 
            } 
        }),
        new Upgrade({
            id: "warehouses", name: "Warehouses", subType: subTypes.upgrade,
            prereqs: { construction: true },
            require: { wood: 1200, stone: 1200 },
            effectText: "Stockpiles store double the amount of wood and stone",
            onGain: function () {
                updateResourceTotals();//due to resource limits increasing 
            } 
        }),
        new Upgrade({
            id: "storehouses", name: "Storehouses", subType: subTypes.upgrade,
            prereqs: { construction: true },
            require: { skins: 600, herbs: 600, ore: 600 },
            effectText: "Store double the amount of skins, herbs and ore",
            onGain: function () {
                updateResourceTotals();//due to resource limits increasing 
            } 
        }),
        new Upgrade({
            id: "storerooms", name: "Storerooms", subType: subTypes.upgrade,
            prereqs: { construction: true },
            require: { leather: 300, potions: 300, metal: 300 },
            effectText: "Store double the amount of leather, potions and metal",
            onGain: function () {
                updateResourceTotals();//due to resource limits increasing
            } 
        }),
        new Upgrade({
            id: "rampart", name: "Ramparts", subType: subTypes.upgrade,
            efficiency: 0.005, // Subtracted from attacker efficiency.
            prereqs: { construction: true },
            require: { wood: 500, stone: 1000 },
            effectText: "Enemies do less damage"
        }),
        new Upgrade({
            id: "palisade", name: "Palisades", subType: subTypes.upgrade,
            efficiency: 0.01, // Subtracted from attacker efficiency.
            prereqs: { engineering: true,  rampart: true},
            require: { wood: 2500, stone: 1000 },
            effectText: "Enemies do less damage"
        }),
        new Upgrade({
            id: "battlement", name: "Battlements", subType: subTypes.upgrade,
            efficiency: 0.02, // Subtracted from attacker efficiency.
            prereqs: { architecture: true, palisade: true },
            require: { wood: 2500, stone: 5000 },
            effectText: "Enemies do less damage"
        }),
        new Upgrade({
            id: "weaponry", name: "Basic Weaponry", subType: subTypes.upgrade,
            prereqs: { metalwork: true, barracks: 1 },
            require: { wood: 500, metal: 500 },
            effectText: "Improve soldiers"
        }),
        new Upgrade({
            id: "shields", name: "Basic Shields", subType: subTypes.upgrade,
            prereqs: { metalwork: true, barracks: 1 },
            require: { wood: 500, leather: 500 },
            effectText: "Improve soldiers"
        }),
        new Upgrade({
            id: "armour", name: "Basic Armour", subType: subTypes.upgrade,
            prereqs: { metalwork: true, barracks: 1 },
            require: { metal: 500, leather: 500 },
            effectText: "Improve soldiers"
        }),
        new Upgrade({
            id: "advweaponry", name: "Advanced Weaponry", subType: subTypes.upgrade,
            prereqs: { weaponry: true, engineering: true, barracks: 100 },
            require: { wood: 2500, metal: 2500, leather: 1000 },
            effectText: "Improve soldiers"
        }),
        new Upgrade({
            id: "advshields", name: "Advanced Shields", subType: subTypes.upgrade,
            prereqs: { shields: true, engineering: true, barracks: 100 },
            require: { wood: 2500, leather: 2500, metal: 1000 },
            effectText: "Improve soldiers"
        }),
        new Upgrade({
            id: "advarmour", name: "Advanced Armour", subType: subTypes.upgrade,
            prereqs: { armour: true, engineering: true, barracks: 100 },
            require: { leather: 2500, metal: 2500 },
            effectText: "Improve soldiers"
        }),
        new Upgrade({
            id: "horseback", name: "Horseback Riding", subType: subTypes.upgrade,
            prereqs: { metalwork: true, domestication: true },
            require: { food: 500, wood: 500 },
            effectText: "Build stables"
        }),

        new Upgrade({
            id: "wheel", name: "The Wheel", subType: subTypes.upgrade,
            prereqs: { masonry: true },
            require: { wood: 500, stone: 500 },
            effectText: "Unlock more buildings"
        }),

        new Upgrade({
            id: "theism", name: "Theism", subType: subTypes.upgrade,
            prereqs: { cleric: 1 },
            require: { piety: 100 },
            effectText: "Increase cleric piety generation. Increase piety storage"
        }),
        new Upgrade({
            id: "polytheism", name: "Polytheism", subType: subTypes.upgrade,
            prereqs: { theism: true },
            require: { piety: 1000  },
            effectText: "Increase cleric piety generation. Increase piety storage"
        }),
        new Upgrade({
            id: "monotheism", name: "Monotheism", subType: subTypes.upgrade,
            prereqs: { polytheism: true },
            require: { piety: 5000  },
            effectText: "Increase cleric piety generation. Increase piety storage"
        }),

        new Upgrade({
            id: "writing", name: "Writing", subType: subTypes.upgrade,
            prereqs: { theism: true },
            require: { skins: 1000, piety: 2500 },
            effectText: "Increase cleric piety generation. Unlock more upgrades"
        }),
        new Upgrade({
            id: "mathematics", name: "Mathematics", subType: subTypes.upgrade,
            prereqs: { writing: true },
            require: { metal: 2500, piety: 2500 },
            effectText: "Increase metal production"
        }),
        new Upgrade({
            id: "astronomy", name: "Astronomy", subType: subTypes.upgrade,
            prereqs: { writing: true },
            require: { leather: 2500, piety: 2500 },
            effectText: "Increase leather production"
        }),
        new Upgrade({
            id: "medicine", name: "Medicine", subType: subTypes.upgrade,
            prereqs: { writing: true },
            require: { potions: 2500, piety: 2500 },
            effectText: "Increase potion production"
        }),

        new Upgrade({
            id: "administration", name: "Administration", subType: subTypes.upgrade,
            prereqs: { writing: true },
            require: { stone: 2500, skins: 2500 },
            effectText: "Increase land gained from raiding"
        }),
        
        new Upgrade({
            id: "codeoflaws", name: "Code of Laws", subType: subTypes.upgrade,
            prereqs: { writing: true },
            require: { stone: 2500, skins: 2500 },
            effectText: "Reduce unhappiness caused by overcrowding"
        }),
        
        new Upgrade({
            id: "aesthetics", name: "Aesthetics", subType: subTypes.upgrade,
            prereqs: { polytheism: true },
            require: { piety: 4000 },
            effectText: "Building temples increases morale"
        }),
        new Upgrade({
            id: "civilservice", name: "Civil Service", subType: subTypes.upgrade,
            prereqs: { codeoflaws: true },
            require: { piety: 5000 },
            effectText: "Increase basic resources from clicking.  Increase labourer efficiency"
        }),
        new Upgrade({
            id: "guilds", name: "Guilds", subType: subTypes.upgrade,
            prereqs: { astronomy: true, mathematics: true, medicine: true },
            require: { piety: 10000 },
            effectText: "Increase special resources from clicking.  Increase labourer efficiency"
        }),
        new Upgrade({
            id: "feudalism", name: "Feudalism", subType: subTypes.upgrade,
            prereqs: { guilds: true },
            require: { piety: 25000 },
            effectText: "Further increase basic resources from clicking.  Increase labourer efficiency"
        }),
        new Upgrade({
            id: "serfs", name: "Serfs", subType: subTypes.upgrade,
            prereqs: { guilds: true },
            require: { piety: 25000 },
            effectText: "Idle workers increase resources from clicking.  Increase labourer efficiency"
        }),
        new Upgrade({
            id: "nationalism", name: "Nationalism", subType: subTypes.upgrade,
            prereqs: { civilservice: true },
            require: { piety: 50000 },
            effectText: "Soldiers increase basic resources from clicking.  Increase labourer efficiency"
        }),

        new Upgrade({
            id: "worship", name: "Worship", subType: subTypes.deity,
            prereqs: { temple: 1 },
            require: { piety: 1000 },
            effectText: "Begin worshipping a deity (requires temple)",
            onGain: function () {
                updateUpgrades();
                renameDeity(); //Need to add in some handling for when this returns NULL.
            }
        }),
        // Pantheon Upgrades
        new Upgrade({
            id: "lure", name: "Lure of Civilisation", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.cats, devotion: 10 },
            require: { piety: 1000 },
            effectText: "increase chance to get cats"
        }),
        new Upgrade({
            id: "companion", name: "Warmth of the Companion", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.cats, devotion: 30 },
            require: { piety: 1000 },
            effectText: "cats help heal the sick"
        }),
        new Upgrade({
            id: "comfort", name: "Comfort of the Hearthfires", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.cats, devotion: 50 },
            require: { piety: 5000 },
            effectText: "traders marginally more frequent"
        }),
        new Upgrade({
            id: "blessing", name: "Blessing of Abundance", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.fields, devotion: 10 },
            require: { piety: 1000 },
            effectText: "increase farmer food output"
        }),
        new Upgrade({
            id: "waste", name: "Abide No Waste", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.fields, devotion: 30 },
            require: { piety: 1000 },
            effectText: "workers will eat corpses if there is no food left"
        }),
        new Upgrade({
            id: "stay", name: "Stay With Us", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.fields, devotion: 50 },
            require: { piety: 5000 },
            effectText: "traders stay longer"
        }),
        new Upgrade({
            id: "riddle", name: "Riddle of Steel", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.battle, devotion: 10 },
            require: { piety: 1000 },
            effectText: "improve soldiers"
        }),
        new Upgrade({
            id: "throne", name: "Throne of Skulls", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.battle, devotion: 30 },
            require: { piety: 1000 },
            init: function (fullInit) { Upgrade.prototype.init.call(this, fullInit); this.count = 0; },
            get count() { return this.data.count; }, // Partial temples from Throne
            set count(value) { this.data.count = value; },
            effectText: "slaying enemies creates temples"
        }),
        new Upgrade({
            id: "lament", name: "Lament of the Defeated", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.battle, devotion: 50 },
            require: { piety: 5000 },
            effectText: "Successful raids delay future invasions"
        }),
        new Upgrade({
            id: "book", name: "The Book of the Dead", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.underworld, devotion: 10 },
            require: { piety: 1000 },
            effectText: "gain piety with deaths"
        }),
        new Upgrade({
            id: "feast", name: "A Feast for Crows", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.underworld, devotion: 30 },
            require: { piety: 1000 },
            effectText: "corpses are less likely to cause illness"
        }),
        new Upgrade({
            id: "secrets", name: "Secrets of the Tombs", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.underworld, devotion: 50 },
            require: { piety: 5000 },
            effectText: "graveyards increase cleric piety generation"
        }),
        // Special Upgrades
        new Upgrade({
            id: "standard", name: "Battle Standard", subType: subTypes.conquest,
            prereqs: { barracks: 1 },
            require: { leather: 1000, metal: 1000 },
            effectText: "Lets you build an army (requires barracks)"
        }),
        new Upgrade({
            id: "trade", name: "Trade", subType: subTypes.trade,
            prereqs: { gold: 1 },
            require: { gold: 1 },
            effectText: "Open the trading post"
        }),
        new Upgrade({
            id: "currency", name: "Currency", subType: subTypes.trade,
            require: { gold: 10 },
            effectText: "Traders arrive more frequently, stay longer"
        }),
        new Upgrade({
            id: "commerce", name: "Commerce", subType: subTypes.trade,
            prereqs: { currency: true },
            require: { gold: 50 },
            effectText: "Traders arrive more frequently, stay longer"
        }),
        new Upgrade({
            id: "cornexchange", name: "Corn Exchange", subType: subTypes.trade,
            prereqs: { commerce: true },
            require: { gold: 100 },
            effectText: "Traders set the cost of resources"
        }),
        // Prayers
        new Upgrade({
            id: "smite", name: "Smite Invaders", subType: subTypes.prayer,
            prereqs: { deity: deityDomains.battle, devotion: 20 },
            require: { piety: 100 },
            effectText: "(per invader killed)"
        }),
        new Upgrade({
            id: "glory", name: "For Glory!", subType: subTypes.prayer,
            prereqs: { deity: deityDomains.battle, devotion: 40 },
            require: { piety: 1000 },
            init: function (fullInit) { Upgrade.prototype.init.call(this, fullInit); this.data.timer = 0; },
            get timer() { return this.data.timer; }, // Glory time left (sec)
            set timer(value) { this.data.timer = value; },
            effectText: "Temporarily makes raids more difficult, increases rewards"
        }),
        new Upgrade({
            id: "wickerman", name: "Burn Wicker Man", subType: subTypes.prayer,
            prereqs: { deity: deityDomains.fields, devotion: 20 },
            require: { wood: 500 },  //xxx +1 Worker
            effectText: "Sacrifice 1 worker to gain a random bonus to a resource"
        }),
        new Upgrade({
            id: "walk", name: "Walk Behind the Rows", subType: subTypes.prayer,
            prereqs: { deity: deityDomains.fields, devotion: 40 },
            require: {}, //xxx 1 Worker/sec
            init: function (fullInit) { Upgrade.prototype.init.call(this, fullInit); this.rate = 0; },
            get rate() { return this.data.rate; }, // Sacrifice rate
            set rate(value) { this.data.rate = value; },
            effectText: "boost food production by sacrificing 1 worker/sec",
            extraText: "<br /><button id='ceaseWalk' onmousedown='walk(false)' disabled='disabled'>Cease Walking</button>"
        }),
        new Upgrade({
            id: "raiseDead", name: "Raise Dead", subType: subTypes.prayer,
            prereqs: { deity: deityDomains.underworld, devotion: 20 },
            require: { corpses: 1, piety: 4 }, //xxx Nonlinear cost
            effectText: "Piety to raise the next zombie",
            extraText: "<button onmousedown='raiseDead(100)' id='raiseDead100' class='x100' disabled='disabled'"
                + ">+100</button><button onmousedown='raiseDead(Infinity)' id='raiseDeadMax' class='xInfinity' disabled='disabled'>+&infin;</button>"
        }),
        new Upgrade({
            id: "summonShade", name: "Summon Shades", subType: subTypes.prayer,
            prereqs: { deity: deityDomains.underworld, devotion: 40 },
            require: { piety: 1000 },  //xxx Also need slainEnemies
            effectText: "Souls of your defeated enemies rise to fight for you"
        }),
        new Upgrade({
            id: "pestControl", name: "Pest Control", subType: subTypes.prayer,
            prereqs: { deity: deityDomains.cats, devotion: 20 },
            require: { piety: 100 },
            init: function (fullInit) { Upgrade.prototype.init.call(this, fullInit); this.timer = 0; },
            get timer() { return this.data.timer; }, // Pest hunting time left
            set timer(value) { this.data.timer = value; },
            effectText: "Give temporary boost to food production"
        }),
        new Upgrade({
            id: "grace", name: "Grace", subType: subTypes.prayer,
            prereqs: { deity: deityDomains.cats, devotion: 40 },
            require: { piety: 1000 }, //xxx This is not fixed; see curCiv.graceCost
            init: function (fullInit) { Upgrade.prototype.init.call(this, fullInit); this.cost = 1000; },
            get cost() { return this.data.cost; }, // Increasing cost to use Grace to increase morale.
            set cost(value) { this.data.cost = value; },
            effectText: "Increase Morale"
        }),

        // Units
        new Unit({
            id: unitType.unemployed, singular: "idle citizen", plural: "idle citizens",
            require: undefined,  // Cannot be purchased (through normal controls) xxx Maybe change this?
            defence: 0.025, // default is 0.05
            salable: false,  // Cannot be sold.
            customQtyId: "spawnCustomQty",
            effectText: "Playing idle games"
        }),
        new Unit({
            id: unitType.farmer, singular: "farmer", plural: "farmers",
            source: unitType.unemployed,
            efficiency_base: 0.2,
            defence: 0.06, // default is 0.05 same as wolf efficiency
            get efficiency() {
                return farmerMods(this.efficiency_base);
            },
            set efficiency(value) { this.efficiency_base = value; },
            effectText: "Automatically harvest food"
        }),
        new Unit({
            id: unitType.woodcutter, singular: "woodcutter", plural: "woodcutters",
            source: unitType.unemployed,
            efficiency_base: 0.49,
            defence: 0.055, // default is 0.05
            get efficiency() {
                return woodcutterMods(this.efficiency_base);
            },
            set efficiency(value) { this.efficiency_base = value; },
            effectText: "Automatically cut wood"
        }),
        new Unit({
            id: unitType.miner, singular: "miner", plural: "miners",
            source: unitType.unemployed,
            efficiency_base: 0.19,
            defence: 0.055, // default is 0.05
            get efficiency() {
                return minerMods(this.efficiency_base);
            },
            set efficiency(value) { this.efficiency_base = value; },
            effectText: "Automatically mine stone"
        }),
        new Unit({
            id: unitType.tanner, singular: "tanner", plural: "tanners",
            source: unitType.unemployed,
            efficiency: 0.44,
            defence: 0.04, // default is 0.05
            prereqs: { tannery: 1 },
            require: { skins: 2 },
            get limit() { return civData.tannery.owned; },
            set limit(value) { return this.limit; }, // Only here for JSLint.
            effectText: "Convert skins to leather"
        }),
        new Unit({
            id: unitType.blacksmith, singular: "blacksmith", plural: "blacksmiths",
            source: unitType.unemployed,
            efficiency: 0.43,
            defence: 0.04, // default is 0.05
            prereqs: { smithy: 1 },
            require: { ore: 2 },
            get limit() { return civData.smithy.owned; },
            set limit(value) { return this.limit; }, // Only here for JSLint.
            effectText: "Convert ore to metal"
        }),
        new Unit({
            id: unitType.healer, singular: "healer", plural: "healers",
            source: unitType.unemployed,
            efficiency: 0.42,
            defence: 0.01, // default is 0.05
            prereqs: { apothecary: 1 },
            require: { herbs: 2 },
            init: function (fullInit) { Unit.prototype.init.call(this, fullInit); this.cureCount = 0; },
            get limit() { return civData.apothecary.owned; },
            set limit(value) { return this.limit; }, // Only here for JSLint.
            get cureCount() { return this.data.cureCount; }, // Carry over fractional healing
            set cureCount(value) { this.data.cureCount = value; }, // Only here for JSLint.
            effectText: "Make potions from herbs. Cure sick workers"
        }),
        new Unit({
            id: unitType.cleric, singular: "cleric", plural: "clerics",
            source: unitType.unemployed,
            efficiency: 0.05,
            defence: 0.01, // default is 0.05
            prereqs: { temple: 1 },
            require: { herbs: 4 },
            get limit() { return civData.temple.owned; },
            set limit(value) { return this.limit; }, // Only here for JSLint.
            effectText: "Generate piety, bury corpses"
        }),
        new Unit({
            id: unitType.labourer, singular: "labourer", plural: "labourers",
            source: unitType.unemployed,
            efficiency: 1.0,
            defence: 0.025, // default is 0.05
            prereqs: { wonderStage: 1 }, //xxx This is a hack
            effectText: "Use resources to build wonder"
        }),
        new Unit({
            id: unitType.soldier, singular: "soldier", plural: "soldiers",
            source: unitType.unemployed,
            combatType: combatTypes.infantry,
            efficiency_base: 0.05,
            get efficiency() { return this.efficiency_base + playerCombatMods(); },
            set efficiency(value) { this.efficiency_base = value; },
            prereqs: { barracks: 1 },
            require: { leather: 10, metal: 10 },
            get limit() { return 10 * civData.barracks.owned; },
            set limit(value) { return this.limit; }, // Only here for JSLint.
            effectText: "Protect from attack"
        }),
        new Unit({
            id: unitType.cavalry, singular: "cavalry", plural: "cavalry",
            source: unitType.unemployed,
            combatType: combatTypes.cavalry,
            efficiency_base: 0.08,
            get efficiency() { return this.efficiency_base + playerCombatMods(); },
            set efficiency(value) { this.efficiency_base = value; },
            prereqs: { stable: 1 },
            require: { food: 20, leather: 20, metal: 4 },
            get limit() { return 10 * civData.stable.owned; },
            set limit(value) { return this.limit; }, // Only here for JSLint.
            effectText: "Protect from attack"
        }),
        new Unit({
            id: unitType.totalSick, singular: "sick citizen", plural: "sick citizens",
            prereqs: undefined,  // Hide until we get one.
            require: undefined,  // Cannot be purchased.
            salable: false,  // Cannot be sold.
            defence: 0.001, // default is 0.05
            //xxx This (alternate data location) could probably be cleaner.
            get owned() { return population[this.id]; },
            set owned(value) { population[this.id] = value; },
            init: function () { this.owned = this.initOwned; }, //xxx Verify this override is needed.
            effectText: "Use healers and herbs to cure them"
        }),
        new Unit({
            id: unitType.cat, singular: "cat", plural: "cats", subType: subTypes.special,
            require: undefined,  // Cannot be purchased (through normal controls)
            prereqs: { cat: 1 }, // Only visible if you have one.
            prestige: true, // Not lost on reset.
            salable: false,  // Cannot be sold.
            species: speciesType.animal,
            effectText: "Our feline companions"
        }),
        new Unit({
            id: unitType.shade, singular: "shade", plural: "shades", subType: subTypes.special,
            prereqs: undefined,  // Cannot be purchased (through normal controls) xxx Maybe change this?
            require: undefined,  // Cannot be purchased.
            salable: false,  // Cannot be sold.
            species: speciesType.undead,
            effectText: "Insubstantial spirits"
        }),
        new Unit({
            id: unitType.wolf, singular: "wolf", plural: "wolves",
            alignment: alignmentType.enemy,
            combatType: combatTypes.animal,
            prereqs: undefined, // Cannot be purchased.
            efficiency: 0.05,
            onWin: function () { doWolves(this); },
            // see invader for definitions
            killFatigue: (0.99), 
            killStop: (1.0), 
            killMax: (0.99), 
            species: speciesType.animal,
            effectText: "Eat your workers"
        }),
        new Unit({
            id: unitType.bandit, singular: "bandit", plural: "bandits",
            alignment: alignmentType.enemy,
            combatType: combatTypes.infantry,
            prereqs: undefined, // Cannot be purchased.
            efficiency: 0.07,
            onWin: function () { doBandits(this); },
            // see invader for definitions
            lootFatigue: (0.01),  
            lootStop: (0.9), 
            lootMax: (0.99), 
            sackFatigue: (0.02),  
            sackStop: (0.99), 
            sackMax: (0.25), 
            killFatigue: (0.02),  
            killStop: (0.99), 
            killMax: (0.1), 
            effectText: "Steal your resources"
        }),
        new Unit({
            id: unitType.barbarian, singular: "barbarian", plural: "barbarians",
            alignment: alignmentType.enemy,
            combatType: combatTypes.infantry,
            prereqs: undefined, // Cannot be purchased.
            efficiency: 0.09,
            onWin: function () { doBarbarians(this); },
            // see invader for definitions
            lootFatigue: (0.05), 
            lootStop: (0.75), 
            lootMax: (0.99), 
            sackFatigue: (0.05), 
            sackStop: (0.66), 
            sackMax: (0.99), 
            killFatigue: (0.05), 
            killStop: (0.99), 
            killMax: (0.33), 
            conquerFatigue: (0.05), 
            conquerStop: (0.99), 
            conquerMax: (0.25), 
            effectText: "Slaughter, plunder, and burn"
        }),
        new Unit({
            id: unitType.invader, singular: "invader", plural: "invaders",
            alignment: alignmentType.enemy,
            combatType: combatTypes.infantry,
            prereqs: undefined, // Cannot be purchased.
            efficiency: 0.11,
            onWin: function () { doInvaders(this); },
            lootFatigue: (0.01), // Max fraction that leave after cleaning out a resource
            lootStop: (0.99), // Chance of an attacker leaving after looting a resource
            lootMax: (0.25), // Max fraction that will loot
            sackFatigue: (0.01), // Max fraction that leave after destroying a building type
            sackStop: (0.99), // Chance of an attacker leaving after sacking a building
            sackMax: (0.25), // Max fraction that will sack
            killFatigue: (0.01), // Max fraction that leave after killing the last person
            killStop: (0.99), // Chance of an attacker leaving after killing a person
            killMax: (0.25), // Max fraction that will kill
            conquerFatigue: (0.01), // Max fraction that leave after conquering the last land
            conquerStop: (0.25), // Chance of an attacker leaving after conquering land
            conquerMax: (0.99), // Max fraction that will take land
            effectText: "Conquer your lands"
        }),
        new Unit({
            id: unitType.esiege, singular: "siege engine", plural: "siege engines",
            alignment: alignmentType.enemy,
            prereqs: undefined, // Cannot be purchased.
            efficiency: 0.1,  // 10% chance to hit
            species: speciesType.mechanical,
            effectText: "Destroy your fortifications"
        }),
        new Unit({
            id: unitType.soldierParty, singular: "soldier", plural: "soldiers",
            source: unitType.soldier,
            combatType: combatTypes.infantry,
            require: { food: 2 },
            efficiency_base: 0.05,
            get efficiency() { return this.efficiency_base + playerCombatMods(); },
            set efficiency(value) { this.efficiency_base = value; },
            prereqs: { standard: true, barracks: 1 },
            place: placeType.party,
            effectText: "Your raiding party"
        }),
        new Unit({
            id: unitType.cavalryParty, singular: "cavalry", plural: "cavalry",
            source: unitType.cavalry,
            combatType: combatTypes.cavalry,
            require: { food: 5 },
            efficiency_base: 0.08,
            get efficiency() { return this.efficiency_base + playerCombatMods(); },
            set efficiency(value) { this.efficiency_base = value; },
            prereqs: { standard: true, stable: 1 },
            place: placeType.party,
            effectText: "Your mounted raiders"
        }),
        new Unit({
            id: unitType.siege, singular: "siege engine", plural: "siege engines",
            efficiency: 0.1, // 10% chance to hit
            prereqs: { standard: true, wheel: true },
            require: { wood: 250, leather: 50, metal: 50 },
            species: speciesType.mechanical,
            place: placeType.party,
            salable: false,
            effectText: "Destroy enemy fortifications"
        }),
        // TODO: mercenaries only on conquest
        //new Unit({
        //    id: unitType.mercenary, singular: "mercenary", plural: "mercenaries",
        //    efficiency: 0.05, // 
        //    prereqs: { standard: true, wheel: true },
        //    require: { food: 20, gold: 1 },
        //    species: speciesType.human,
        //    place: placeType.party,
        //    salable: false,
        //    effectText: "Destroy enemy fortifications"
        //}),
        new Unit({
            id: unitType.esoldier, singular: "soldier", plural: "soldiers",
            alignment: alignmentType.enemy,
            combatType: combatTypes.infantry,
            prereqs: undefined, // Cannot be purchased.
            efficiency: 0.05,
            place: placeType.party,
            effectText: "Defending enemy troops"
        }),
        /* Not currently used.
         * 66G TODO: use them
        new Unit({ id:unitType.ecavalry, name:"cavalry",
            alignment:alignmentType.enemy,
            combatType:combatTypes.cavalry, 
            prereqs: undefined, // Cannot be purchased.
            efficiency: 0.08,
            place: placeType.party,
            effectText:"Mounted enemy troops" }),
        */
        new Unit({
            id: unitType.efort, singular: "fortification", plural: "fortifications",
            alignment: alignmentType.enemy,
            prereqs: undefined, // Cannot be purchased.
            efficiency: 0.01, // -1% damage
            species: speciesType.mechanical,
            place: placeType.party,
            effectText: "Reduce enemy casualties"
        }),
        // Achievements
        //conquest
        new Achievement({
            id: "raiderAch", name: "Raider",
            test: function () { return curCiv.raid.victory; },
            effectText: "Succesfully conquer an enemy"
        }),
        //xxx Technically this also gives credit for capturing a siege engine.
        new Achievement({
            id: "engineerAch", name: "Engi&shy;neer",
            test: function () { return civData.siege.owned > 0; },
            effectText: "Buy or capture a siege engine"
        }),
        // If we beat the largest possible opponent, grant bonus achievement.
        new Achievement({
            id: "dominationAch", name: "Domi&shy;nation",
            test: function () { return curCiv.raid.victory && (curCiv.raid.last == civSizes[civSizes.length - 1].id); },
            effectText: "Succesfully conquer all enemies"
        }),
        //Morale
        new Achievement({
            id: "hatedAch", name: "Hated",
            test: function () { return curCiv.morale.efficiency <= 0.5; },
            effectText: "Make your population angry"
        }),
        new Achievement({
            id: "lovedAch", name: "Loved",
            test: function () { return curCiv.morale.efficiency >= 1.5; },
            effectText: "Make your population blissful"
        }),
        //cats
        new Achievement({
            id: "catAch", name: "Cat!",
            test: function () { return civData.cat.owned >= 1; },
            effectText: "Own a cat"
        }),
        new Achievement({
            id: "glaringAch", name: "Glaring",
            test: function () { return civData.cat.owned >= 10; },
            effectText: "Own ten cats"
        }),
        new Achievement({
            id: "clowderAch", name: "Clowder",
            test: function () { return civData.cat.owned >= 100; },
            effectText: "Own one hundred cats"
        }),
        //other population
        //Plagued achievement requires sick people to outnumber healthy
        new Achievement({
            id: "plaguedAch", name: "Plagued",
            test: function () { return population.totalSick > population.healthy; },
            effectText: "Your sick civilians outnumber the healthy"
        }),
        new Achievement({
            id: "ghostTownAch", name: "Ghost Town",
            test: function () { return (population.living === 0 && population.limit >= 1000); },
            effectText: "Your population of at least 1,000 all died"
        }),
        //deities
        //xxx TODO: Should make this loop through the domains
        new Achievement({
            id: "battleAch", name: "Battle",
            test: function () { return getCurDeityDomain() == deityDomains.battle; },
            effectText: "Worship a deity of Battle"
        }),
        new Achievement({
            id: "fieldsAch", name: "Fields",
            test: function () { return getCurDeityDomain() == deityDomains.fields; },
            effectText: "Worship a deity of the Fields"
        }),
        new Achievement({
            id: "underworldAch", name: "Under&shy;world",
            test: function () { return getCurDeityDomain() == deityDomains.underworld; },
            effectText: "Worship a deity of the Underworld"
        }),
        new Achievement({
            id: "catsAch", name: "Cats",
            test: function () { return getCurDeityDomain() == deityDomains.cats; },
            effectText: "Worship a deity of Cats"
        }),
        //xxx It might be better if this checked for all domains in the Pantheon at once (no iconoclasming old ones away).
        new Achievement({
            id: "fullHouseAch", name: "Full House",
            test: function () { return civData.battleAch.owned && civData.fieldsAch.owned && civData.underworldAch.owned && civData.catsAch.owned; },
            effectText: "Worship all deities"
        }),
        //wonders
        new Achievement({
            id: "wonderAch", name: "Wonder",
            test: function () { return curCiv.curWonder.stage === 3; },
            effectText: "Build a Wonder"
        }),
        new Achievement({
            id: "sevenAch", name: "Seven!",
            test: function () { return curCiv.wonders.length >= 7; },
            effectText: "Build seven Wonders"
        }),
        //trading
        new Achievement({
            id: "merchantAch", name: "Merch&shy;ant",
            test: function () { return civData.gold.owned > 0; },
            effectText: "Sell to a trader"
        }),
        new Achievement({
            id: "rushedAch", name: "Rushed",
            test: function () { return curCiv.curWonder.rushed; },
            effectText: "Spend gold to speed the building of a Wonder"
        }),
        //other
        new Achievement({
            id: "neverclickAch", name: "Never&shy;click",
            test: function () {return curCiv.curWonder.stage === 3 && curCiv.resourceClicks <= 22;},
            effectText: "Build a Wonder with only 22 resource clicks"
        })
    ];

    function augmentCivData() {
        let testCivSizeAch = function () {
            return (this.id == civSizes.getCivSize(population.living).id + "Ach");
        };
        // Add the civ size based achievements to the front of the data, so that they come first.
        for (let i = civSizes.length - 1; i > 0; --i) {
            civData.unshift(new Achievement({
                id: civSizes[i].id + "Ach",
                name: civSizes[i].name,
                test: testCivSizeAch,
                effectText: "Reach a population size of " + prettify(civSizes[i].min_pop)
            }));
        }
        //xxx TODO: Add deity domain based achievements here too.
    }
    augmentCivData();

    // Create 'civData.foo' entries as aliases for the civData element with 
    // id = "foo".  This makes it a lot easier to refer to the array
    // elements in a readable fashion.
    indexArrayByAttr(civData, "id");

    // Initialize our data. 
    civData.forEach(function (elem) {
        if (elem instanceof CivObj) { elem.init(); }
    });

    return civData;
}
// 210916 = 1368