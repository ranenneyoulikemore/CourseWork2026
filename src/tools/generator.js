"use strict";
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
    
    carouselDisplay.style.backgroundImage = `url(${backdrop})`;
    
    carouselDisplay.innerHTML = `
        <div class="carousel-info">
            <span class="carousel-badge">Фільм дня</span>
            <h1 class="carousel-title">${movie.title}</h1>
            <p class="carousel-desc">${movie.overview ? movie.overview.substring(0, 200) + '...' : "Опис українською готується..."}</p>
            <div class="carousel-rating">⭐ ${movie.vote_average.toFixed(1)}</div>
        </div>
    `;
}
