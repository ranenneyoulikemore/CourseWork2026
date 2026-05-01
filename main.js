'use strict'
import { createMemoizer } from './memoizer.js';
import { BiDirectionalPriorityQueue } from './priorityQueue.js';
import { asyncFindPromise, asyncFindCallback } from './asyncArray.js';

let actorsData = [];
const searchHistoryQueue = new BiDirectionalPriorityQueue();
let currentAbortController = null;

function persistHistory() {
    const data = searchHistoryQueue.getItems();
    localStorage.setItem('actorsSearchHistory', JSON.stringify(data));
}

function loadHistoryFromStorage() {
    const saved = localStorage.getItem('actorsSearchHistory');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            searchHistoryQueue.loadItems(parsed);
            console.log("Історію пошуку відновлено з LocalStorage.");
        } catch (e) {
            console.error(e);
        }
    }
}

async function loadActorsData() {
    const response = await fetch('./data/actors.json');
    actorsData = await response.json();
    console.log("База акторів завантажена.");
}

function findActorByName(searchQuery) {
    console.log(`[Пошук в базі]: "${searchQuery}"`);
    const lowerQuery = searchQuery.toLowerCase();
    return actorsData.filter(actor => 
        actor.name.toLowerCase().includes(lowerQuery)
    );
}

const smartSearch = createMemoizer(findActorByName, { maxSize: 3, strategy: 'LRU' });

function renderActorCards(actors) {
    const resultsDiv = document.getElementById('results');
    
    if (actors.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; color:#b4a899;">У колекції нічого не знайдено 🌿</p>';
        return;
    }

    resultsDiv.innerHTML = actors.map(actor => `
        <div class="actor-card">
            <h3>
                ${actor.name} 
                <span class="rating-badge">★ ${actor.rating}</span>
            </h3>
            <p style="margin: 0; color: #555; font-size: 0.95rem; line-height: 1.5;">
                <strong style="color: #3D1F12;">Фільми:</strong> ${actor.movies.join(', ')}
            </p>
        </div>
    `).join('');
}

function handleSearch() {
    const input = document.getElementById('movieInput').value.trim();
    if (!input) return;

    const results = smartSearch(input); 
    const resultsDiv = document.getElementById('results');
    const statusArea = document.getElementById('status-area');

    statusArea.className = ""; 
    statusArea.textContent = "";

    if (results.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; color:#b4a899;">Актора не знайдено.</p>';
    } else {
        results.forEach(actor => {
            searchHistoryQueue.enqueue(actor, actor.rating);
        });

        persistHistory();

        renderActorCards(results);

        console.log("--- Статистика історії пошуку (Черга з пріоритетом) ---");
        const highest = searchHistoryQueue.peek('highest');
        const lowest = searchHistoryQueue.peek('lowest');
        const oldest = searchHistoryQueue.peek('oldest');
        const newest = searchHistoryQueue.peek('newest');

        console.log("Найвищий рейтинг в історії:", highest ? `${highest.name} (${highest.rating})` : "Немає даних");
        console.log("Найнижчий рейтинг в історії:", lowest ? `${lowest.name} (${lowest.rating})` : "Немає даних");
        console.log("Перший запит в історії:", oldest ? oldest.name : "Немає даних");
        console.log("Останній запит в історії:", newest ? newest.name : "Немає даних");
        console.log("---------------------------------------------------------");
    }
}

function runCallbackDemo() {
    const callbackPredicate = (actor, cb) => {
        setTimeout(() => {
            const isMatch = actor.rating > 9.8; 
            cb(null, isMatch);
        }, 50);
    };

    asyncFindCallback(actorsData, callbackPredicate, (error, foundActor) => {
        if (error) {
            console.error(error);
        } else if (foundActor) {
            console.log("Callback-демо знайдено:", foundActor.name);
        }
    });
}

async function handleRandomActor() {
    const randomBtn = document.getElementById('randomBtn');
    const searchBtn = document.getElementById('searchBtn'); 
    const cancelBtn = document.getElementById('cancelBtn');
    const resultsDiv = document.getElementById('results');
    const statusArea = document.getElementById('status-area');

    if (!actorsData || actorsData.length === 0) return;

    try {
        randomBtn.disabled = true;
        searchBtn.disabled = true; 
        cancelBtn.style.display = 'inline-block';
        statusArea.className = "text-info";
        statusArea.textContent = "⏳ Звернення до віддаленої бази даних...";

        resultsDiv.innerHTML = `
            <div class="skeleton">
                <div class="skeleton-line title"></div>
                <div class="skeleton-line text"></div>
                <div class="skeleton-line text-short"></div>
            </div>`;

        currentAbortController = new AbortController();

        const targetActor = actorsData[Math.floor(Math.random() * actorsData.length)];
        const asyncPredicate = (actor) => {
            return new Promise(resolve => {
                setTimeout(() => resolve(actor.id === targetActor.id), 250);
            });
        };

        const randomActor = await asyncFindPromise(
            actorsData, 
            asyncPredicate, 
            { signal: currentAbortController.signal }
        );

        if (randomActor) {
            statusArea.className = "text-success";
            statusArea.textContent = "✨ Актoра успішно підібрано!";
            renderActorCards([randomActor]);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            statusArea.className = "text-error";
            resultsDiv.innerHTML = `
                <div style="text-align:center; padding: 20px; border: 2px dashed #d9534f; border-radius: 12px; background: #fdfaf5;">
                    <p style="color:#d9534f; font-size: 1.1rem; font-weight: 600;">Пошук скасовано користувачем 🛑</p>
                    <p style="color: #666; font-size: 0.9rem; margin-top: 5px;">Ти можеш спробувати ще раз!</p>
                </div>`;
            statusArea.textContent = ""; 
        } else {
            statusArea.className = "text-error";
            statusArea.textContent = `❌ ${error.message}`;
            resultsDiv.innerHTML = "";
        }
    } finally {
        randomBtn.disabled = false;
        searchBtn.disabled = false;
        cancelBtn.style.display = 'none';
        currentAbortController = null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadActorsData(); 
    loadHistoryFromStorage();
    runCallbackDemo();
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('randomBtn').addEventListener('click', handleRandomActor);
    document.getElementById('cancelBtn').addEventListener('click', () => {
        if (currentAbortController) {
            currentAbortController.abort();
        }
    });
});