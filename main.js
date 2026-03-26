'use strict'
import { createMemoizer } from './lib/memoizer.js';

let actorsData = [];


async function loadActorsData() {
    try {
        const response = await fetch('./data/actors.json');
        actorsData = await response.json();
    } catch (error) {
        console.error("Помилка завантаження:", error);
    }
}


function findActorByName(searchQuery) {
    console.log(`[ОБЧИСЛЕННЯ] Шукаємо без кешу: "${searchQuery}"`);
    const lowerQuery = searchQuery.toLowerCase();
    
    return actorsData.filter(actor => 
        actor.name.toLowerCase().includes(lowerQuery) || 
        actor.movies.some(movie => movie.toLowerCase().includes(lowerQuery))
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
            <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 10px; border-radius: 5px;">
                <h3>${actor.name} ⭐ ${actor.rating}</h3>
                <p><strong>Фільми:</strong> ${actor.movies.join(', ')}</p>
            </div>
        `).join('');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadActorsData(); 
    document.getElementById('searchBtn').addEventListener('click', handleSearch);
});