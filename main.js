'use strict';

import { fetchActorsStream } from './asyncArray.js';
import { createMemoizer } from './memoizer.js';
import { BiDirectionalPriorityQueue } from './priorityQueue.js';

const API_KEY = 'b37fda521ebe1ba79afa34f9da83cc65'; 
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w200';

const searchHistoryQueue = new BiDirectionalPriorityQueue();
let currentAbortController = null;


let favoriteActors = [];
let currentDisplayedActors = []; 


function persistHistory() {
    const data = searchHistoryQueue.getItems();
    localStorage.setItem('actorsSearchHistory', JSON.stringify(data));
}

function loadHistoryFromStorage() {
    const saved = localStorage.getItem('actorsSearchHistory');
    if (saved) {
        try {
            searchHistoryQueue.loadItems(JSON.parse(saved));
            console.log("Історію пошуку відновлено з LocalStorage.");
        } catch (e) {
            console.error(e);
        }
    }
}

function loadFavoritesFromStorage() {
    const saved = localStorage.getItem('favoriteActors');
    if (saved) {
        try {
            favoriteActors = JSON.parse(saved);
            console.log("Улюблених акторів відновлено з LocalStorage.");
        } catch (e) {
            console.error(e);
        }
    }
}

function persistFavorites() {
    localStorage.setItem('favoriteActors', JSON.stringify(favoriteActors));
}

window.toggleFavorite = function(actorId) {
    const index = favoriteActors.findIndex(fav => fav.id === actorId);
    const btn = document.getElementById(`fav-btn-${actorId}`);

    if (index > -1) {
        favoriteActors.splice(index, 1);
        if (btn) btn.textContent = '🤍';
    } else {
        const actor = currentDisplayedActors.find(a => a.id === actorId);
        if (actor) {
            favoriteActors.push(actor);
            if (btn) btn.textContent = '❤️';
        }
    }
    persistFavorites();
};


async function findActorByNameAPI(searchQuery) {
    console.log(`[API Пошук в TMDB]: "${searchQuery}"`);
    const url = `${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&language=uk-UA`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Помилка мережі при зверненні до TMDB');
    
    const data = await response.json();
    const topActors = data.results.slice(0, 5);
    
    const detailedActors = await Promise.all(topActors.map(async (actor) => {
        const detailUrl = `${BASE_URL}/person/${actor.id}?api_key=${API_KEY}&language=uk-UA`;
        const detailRes = await fetch(detailUrl);
        const detailData = detailRes.ok ? await detailRes.json() : {};

        return {
            id: actor.id,
            name: actor.name,
            rating: actor.popularity.toFixed(1),
            movies: actor.known_for ? actor.known_for.map(m => m.title || m.name).filter(Boolean) : [],
            image: actor.profile_path ? `${IMG_URL}${actor.profile_path}` : null,
            biography: detailData.biography || "Біографія відсутня в українській базі TMDB."
        };
    }));

    return detailedActors;
}

const smartSearch = createMemoizer(findActorByNameAPI, { maxSize: 5, strategy: 'LRU' });

function renderActorCards(actors) {
    const resultsDiv = document.getElementById('results');
    currentDisplayedActors = actors; 
    
    if (actors.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; color:#b4a899;">У базі TMDB нічого не знайдено 🌿</p>';
        return;
    }

    resultsDiv.innerHTML = actors.map(actor => {
        const isFav = favoriteActors.some(fav => fav.id === actor.id);
        const heartIcon = isFav ? '❤️' : '🤍';

        return `
        <div class="actor-card" style="display: flex; gap: 15px; align-items: flex-start; position: relative;">
            <button id="fav-btn-${actor.id}" onclick="toggleFavorite(${actor.id})" 
                style="position: absolute; right: 10px; top: 10px; background: none; border: none; font-size: 1.5rem; cursor: pointer; transition: 0.2s;" 
                title="Додати в улюблені">
                ${heartIcon}
            </button>
            ${actor.image 
                ? `<img src="${actor.image}" alt="${actor.name}" class="actor-image">` 
                : `<div class="actor-image skeleton-img" style="display:flex; align-items:center; justify-content:center; color:#b4a899; text-align:center; font-size:12px;">Немає фото</div>`
            }
            <div class="actor-info" style="flex: 1; padding-right: 30px;">
                <h3 style="margin: 0 0 8px 0; display: flex; align-items: center;">
                    ${actor.name} 
                    <span class="rating-badge">🔥 ${actor.rating}</span>
                </h3>
                <p style="margin: 0 0 8px 0; color: #555; font-size: 0.95rem; line-height: 1.5;">
                    <strong style="color: #3D1F12;">Відомі ролі:</strong> 
                    ${actor.movies.length > 0 ? actor.movies.join(', ') : 'Немає інформації'}
                </p>
                <p class="biography-text">
                    <strong style="color: #3D1F12;">Біографія:</strong> ${actor.biography}
                </p>
            </div>
        </div>
    `}).join('');
}


function showFavorites() {
    const resultsDiv = document.getElementById('results');
    const statusArea = document.getElementById('status-area');
    
    
    document.getElementById('movieInput').value = '';

    if (favoriteActors.length === 0) {
        statusArea.textContent = "";
        resultsDiv.innerHTML = '<p style="text-align:center; color:#b4a899;">У тебе ще немає улюблених акторів 💔</p>';
        return;
    }

    statusArea.className = "text-success";
    statusArea.textContent = "⭐ Твої улюблені актори:";
    renderActorCards(favoriteActors);
}


async function handleSearch() {
    const input = document.getElementById('movieInput').value.trim();
    if (!input) return;

    const resultsDiv = document.getElementById('results');
    const statusArea = document.getElementById('status-area');

    statusArea.className = "text-info"; 
    statusArea.textContent = "⏳ Шукаємо в Голлівуді...";
    resultsDiv.innerHTML = `
        <div class="skeleton">
            <div class="skeleton-line title"></div>
            <div class="skeleton-line text"></div>
            <div class="skeleton-line text-short"></div>
        </div>`;

    try {
        const results = await smartSearch(input); 
        statusArea.textContent = "";

        if (results.length === 0) {
            resultsDiv.innerHTML = '<p style="text-align:center; color:#b4a899;">Актора не знайдено.</p>';
        } else {
            results.forEach(actor => searchHistoryQueue.enqueue(actor, parseFloat(actor.rating)));
            persistHistory();
            renderActorCards(results);

            
            console.log("--- Статистика історії пошуку (Черга з пріоритетом) ---");
            const highest = searchHistoryQueue.peek('highest');
            const lowest = searchHistoryQueue.peek('lowest');
            const oldest = searchHistoryQueue.peek('oldest');
            const newest = searchHistoryQueue.peek('newest');

            console.log("Найвищий рейтинг:", highest ? `${highest.name} (${highest.rating})` : "Немає даних");
            console.log("Найнижчий рейтинг:", lowest ? `${lowest.name} (${lowest.rating})` : "Немає даних");
            console.log("Перший запит в історії:", oldest ? oldest.name : "Немає даних");
            console.log("Останній запит в історії:", newest ? newest.name : "Немає даних");
            console.log("---------------------------------------------------------");
        }
    } catch (error) {
        statusArea.className = "text-error";
        statusArea.textContent = `❌ Помилка: ${error.message}`;
        resultsDiv.innerHTML = "";
    }
}

async function handleRandomActor() {
    const randomBtn = document.getElementById('randomBtn');
    const searchBtn = document.getElementById('searchBtn'); 
    const cancelBtn = document.getElementById('cancelBtn');
    const resultsDiv = document.getElementById('results');
    const statusArea = document.getElementById('status-area');

    try {
        randomBtn.disabled = true;
        searchBtn.disabled = true; 
        cancelBtn.style.display = 'inline-block';
        statusArea.className = "text-info";
        statusArea.textContent = "🎲 Вибираємо випадкову зірку...";
        
        resultsDiv.innerHTML = `
            <div class="skeleton">
                <div class="skeleton-line title"></div>
                <div class="skeleton-line text"></div>
            </div>`;

        currentAbortController = new AbortController();

        const randomPage = Math.floor(Math.random() * 50) + 1;
        const url = `${BASE_URL}/person/popular?api_key=${API_KEY}&language=uk-UA&page=${randomPage}`;
        
        const response = await fetch(url, { signal: currentAbortController.signal });
        const data = await response.json();
        
        const randomActorRaw = data.results[Math.floor(Math.random() * data.results.length)];
        
        const detailUrl = `${BASE_URL}/person/${randomActorRaw.id}?api_key=${API_KEY}&language=uk-UA`;
        const detailRes = await fetch(detailUrl, { signal: currentAbortController.signal });
        const detailData = detailRes.ok ? await detailRes.json() : {};
        
        const randomActor = {
            id: randomActorRaw.id,
            name: randomActorRaw.name,
            rating: randomActorRaw.popularity.toFixed(1),
            movies: randomActorRaw.known_for ? randomActorRaw.known_for.map(m => m.title || m.name).filter(Boolean) : [],
            image: randomActorRaw.profile_path ? `${IMG_URL}${randomActorRaw.profile_path}` : null,
            biography: detailData.biography || "Біографія відсутня в українській базі TMDB."
        };

        statusArea.className = "text-success";
        statusArea.textContent = "✨ Актoра успішно підібрано!";
        renderActorCards([randomActor]);

    } catch (error) {
        if (error.name === 'AbortError') {
            statusArea.className = "text-error";
            statusArea.textContent = "🛑 Пошук скасовано";
            resultsDiv.innerHTML = "";
        } else {
            statusArea.className = "text-error";
            statusArea.textContent = `❌ ${error.message}`;
        }
    } finally {
        randomBtn.disabled = false;
        searchBtn.disabled = false;
        cancelBtn.style.display = 'none';
        currentAbortController = null;
    }
}


function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    loadHistoryFromStorage();
    loadFavoritesFromStorage(); 
    
    // Прив'язка кнопок
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('randomBtn').addEventListener('click', handleRandomActor);
    document.getElementById('cancelBtn').addEventListener('click', () => {
        if (currentAbortController) currentAbortController.abort();
    });
    
   
    const showFavBtn = document.getElementById('showFavBtn');
    if (showFavBtn) {
        showFavBtn.addEventListener('click', showFavorites);
    }

    
    const inputField = document.getElementById('movieInput');
    const debouncedSearch = debounce(handleSearch, 600);

    inputField.addEventListener('input', () => {
        const query = inputField.value.trim();
        
        if (query === '') {
            document.getElementById('results').innerHTML = '';
            document.getElementById('status-area').textContent = '';
        } else {
            debouncedSearch();
        }
    });
});