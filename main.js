'use strict'
const createMemoizer = require('./lib/memoizer'); 
const fs = require('fs');

function findActorsByMovie(movieTitle) {
    
    const rawData = fs.readFileSync('./data/actors.json', 'utf8'); 
    const actors = JSON.parse(rawData);
    return actors.filter(a => a.movies.includes(movieTitle));
}

const smartSearch = createMemoizer(findActorsByMovie, { maxSize: 2, strategy: 'LRU' });


console.log("--- Спроба 1 ---");
console.log(smartSearch("Матриця"));
console.log("\n--- Спроба 2 (Кеш) ---");
console.log(smartSearch("Матриця"));