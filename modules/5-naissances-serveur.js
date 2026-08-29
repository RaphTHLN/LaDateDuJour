const db = require("../database_manager")


module.exports.getSection = async date => {
    
    let anniversairesMessage = '';
    for (const element of db.getBirthday(date.getDate(), date.getMonth() + 1)) { // JS start month indexing at 0
        anniversairesMessage += `**${element.annee ? element.annee : '????'}** : C'est l'anniversaire de <@${element.user_id}> ! ${element.annee ? date.getFullYear() - element.annee + " ans déjà !" : ""}\n`;
    }
    
    return anniversairesMessage
        ? { id: 'server-birthdays', title: 'Anniversaires du serveur', content: anniversairesMessage.trim() }
        : null;

};
