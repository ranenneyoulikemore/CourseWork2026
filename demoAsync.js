'use strict';

import { asyncFilterCallback, asyncFilterPromise } from './asyncFilter.js';

const movies = [
    { title: "Матриця", year: 1999 },
    { title: "Дюна", year: 2021 },
    { title: "Джокер", year: 2019 }
];

function logState(taskName, state, data = "") {
    console.log(`[${taskName}] Стан: ${state} ${data ? '-> ' + data : ''}`);
}

export function demoCallback() {
    logState('Callback Demo', 'LOADING', 'Пошук нових фільмів...');
    const isNewMovieCb = (movie, cb) => setTimeout(() => cb(null, movie.year > 2000), 1000);

    asyncFilterCallback(movies, isNewMovieCb, (err, result) => {
        if (err) logState('Callback Demo', 'ERROR', err.message);
        else logState('Callback Demo', 'SUCCESS', result.map(m => m.title).join(', '));
    });
}

export async function demoPromise() {
    logState('Promise Demo', 'LOADING', 'Пошук нових фільмів...');
    const isNewMoviePromise = async (movie) => new Promise(resolve => setTimeout(() => resolve(movie.year > 2000), 1000));

    try {
        const result = await asyncFilterPromise(movies, isNewMoviePromise);
        logState('Promise Demo', 'SUCCESS', result.map(m => m.title).join(', '));
    } catch (err) {
        logState('Promise Demo', 'ERROR', err.message);
    }
}