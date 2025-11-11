const { getTop3 } = require('../helpers.js'); // On importe la fonction

module.exports.getSection = async (date, ladatedujour) => {
   const topNaissances = getTop3(ladatedujour.births)
        .map(naissance => `**${naissance.year}** : [${naissance.name}](<${naissance.url}>) ${naissance.description}`)
        .join('\n\n');
    
    return `### - Anniversaires :  

${topNaissances}`
};