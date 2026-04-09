'use strict';

import { memoize } from '../src/tools/memoize.js';


let movies = [];
function filterMovies(searchQuery, genre){
    console.log(`Пошук фільму: "${searchQuery}", з жанром: "${genre}"...`);
    const checkMovie = (movie) => { 
        const matchesName = movie.title.toLowerCase().includes(searchQuery);
        const matchesGenre = genre ? movie.genre === genre : true;
        return matchesName && matchesGenre;
    };
    return movies.filter(checkMovie);

};

const settings = {
    size: 10,
    policy: 'lru'
};

const memoizedFilter = memoize(filterMovies, settings);

const searchInput = document.getElementById('searchInput');
const genreSelect = document.getElementById('genreSelect');

function updateUI() {
    const query = searchInput.value;
    const genre = genreSelect.value;

    const filteredMovies = memoizedFilter(query, genre);

    console.log("Результати для відображення:", filteredMovies);
};

searchInput.addEventListener("input", updateUI);
genreSelect.addEventListener("change", updateUI);

fetch('../src/tools/data/movies.json')
    .then(response => response.json())
    .then(data => {
        movies = data;
        console.log("Успішне завантаження фільмів!", movies)
})

.catch(error => console.error("Помилка завантаження фільмів:", error));
