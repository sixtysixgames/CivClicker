"use strict";
/* global deityDomains, renameDeity, subTypes, updatePopulation, updateResourceTotals, updateUpgrades, Upgrade */
function getUpgradeData() {
    let data = [
        // Upgrades
        new Upgrade({
            id: "domestication", name: "Domestication", subType: subTypes.upgrade,
            require: { food: 20 },
            effectText: "Unlock more upgrades"
        }),
        new Upgrade({
            id: "carpentry", name: "Carpentry", subType: subTypes.upgrade,
            require: { wood: 20 },
            effectText: "Unlock more buildings and upgrades"
        }),
        new Upgrade({
            id: "quarrying", name: "Quarrying", subType: subTypes.upgrade,
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
            prereqs: { harvesting: true },
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
            prereqs: { metalwork: true },
            require: { wood: 500, metal: 500 },
            effectText: "Improve soldiers"
        }),
        new Upgrade({
            id: "shields", name: "Basic Shields", subType: subTypes.upgrade,
            prereqs: { metalwork: true },
            require: { wood: 500, leather: 500 },
            effectText: "Improve soldiers"
        }),
        new Upgrade({
            id: "armour", name: "Basic Armour", subType: subTypes.upgrade,
            prereqs: { metalwork: true },
            require: { metal: 500, leather: 500 },
            effectText: "Improve soldiers"
        }),
        new Upgrade({
            id: "advweaponry", name: "Advanced Weaponry", subType: subTypes.upgrade,
            prereqs: { weaponry: true, engineering: true, standard: true },
            require: { wood: 2500, metal: 2500, leather: 1000 },
            effectText: "Improve soldiers"
        }),
        new Upgrade({
            id: "advshields", name: "Advanced Shields", subType: subTypes.upgrade,
            prereqs: { shields: true, engineering: true, standard: true },
            require: { wood: 2500, leather: 2500, metal: 1000 },
            effectText: "Improve soldiers"
        }),
        new Upgrade({
            id: "advarmour", name: "Advanced Armour", subType: subTypes.upgrade,
            prereqs: { armour: true, engineering: true, standard: true },
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
            require: { piety: 250 },
            effectText: "Increase cleric piety generation. Increase piety limit"
        }),
        new Upgrade({
            id: "polytheism", name: "Polytheism", subType: subTypes.upgrade,
            prereqs: { theism: true },
            require: { piety: 1000  },
            effectText: "Increase cleric piety generation. Increase piety limit"
        }),
        new Upgrade({
            id: "monotheism", name: "Monotheism", subType: subTypes.upgrade,
            prereqs: { polytheism: true },
            require: { piety: 5000  },
            effectText: "Increase cleric piety generation. Increase piety limit"
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
            effectText: "Increase chance to get cats"
        }),
        new Upgrade({
            id: "companion", name: "Warmth of the Companion", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.cats, devotion: 30 },
            require: { piety: 1000 },
            effectText: "Cats help heal the sick"
        }),
        new Upgrade({
            id: "comfort", name: "Comfort of the Hearthfires", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.cats, devotion: 50 },
            require: { piety: 5000 },
            effectText: "Traders marginally more frequent"
        }),
        new Upgrade({
            id: "blessing", name: "Blessing of Abundance", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.fields, devotion: 10 },
            require: { piety: 1000 },
            effectText: "Increase farmer food output"
        }),
        new Upgrade({
            id: "waste", name: "Abide No Waste", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.fields, devotion: 30 },
            require: { piety: 1000 },
            effectText: "Workers will eat corpses if there is no food left"
        }),
        new Upgrade({
            id: "stay", name: "Stay With Us", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.fields, devotion: 50 },
            require: { piety: 5000 },
            effectText: "Traders stay longer"
        }),
        new Upgrade({
            id: "riddle", name: "Riddle of Steel", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.battle, devotion: 10 },
            require: { piety: 1000 },
            effectText: "Improve soldiers"
        }),
        new Upgrade({
            id: "throne", name: "Throne of Skulls", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.battle, devotion: 30 },
            require: { piety: 1000 },
            init: function (fullInit) { Upgrade.prototype.init.call(this, fullInit); this.count = 0; },
            get count() { return this.data.count; }, // Partial temples from Throne
            set count(value) { this.data.count = value; },
            effectText: "Slaying enemies creates temples"
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
            effectText: "Gain piety with deaths"
        }),
        new Upgrade({
            id: "feast", name: "A Feast for Crows", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.underworld, devotion: 30 },
            require: { piety: 1000 },
            effectText: "Corpses are less likely to cause illness"
        }),
        new Upgrade({
            id: "secrets", name: "Secrets of the Tombs", subType: subTypes.pantheon,
            prereqs: { deity: deityDomains.underworld, devotion: 50 },
            require: { piety: 5000 },
            effectText: "Graveyards increase cleric piety generation"
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
            effectText: "Traders arrive even more frequently, stay even longer"
        }),
        new Upgrade({
            id: "cornexchange", name: "Corn Exchange", subType: subTypes.trade,
            prereqs: { commerce: true },
            require: { gold: 100 },
            effectText: "Traders change the cost of resources"
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
            effectText: "Boost food production by sacrificing 1 worker/sec",
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
        })
    ];

    return data;
}