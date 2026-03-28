'use strict'
import { createMemoizer } from './memoizer.js';

let actorsData = [];


async function loadActorsData() {
    const response = await fetch('./data/actors.json');
    actorsData = await response.json();
    console.log("База акторів завантажена!", actorsData);
}


function findActorByName(searchQuery) {
    console.log(`[ШУКАЄМО В БАЗІ]: "${searchQuery}"`);
    const lowerQuery = searchQuery.toLowerCase();
    
    return actorsData.filter(actor => 
        actor.name.toLowerCase().includes(lowerQuery)
    );
}


const smartSearch = createMemoizer(findActorByName, { maxSize: 3, strategy: 'LRU' });


function handleSearch() {
    const input = document.getElementById('movieInput').value.trim();
    if (!input) return;

    const results = smartSearch(input); 
    const resultsDiv = document.getElementById('results');

    if (results.length === 0) {
        resultsDiv.innerHTML = '<p>Актора не знайдено.</p>';
    } else {
        resultsDiv.innerHTML = results.map(actor => `
            <div style="border: 1px solid black; padding: 10px; margin: 5px;">
                <h3>${actor.name} (Рейтинг: ${actor.rating})</h3>
                <p>Фільми: ${actor.movies.join(', ')}</p>
            </div>
        `).join('');
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    await loadActorsData(); 
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
});