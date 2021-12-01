"use strict";
/* global civData, getPietyLimitBonus, getStorehouseBonus, getStoreroomBonus, getWarehouseBonus, Resource, resourceType, subTypes  */

function getResourceData() {
    let resData = [
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
                return (civData.temple.owned * 50) + (civData.temple.owned * bonus);
            },
            set limit(value) { return this.limit; } // Only here for JSLint.
        }),
        new Resource({ id: resourceType.gold, name: "gold", vulnerable: false }), // Can't be stolen
        new Resource({ id: resourceType.corpses, singular: "corpse", plural: "corpses", vulnerable: false }), // Can't be stolen
        new Resource({ id: resourceType.devotion, name: "devotion", vulnerable: false }) // Can't be stolen
    ];
    return resData;
}
