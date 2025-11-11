const { getTop3 } = require("../helpers")

module.exports.getSection = async (date, ladatedujour) => {
    const topMorts = getTop3(ladatedujour.deaths)
        .map(mort => `**${mort.year}** : [${mort.name}](<${mort.url}>) ${mort.description}`)
        .join('\n\n');

    return "### - Décès : \n" + topMorts

};