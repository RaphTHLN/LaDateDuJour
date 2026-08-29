const fs = require("fs")
const path = require("path")
const acnhDB = JSON.parse(
    fs.readFileSync(path.join(__dirname, '..', 'acnh_database.json'), 'utf-8')
);
function getVillagerBirthday(date = new Date()) {

  const mois = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const day = String(date.getDate()).padStart(2, '0');
  const monthName = mois[date.getMonth()];
  
  const villagers = acnhDB[monthName]?.[day];
  if (villagers) {
  return villagers.includes(" et ")
    ? villagers.split (" et ").map(name => name.trim ())
    : [villagers];
    } else {
    return [];
    }
}

module.exports.getSection = async date => {
    const acBirthdays = getVillagerBirthday(date);
    const acMessage = acBirthdays.length > 0
        ? `🎉 Sur **Animal Crossing** c'est l'anniversaire de ${acBirthdays.map(n => `- ${n}`).join(', ')}`
        : "";
    
    return acMessage
        ? { id: 'animal-crossing', title: 'Animal Crossing', content: acMessage }
        : null;

};
