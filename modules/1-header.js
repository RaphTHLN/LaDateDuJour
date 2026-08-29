const options = { day: 'numeric', month: 'long', year: 'numeric' };
const options2 = { day: 'numeric', month: 'long' };

module.exports.getSection = async (date) => {
    return {
        id: 'header',
        content: `# Nous sommes le ${date.toLocaleDateString('fr-FR', options)} ! <a:cat:1310685205547323432>\n\n## Bon anniversaire à ceux qui sont nés un ${date.toLocaleDateString('fr-FR', options2)} ! 🎉`
    };
}
