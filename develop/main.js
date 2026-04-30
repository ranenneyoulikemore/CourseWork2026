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


const API_KEY = 'b37fda521ebe1ba79afa34f9da83cc65'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const API_URL = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=uk-UA&region=UA&sort_by=popularity.desc&without_original_language=ru&page=1`;
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const moviesContainer = document.getElementById('moviesContainer');
async function getMovies(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        const cleanMovies = data.results.filter(movie => {
            if (movie.original_language === 'ru') {
                return false;
            }

            const hasRussianLetters = /[ыэъёЫЭЪЁ]/.test(movie.title);
            if (hasRussianLetters) {
                return false;
            }
            const hasRussianInOverview = /[ыэъёЫЭЪЁ]/.test(movie.overview);
            if (hasRussianInOverview) return false;
            
            return true; 
        });

        console.log("Ідеально чисті фільми:", cleanMovies);
        showMovies(cleanMovies);
    } catch (error) {
        console.error("Помилка:", error);
    }
}

function showMovies(movies) {
    moviesContainer.innerHTML = ''; 

    if (movies.length === 0) {
        moviesContainer.innerHTML = '<p style="text-align:center; width:100%;">Фільмів не знайдено.</p>';
        return;
    }

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        const posterPath = movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=Немає+постера';

        movieCard.innerHTML = `
            <img src="${posterPath}" alt="${movie.title}" style="width: 100%; border-radius: 8px; margin-bottom: 15px; object-fit: cover;">
            <h3>${movie.title}</h3>
            <p><strong>Рейтинг:</strong> ⭐ ${movie.vote_average.toFixed(1)} / 10</p>
            <p><strong>Дата виходу:</strong> ${movie.release_date}</p>
        `;

        moviesContainer.appendChild(movieCard);
    });
}

getMovies(API_URL);