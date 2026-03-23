'use strict';

const movies = require('./movies.json');

function* genMovies(moviesArray) {
    let i = 0;
    while (true) {
        yield moviesArray[i % moviesArray.length]; 
        i++;
    }
}

const carouselMovies = async (interval = 1000, timeoutSec = 10) => {
    const iterator = genMovies(movies); 
    const startTime = Date.now();

    while (true) {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= timeoutSec) break;

        const nextMovie = iterator.next().value;
        console.log(`${nextMovie.title} (${nextMovie.year}) - ${nextMovie.genre}, режисер: ${nextMovie.director}`);

        await new Promise(r => setTimeout(r, interval));
    }
}

carouselMovies(1000, 100);
