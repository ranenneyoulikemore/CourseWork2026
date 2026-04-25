'use strict'
import { createMemoizer } from './memoizer.js';
import { BiDirectionalPriorityQueue } from './priorityQueue.js';
import { asyncFindPromise, asyncFindCallback } from './asyncArray.js';

let actorsData = [];
const searchHistoryQueue = new BiDirectionalPriorityQueue();

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
    resultsDiv.innerHTML = actors.map(actor => `
        <div style="border: 1px solid black; padding: 10px; margin: 5px;">
            <h3>${actor.name} (Рейтинг: ${actor.rating})</h3>
            <p>Фільми: ${actor.movies.join(', ')}</p>
        </div>
    `).join('');
}

function handleSearch() {
    const input = document.getElementById('movieInput').value.trim();
    if (!input) return;

    const results = smartSearch(input); 
    const resultsDiv = document.getElementById('results');

    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>Актора не знайдено.</p>';
    } else {
        results.forEach(actor => {
            searchHistoryQueue.enqueue(actor, actor.rating);
        });

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
    const resultsDiv = document.getElementById('results');

    if (!actorsData || actorsData.length === 0) return;

    randomBtn.disabled = true;
    randomBtn.innerText = '⏳ Шукаю...';

    try {
        const targetActor = actorsData[Math.floor(Math.random() * actorsData.length)];
        const asyncPredicate = (actor) => {
            return new Promise(resolve => {
                setTimeout(() => resolve(actor.id === targetActor.id), 100);
            });
        };

        const randomActor = await asyncFindPromise(actorsData, asyncPredicate);

        if (randomActor) {
            renderActorCards([randomActor]);
        }
    } catch (error) {
        resultsDiv.innerHTML = `<p>Помилка: ${error.message}</p>`;
    } finally {
        randomBtn.disabled = false;
        randomBtn.innerText = '🎲 Випадковий актор';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadActorsData(); 
    runCallbackDemo();
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
    document.getElementById('randomBtn').addEventListener('click', handleRandomActor);
});