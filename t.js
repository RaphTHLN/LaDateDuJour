const a = [0, 5, -10, -1]
        .filter(index => index !== -1)
        .sort((a, b) => a - b)[0];

console.log(a)

let b = [0, 5, 10, 2, -10, -1, Infinity]
let temp = b.filter(e => e > 0)
console.log(Math.min(...temp))


const wiki = require('wikipedia');

wiki.setLang("fr")

const date = new Date();
date.setDate(date.getDate() + 1);
const optionsDay = { day: 'numeric' };
const formattedDay = new Intl.DateTimeFormat('fr-FR', optionsDay).format(date); 
console.log(formattedDay)
const optionsMonth = { month: 'numeric' };
const formattedMonth = new Intl.DateTimeFormat('fr-FR', optionsMonth).format(date);
console.log(formattedMonth)
wiki.onThisDay({ month: formattedMonth, day: formattedDay }).then(a => {
        console.log(a.births.length)
        console.log(a.deaths.length)
        console.log("total: " + (a.deaths.length + a.births.length))
        console.log(Object.keys(a))
})
        