"use strict";
/* global Achievement, CivObj, civSizes, getAchievementData, getBuildingData, getResourceData, getUpgradeData, getUnitData, indexArrayByAttr, population, prettify  */

function getCivData() {
    // Initialize Data
    let civData = [];

    civData = civData.concat(getResourceData());
    civData = civData.concat(getBuildingData());
    civData = civData.concat(getUpgradeData());
    civData = civData.concat(getUnitData());
    civData = civData.concat(getAchievementData());

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