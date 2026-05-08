'use strict';
import { memoize } from '../src/tools/memoize.js';

let currentCarouselId = 0; 

function* genMovies(moviesArray) {
    let i = 0;
    while (true) {
        yield moviesArray[i % moviesArray.length]; 
        i++;
    }
}

const carouselMovies = async (moviesArray, interval = 5000) => {
    currentCarouselId++; 
    const myId = currentCarouselId; 
    const iterator = genMovies(moviesArray); 

    while (myId === currentCarouselId) { 
        const nextMovie = iterator.next().value;
        updateCarouselDOM(nextMovie);
        await new Promise(r => setTimeout(r, interval));
    }
}

function updateCarouselDOM(movie) {
    const carouselDisplay = document.getElementById('carouselDisplay');
    if (!carouselDisplay) return;
    
    const BACKDROP_URL = 'https://image.tmdb.org/t/p/original';
    const backdrop = movie.backdrop_path ? BACKDROP_URL + movie.backdrop_path : '';
    
    carouselDisplay.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.1) 100%), url(${backdrop})`;
    
    carouselDisplay.innerHTML = `
        <div class="carousel-info">
            <span class="carousel-badge">Фільм дня</span>
            <h1 class="carousel-title">${movie.title}</h1>
            <p class="carousel-desc">${movie.overview ? movie.overview.substring(0, 200) + '...' : "Опис українською готується..."}</p>
            <div class="carousel-rating">⭐ ${movie.vote_average.toFixed(1)}</div>
        </div>
    `;
}

const API_KEY = 'b37fda521ebe1ba79afa34f9da83cc65'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const DISCOVER_URL = `${BASE_URL}/discover/movie?api_key=${API_KEY}&language=uk-UA&region=UA&sort_by=popularity.desc&without_original_language=ru`;
const SEARCH_URL = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=uk-UA&region=UA`;

const searchInput = document.getElementById('searchInput');
const genreSelect = document.getElementById('genreSelect');
const moviesContainer = document.getElementById('moviesContainer');

async function fetchFromAPI(url) {
    console.log("Йдемо в інтернет за:", url); 
    const response = await fetch(url);
    return await response.json();
}

const settings = { size: 10, policy: 'lru' };
const memoizedFetch = memoize(fetchFromAPI, settings);

async function getMovies(url) {
    try {
        const data = await memoizedFetch(url);
        
        const cleanMovies = data.results.filter(movie => {
            if (movie.original_language === 'ru') return false;
            if (/[ыэъёЫЭЪЁ]/.test(movie.title)) return false;
            if (/[ыэъёЫЭЪЁ]/.test(movie.overview)) return false;
            return true; 
        });

        if (cleanMovies.length > 0) {
            carouselMovies(cleanMovies.slice(0, 5), 5000);
        }

        showMovies(cleanMovies);
    } catch (error) {
        console.error("Помилка API або кешу:", error);
    }
}

function showMovies(movies) {
    moviesContainer.innerHTML = ''; 

    if (movies.length === 0) {
        moviesContainer.innerHTML = '<p style="text-align:center; width:100%; color: white;">Фільмів не знайдено.</p>';
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

if (genreSelect) {
    genreSelect.addEventListener('change', (e) => {
        const genreId = e.target.value;
        if (searchInput) searchInput.value = ''; 

        if (genreId !== '') {
            getMovies(`${DISCOVER_URL}&with_genres=${genreId}&page=1`);
        } else {
            getMovies(`${DISCOVER_URL}&page=1`);
        }
    });
}

if (searchInput) {
    let timeoutId;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        if (genreSelect) genreSelect.value = ''; 

        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            if (query) {
                getMovies(`${SEARCH_URL}&query=${encodeURIComponent(query)}&page=1`);
            } else {
                getMovies(`${DISCOVER_URL}&page=1`);
            }
        }, 500);
    });
}

getMovies(`${DISCOVER_URL}&page=1`);

let currentMovieStream = null;

async function* createMovieStream(baseUrl, maxPages = 50) {
    let currentPage = 1;
    while (currentPage <= maxPages) {
        const response = await fetch(`${baseUrl}&page=${currentPage}`);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            break; 
        }
        yield data.results; 
        currentPage++;
    }
}

async function consumeNextBatch(isFirstLoad = false) {
    if (!currentMovieStream) return;

    const { value: rawMovies, done } = await currentMovieStream.next();

    if (done) {
        console.log("Всі дані з потоку оброблено");
        return;
    }
    const cleanMovies = rawMovies.filter(movie => {
        if (movie.original_language === 'ru') return false;
        return !/[ыэъёЫЭЪЁ]/.test(movie.title + (movie.overview || ''));
    });

    showMovies(cleanMovies, isFirstLoad);
}