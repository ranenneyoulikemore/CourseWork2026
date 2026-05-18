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


function getBadgeClass(rating) {
    const r = parseFloat(rating);
    if (r >= 20) return 'badge-high';
    if (r >= 5) return 'badge-mid';
    return 'badge-low';
}

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
                    <span class="rating-badge ${getBadgeClass(actor.rating)}">🔥 ${actor.rating}</span>
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
    `;}).join('');
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
        <div class="skeleton-card">
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

            console.log("Статистика історії пошуку (Черга з пріоритетом)");
            const highest = searchHistoryQueue.peek('highest');
            const lowest = searchHistoryQueue.peek('lowest');
            const oldest = searchHistoryQueue.peek('oldest');
            const newest = searchHistoryQueue.peek('newest');

            console.log("Найвищий рейтинг:", highest ? `${highest.name} (${highest.rating})` : "Немає даних");
            console.log("Найнижчий рейтинг:", lowest ? `${lowest.name} (${lowest.rating})` : "Немає даних");
            console.log("Перший запит в історії:", oldest ? oldest.name : "Немає даних");
            console.log("Останній запит в історії:", newest ? newest.name : "Немає даних");
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
            <div class="skeleton-card">
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

async function handleStreamSearch() {
    const input = document.getElementById('movieInput').value.trim();
    if (!input) return;

    const resultsDiv = document.getElementById('results');
    const statusArea = document.getElementById('status-area');

    statusArea.className = "text-info";
    statusArea.textContent = "🌊 Завантажуємо акторів по черзі...";
    resultsDiv.innerHTML = ''; 

    try {
        const stream = fetchActorsStream(BASE_URL, API_KEY, input);

        for await (const actor of stream) {
            const actorHtml = `
                <div class="actor-card" style="display: flex; gap: 15px; align-items: flex-start; margin-top: 15px;">
                    ${actor.image 
                        ? `<img src="${actor.image}" alt="${actor.name}" class="actor-image">` 
                        : `<div class="actor-image skeleton-img" style="display:flex; align-items:center; justify-content:center; color:#b4a899; text-align:center; font-size:12px;">Немає фото</div>`
                    }
                    <div class="actor-info" style="flex: 1;">
                        <h3 style="margin: 0 0 8px 0;">${actor.name} <span class="rating-badge ${getBadgeClass(actor.rating)}">🔥 ${actor.rating}</span></h3>
                        <p style="margin: 0 0 8px 0; color: #555; font-size: 0.95rem;">
                            <strong style="color: #3D1F12;">Відомі ролі:</strong> ${actor.movies.length > 0 ? actor.movies.join(', ') : 'Немає інформації'}
                        </p>
                        <p class="biography-text"><strong style="color: #3D1F12;">Біографія:</strong> ${actor.biography}</p>
                    </div>
                </div>
            `;
            resultsDiv.insertAdjacentHTML('beforeend', actorHtml);
        }
        statusArea.textContent = "";
    } catch (error) {
        statusArea.className = "text-error";
        statusArea.textContent = `❌ Помилка: ${error.message}`;
    }
}

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

async function loadTrendingActorsBanner() {
    const bannerStrip = document.getElementById('actors-banner-strip');
    const url = `${BASE_URL}/person/popular?api_key=${API_KEY}&language=uk-UA&page=1`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Помилка завантаження трендів');
        
        const data = await response.json();
        const topActors = data.results.slice(0, 8); 

        bannerStrip.innerHTML = topActors
            .map(actor => {
                const imgPath = actor.profile_path ? `${IMG_URL}${actor.profile_path}` : null;
                if (!imgPath) return ''; 
                return `<img src="${imgPath}" alt="${actor.name}" class="banner-actor-photo">`;
            })
            .join('');

    } catch (error) {
        console.error('Помилка банера:', error);
        if (bannerStrip) bannerStrip.style.background = '#2a1b12'; 
    }
}

function handleHistoryClick(criteria) {
    const actor = searchHistoryQueue.peek(criteria);
    const historyResultDiv = document.getElementById('history-result');

    document.querySelectorAll('.hist-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-hist-${criteria}`).classList.add('active');

    if (!actor) {
        historyResultDiv.innerHTML = '<div class="history-empty-state" style="text-align:center; color:#8c7b6d; margin: auto;">У черзі порожньо 🕵️‍♂️<br><span style="font-size:0.8rem;">(спробуйте знайти когось)</span></div>';
        return;
    }

    historyResultDiv.innerHTML = `
        <div class="actor-card" style="margin: 0; box-shadow: none; border: none; width: 100%; background: transparent; display: flex; gap: 15px; align-items: flex-start;">
            ${actor.image 
                ? `<img src="${actor.image}" alt="${actor.name}" class="actor-image">` 
                : `<div class="actor-image skeleton-img" style="display:flex; align-items:center; justify-content:center; background:#faf8f5; border: 2px dashed #d1c5b4; color:#a3978a; text-align:center; padding:10px;">Немає фото</div>`
            }
            <div class="actor-info" style="flex: 1;">
                <h3 style="margin: 0 0 8px 0;">${actor.name} <span class="rating-badge ${getBadgeClass(actor.rating)}">🔥 ${actor.rating}</span></h3>
                <p style="margin: 0 0 8px 0; color: #555; font-size: 0.95rem;">
                    <strong style="color: #3D1F12;">Ролі:</strong> ${actor.movies.length > 0 ? actor.movies.join(', ') : 'Немає інформації'}
                </p>
                <div class="actor-biography"><strong style="color: #3D1F12;">Біографія:</strong> ${actor.biography}</div>
                <button id="delete-history-btn" style="margin-top: 15px; background-color: #d9534f; color: white; padding: 10px 15px; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;">
                    🗑 Вилучити з черги
                </button>
            </div>
        </div>
    `;

    const delBtn = document.getElementById('delete-history-btn');
    delBtn.addEventListener('mouseenter', () => delBtn.style.backgroundColor = '#c9302c');
    delBtn.addEventListener('mouseleave', () => delBtn.style.backgroundColor = '#d9534f');

    delBtn.addEventListener('click', () => {
        searchHistoryQueue.dequeue(criteria);
        persistHistory();
        historyResultDiv.innerHTML = '<div class="history-empty-state" style="color:#2e7d32; text-align:center; margin: auto;">✅ Успішно вилучено!</div>';
        document.getElementById(`btn-hist-${criteria}`).classList.remove('active');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadHistoryFromStorage();
    loadFavoritesFromStorage(); 
    loadTrendingActorsBanner();
    
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('randomBtn').addEventListener('click', handleRandomActor);
    document.getElementById('streamBtn').addEventListener('click', handleStreamSearch); 
    
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

    if(document.getElementById('btn-hist-highest')) {
        document.getElementById('btn-hist-highest').addEventListener('click', () => handleHistoryClick('highest'));
        document.getElementById('btn-hist-lowest').addEventListener('click', () => handleHistoryClick('lowest'));
        document.getElementById('btn-hist-oldest').addEventListener('click', () => handleHistoryClick('oldest'));
        document.getElementById('btn-hist-newest').addEventListener('click', () => handleHistoryClick('newest'));
    }
});