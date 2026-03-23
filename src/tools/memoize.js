'use strict';
const movies = [];
function filterMovies(searchQuery, genre){
    console.log(`Пошук фільму: "${searchQuery}", з жанром: "${genre}"...`);
    const checkMovie = (movie) => { 
        const matchesName = movie.title.includes(searchQuery);
        const matchesGenre = genre ? movie.genre === genre : true;
        return matchesName && matchesGenre;
    };
    return movies.filter(checkMovie);

};

