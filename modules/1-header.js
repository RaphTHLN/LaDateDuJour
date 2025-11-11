const fs = require("fs");
const path = require("path");
const options = { day: 'numeric', month: 'long', year: 'numeric' };
const options2 = { day: 'numeric', month: 'long' };
const configPath = path.join(__dirname, '..', 'config.json');
const config = fs.existsSync(configPath) ? require(configPath) : {}
const { roleId } = process.env;

module.exports.getSection = async (date, ladatedujour) => {
    const header = `||<@&${roleId}>||
# Nous sommes le ${date.toLocaleDateString("fr-FR", options)} ! <a:cat:1310685205547323432>\n
## Bon anniversaire à ceux qui sont nés un ${date.toLocaleDateString("fr-FR", options2)} ! :tada:`

    return header
}