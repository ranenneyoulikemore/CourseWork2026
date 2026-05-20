import { PriorityQueue } from '../src/tools/priorityQueue.js';
import { apiProxy } from '../src/tools/authProxy.js';

const API_KEY = 'b37fda521ebe1ba79afa34f9da83cc65';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

apiProxy.setStrategy('apiKey', { apiKey: API_KEY });

const offlineQueue = new PriorityQueue();

const urlParams = new URLSearchParams(window.location.search);
const movieId = urlParams.get('id');

function saveToFavorites(movieData) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    if (!favorites.find(fav => fav.id === movieData.id)) {
        favorites.push(movieData);
        localStorage.setItem('favorites', JSON.stringify(favorites));
    }
}

function syncOfflineActions() {
    if (!navigator.onLine) return;
    while (!offlineQueue.isEmpty()) {
        const action = offlineQueue.dequeue('oldest');
        if (action.type === 'ADD_FAVORITE') {
            saveToFavorites(action.data);
        }
    }
}

window.addEventListener('online', syncOfflineActions);

async function getMovieDetails() {
    if (!movieId) {
        document.body.innerHTML = '<h2 style="text-align:center; margin-top:50px; color: #3D1F12;">Фільм не знайдено</h2>';
        return;
    }

    try {
        const response = await apiProxy.fetch(`${BASE_URL}/movie/${movieId}?language=uk-UA`);
        const movie = await response.json();

        const posterPath = movie.poster_path ? IMG_URL + movie.poster_path : 'https://via.placeholder.com/500x750?text=Немає+постера';
        
        const runtimeStr = movie.runtime ? `${Math.floor(movie.runtime / 60)} год ${movie.runtime % 60} хв` : 'Невідомо';
        const tagline = movie.tagline ? `<h4 style="font-style: italic; color: #777; margin-top: -10px; margin-bottom: 20px; font-weight: normal;">"${movie.tagline}"</h4>` : '';
        const countries = movie.production_countries ? movie.production_countries.map(c => c.name).join(', ') : 'Невідомо';

        const container = document.getElementById('movieContainer') || document.body;

        container.innerHTML = `
            <div style="background: white; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); display: flex; flex-wrap: wrap; gap: 40px; padding: 40px; justify-content: center; color: #3D1F12; max-width: 1100px; margin: 40px auto; position: relative;">
                
                <img src="${posterPath}" alt="${movie.title}" style="width: 350px; border-radius: 12px; box-shadow: 0 8px 20px rgba(0,0,0,0.2); object-fit: cover; height: fit-content;">
                
                <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column;">
                    <h1 style="margin-bottom: 5px; font-size: 2.5em; text-transform: uppercase;">${movie.title}</h1>
                    ${tagline}
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 25px; flex-wrap: wrap;">
                        <span style="background: #3D1F12; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.2);">⭐ ${movie.vote_average.toFixed(1)} / 10</span>
                        <span style="background: #F3EFE6; color: #3D1F12; padding: 8px 16px; border-radius: 20px; font-weight: bold; border: 1px solid #d4cbb3;">🕒 ${runtimeStr}</span>
                        <span style="background: #F3EFE6; color: #3D1F12; padding: 8px 16px; border-radius: 20px; font-weight: bold; border: 1px solid #d4cbb3;">📅 ${movie.release_date}</span>
                    </div>

                    <p style="font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #F3EFE6; padding-bottom: 10px;">
                        <strong>Жанри:</strong> ${movie.genres.map(g => g.name).join(', ')}
                    </p>
                    <p style="font-size: 18px; margin-bottom: 25px; border-bottom: 1px solid #F3EFE6; padding-bottom: 10px;">
                        <strong>Країна:</strong> ${countries}
                    </p>
                    
                    <h3 style="margin-bottom: 15px; font-size: 22px;">Опис:</h3>
                    <p style="font-size: 16px; line-height: 1.8; text-align: justify; margin-bottom: 30px;">${movie.overview || 'Опис українською мовою наразі відсутній.'}</p>
                    
                    <button id="favoriteBtn" style="align-self: flex-start; background: #3D1F12; color: white; border: none; padding: 12px 25px; font-size: 16px; font-weight: bold; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 10px rgba(61, 31, 18, 0.3); transition: transform 0.2s;">
                        ❤️ Додати в улюблені
                    </button>
                </div>
            </div>
        `;

        const favBtn = document.getElementById('favoriteBtn');

        favBtn.addEventListener('click', () => {
            const user = localStorage.getItem('movieUser');

            if (!user) {
                const confirmLogin = confirm("Тільки авторизовані користувачі можуть додавати фільми в улюблені. Бажаєте перейти на сторінку входу?");
                if (confirmLogin) window.location.href = '../auth/login.html'; 
                return;
            }

            const movieData = {
                id: movie.id,
                title: movie.title,
                posterPath: posterPath
            };

            if (navigator.onLine) {
                saveToFavorites(movieData);
                alert(`Фільм "${movie.title}" додано!`);
                favBtn.innerHTML = '✔️ В улюблених';
                favBtn.style.background = '#2e7d32';
            } else {
                offlineQueue.enqueue({ type: 'ADD_FAVORITE', data: movieData }, 1);
                alert("Ви офлайн. Фільм додано до черги і буде збережений автоматично, коли з'явиться інтернет.");
                favBtn.innerHTML = '⏳ В черзі (офлайн)';
                favBtn.style.background = '#ffa000';
            }
        });

    } catch (error) {
        document.getElementById('movieContainer').innerHTML = '<h2 style="text-align:center; margin-top:50px; color: red;">Помилка завантаження даних.</h2>';
    }
}

getMovieDetails();