module.exports.getSection = async (date, ladatedujour) => {
    const topEvenements = ladatedujour.elementshistoriques
        .sort((a, b) => b.year - a.year)
        .slice(0, 5)
        .sort((a, b) => a.year - b.year)
        .map(evenements => `**${evenements.year}** : ${evenements.text}`)
        .join('\n\n');
    

    const events = `### - Événements historiques :  

${topEvenements} `
    return events
}