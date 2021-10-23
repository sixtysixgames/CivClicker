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
            `
        }
    }
}

var UIComponents = createUIComponents();