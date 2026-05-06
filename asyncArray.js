'use strict'

export async function* fetchActorsStream(apiBase, apiKey, query) {
    const searchUrl = `${apiBase}/search/person?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=uk-UA`;
    const response = await fetch(searchUrl);
    if (!response.ok) throw new Error('Помилка пошуку в TMDB');

    const data = await response.json();
    const topActors = data.results.slice(0, 3); 
    for (const actor of topActors) {
        const detailUrl = `${apiBase}/person/${actor.id}?api_key=${apiKey}&language=uk-UA`;
        const detailRes = await fetch(detailUrl);
        const detailData = detailRes.ok ? await detailRes.json() : {};

        
        await new Promise(resolve => setTimeout(resolve, 1500));

        yield {
            id: actor.id,
            name: actor.name,
            rating: actor.popularity.toFixed(1),
            movies: actor.known_for ? actor.known_for.map(m => m.title || m.name).filter(Boolean) : [],
            image: actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : null,
            biography: detailData.biography || "Біографія відсутня в українській базі TMDB."
        };
    }
}