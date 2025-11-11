const fs = require("fs")
const options = { day: 'numeric', month: 'long', year: 'numeric' };
const options2 = { day: 'numeric', month: 'long' };
const config = fs.existsSync("../config.json") ? require("./config.json") : {}
const roleId = config.roleId ?? "1167616651265577003";

module.exports.getSection = async (date, ladatedujour) => {
    const header = `||<@&${roleId}>||
# Nous sommes le ${date.toLocaleDateString("fr-FR", options)} ! <a:cat:1310685205547323432>\n
## Bon anniversaire à ceux qui sont nés un ${date.toLocaleDateString("fr-FR", options2)} ! :tada:`

    return header
}