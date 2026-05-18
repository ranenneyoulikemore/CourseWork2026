'use strict';

import { memoize } from '../src/tools/memoize.js';
import { PriorityQueue } from '../src/tools/priorityQueue.js';
import { EventEmitter } from '../src/tools/eventEmitter.js';

const emitter = new EventEmitter();

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
    
    carouselDisplay.style.backgroundImage = `linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0) 60%), url(${backdrop})`;
    
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
    const response = await fetch(url);
    return await response.json();
}

const settings = { size: 10, policy: 'lru' };
const memoizedFetch = memoize(fetchFromAPI, settings);

const offlineQueue = new PriorityQueue();


emitter.subscribe('FAVORITES_UPDATED', () => {
    const favoritesList = document.getElementById('favoritesList');
    if (favoritesList && favoritesList.style.display !== 'none') {
        renderFavorites(); 
    }
});

emitter.subscribe('MOVIE_ADDED', (title) => {
    alert(`Фільм "${title}" збережено!`);
});

emitter.subscribe('OFFLINE_SYNCED', (count) => {
    alert(`З'єднання відновлено! ${count} фільм(ів) успішно додано до улюблених.`);
});

const loggerAction = (data) => console.log(`[LOG] Подія спрацювала:`, data);
emitter.subscribe('MOVIE_ADDED', loggerAction);
emitter.subscribe('MOVIE_REMOVED', loggerAction);

function saveToFavorites(movieData) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (!favorites.find(fav => fav.id === movieData.id)) {
        favorites.push(movieData);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
}

function syncOfflineActions() {
    if (!navigator.onLine) return;
    
    let syncedCount = 0;
    while (!offlineQueue.isEmpty()) {
        const action = offlineQueue.dequeue('oldest');
        if (action.type === 'ADD_FAVORITE') {
            saveToFavorites(action.data);
            syncedCount++;
        }
    }
    
    if (syncedCount > 0) {
        alert(`З'єднання відновлено! ${syncedCount} фільм(ів) успішно додано до улюблених.`);
        renderFavorites(); 
    }
}

window.addEventListener('online', syncOfflineActions);

window.addToFavoritesFromHome = function(event, id, title, posterPath) {
    event.stopPropagation(); 
    const user = localStorage.getItem('movieUser');

    if (!user) {
        const confirmLogin = confirm("Тільки авторизовані користувачі можуть додавати фільми. Перейдіть на сторінку входу.");
        if (confirmLogin) window.location.href = 'pages/auth/login.html';
        return;
    }

    const movieData = { id: Number(id), title, posterPath };

    if (navigator.onLine) {
        saveToFavorites(movieData);
        alert(`Фільм "${title}" збережено!`);
        renderFavorites();
    } else {
        offlineQueue.enqueue({ type: 'ADD_FAVORITE', data: movieData }, 1);
        alert(`Немає мережі. "${title}" додано до черги і збережеться автоматично.`);
    }
};

function showMovies(movies, isFirstLoad = false) {
    if (isFirstLoad) {
        moviesContainer.innerHTML = ''; 
    }

    if (movies.length === 0 && isFirstLoad) {
        moviesContainer.innerHTML = '<p style="text-align:center; width:100%; color: #3D1F12;">Фільмів не знайдено.</p>';
        return;
    }

    movies.forEach(movie => {
        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');
        movieCard.style.cursor = 'pointer'; 
        movieCard.style.display = 'flex';
        movieCard.style.flexDirection = 'column';

        const posterPath = movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=Немає+постера';

        movieCard.innerHTML = `
            <img src="${posterPath}" alt="${movie.title}" style="width: 100%; border-radius: 8px; margin-bottom: 15px; object-fit: cover;">
            <h3>${movie.title}</h3>
            <p><strong>Рейтинг:</strong> ⭐ ${movie.vote_average.toFixed(1)} / 10</p>
            <p><strong>Дата виходу:</strong> ${movie.release_date}</p>
            
            <div style="margin-top: auto; padding-top: 15px; display: flex; justify-content: center;">
                <button 
                    onclick="addToFavoritesFromHome(event, ${movie.id}, '${movie.title.replace(/'/g, "\\'")}', '${posterPath}')" 
                    style="background: white; border: 1px solid #3D1F12; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 18px; display: flex; justify-content: center; align-items: center; transition: 0.2s;"
                    title="Додати в улюблені"
                    onmouseover="this.style.background='#f0f0f0'"
                    onmouseout="this.style.background='white'">
                    ❤️
                </button>
            </div>
        `;

        movieCard.addEventListener('click', () => {
            window.location.href = `movie-details.html?id=${movie.id}`; 
        });

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

let currentMovieStream = null;

async function* createMovieStream(baseUrl, maxPages = 50) {
    let currentPage = 1;
    while (currentPage <= maxPages) {
        const fullUrl = `${baseUrl}&page=${currentPage}`;
        const data = await memoizedFetch(fullUrl); 
        
        if (!data.results || data.results.length === 0) {
            break; 
        }
        yield data.results; 
        currentPage++;
    }
}

async function consumeNextBatch(isFirstLoad = false) {
    if (!currentMovieStream) return;

    const { value: rawMovies, done } = await currentMovieStream.next()
    if (done) {
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }
    
    const cleanMovies = rawMovies.filter(movie => {
        if (movie.original_language === 'ru') return false;
        return !/[ыэъёЫЭЪЁ]/.test(movie.title + (movie.overview || ''));
    });

    if (isFirstLoad && cleanMovies.length > 0) {
        carouselMovies(cleanMovies.slice(0, 5), 5000);
    }

    showMovies(cleanMovies, isFirstLoad);
}

const loadMoreBtn = document.getElementById('loadMoreBtn');
if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => consumeNextBatch(false));
}

async function getMovies(url) {
    try {
        const cleanUrl = url.replace(/&page=\d+/, '');
        
        currentMovieStream = createMovieStream(cleanUrl);
        
        await consumeNextBatch(true);
        
        if (loadMoreBtn) loadMoreBtn.style.display = 'block';
    } catch (error) {
        console.error("Помилка API:", error);
    }
}

getMovies(`${DISCOVER_URL}&page=1`);

const showFavoritesBtn = document.getElementById('showFavoritesBtn');
const favoritesList = document.getElementById('favoritesList');

favoritesList.style.display = 'none';

showFavoritesBtn.addEventListener('click', () => {
    const isHidden = favoritesList.style.display === 'none';
    favoritesList.style.display = isHidden ? 'flex' : 'none';

    if (isHidden) {
        renderFavorites();
    }
});

function renderFavorites() {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    if (favorites.length === 0) {
        favoritesList.innerHTML = '<p style="color: #3D1F12;">Ваш список улюблених порожній. Додайте щось цікаве!</p>';
        return;
    }

    favoritesList.innerHTML = favorites.map(movie => `
        <div style="width: 150px; background: white; padding: 10px; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); text-align: center;">
            <img src="${movie.posterPath}" alt="${movie.title}" style="width: 100%; border-radius: 8px; margin-bottom: 10px;">
            <h4 style="font-size: 14px; margin-bottom: 10px; color: #3D1F12;">${movie.title}</h4>
            <a href="movie-details.html?id=${movie.id}" style="display: block; background: #3D1F12; color: white; text-decoration: none; padding: 5px; border-radius: 5px; font-size: 12px;">Детальніше</a>
            <button onclick="removeFavorite(${movie.id})" style="margin-top: 5px; background: #d32f2f; color: white; border: none; padding: 5px; border-radius: 5px; font-size: 12px; cursor: pointer; width: 100%;">Видалити</button>
        </div>
    `).join('');
}

window.removeFavorite = function(id) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites = favorites.filter(movie => movie.id !== id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites(); 
};