'use strict';
const { movieGenerator } = require('./kursova');

const movies = require('./movies.json');

const gen = movieGenerator(movies);
console.log(gen.next().value);
console.log(gen.next().value);
