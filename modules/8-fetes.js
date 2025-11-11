module.exports.getSection = async (date, ladatedujour) => {
    const topFetes = ladatedujour.holidays
        .map(fete => `${fete.text}`)
        .join('\n\n');

    return "### - Fêtes et Journées Internationales :   \n" + topFetes

};