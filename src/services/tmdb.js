const BASE_URL = 'https://api.themoviedb.org/3';
const TOKEN = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN;

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${TOKEN}`
  }
};

// Strict whitelist: Hollywood/English, Japanese, Korean ONLY
const ALLOWED_LANGS = new Set(['en', 'ja', 'ko']);

// Hardened adult/softcore/AV/erotic imprint regex
const EXPLICIT_REGEX = /\b(sex|sexual|erotic|erotica|porn|porno|xxx|nude|nudity|hardcore|fetish|intercourse|sensual|stripper|striptease|lust|orgasm|hibla|vivamax|playboy|penthouse|jav|gravure|uncensored|masturbat|ecchi|hentai|av-idol|blowjob|muscle|hunk|escort|hooker|brothel|manny marquez)\b/i;

export const isValidFilm = (movie, isSearch = false) => {
  if (!movie) return false;
  if (movie.adult === true) return false;
  if (!movie.poster_path) return false;

  // 1. Enforce Language Whitelist
  if (!ALLOWED_LANGS.has(movie.original_language)) {
    return false;
  }

  // 2. Kill Unverified Low-Budget Adult VOD
  // Obscure adult/softcore stubs have 0 ratings or no popularity
  const voteCount = movie.vote_count || 0;
  const popularity = movie.popularity || 0;

  if (isSearch) {
    // If a search result has 0 ratings and negligible popularity, it's an unverified catalog stub
    if (voteCount === 0 && popularity < 2.0) {
      return false;
    }
  }

  // Japanese films must have verified release data to avoid unflagged home AV videos
  if (movie.original_language === 'ja' && voteCount < 2) {
    return false;
  }

  // 3. Text & Imprint Filtering
  const title = movie.title || '';
  const origTitle = movie.original_title || '';
  const overview = movie.overview || '';

  if (EXPLICIT_REGEX.test(title) || EXPLICIT_REGEX.test(origTitle) || EXPLICIT_REGEX.test(overview)) {
    return false;
  }

  return true;
};

// 1. Trending Week (Home Feed: strictly 14 titles)
export const getTrendingMoviesWeek = async () => {
  try {
    const url = `${BASE_URL}/trending/movie/week?language=en-US`;
    const res = await fetch(url, options);
    if (!res.ok) throw new Error('Trending API error');
    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    return results.filter((m) => isValidFilm(m, false)).slice(0, 14);
  } catch (err) {
    console.error('getTrendingMoviesWeek error:', err);
    return [];
  }
};

// 2. Search Movies (28 titles)
export const searchMovies = async (query, page = 1) => {
  try {
    const p1 = page * 2 - 1;
    const p2 = page * 2;
    const url1 = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${p1}&include_adult=false`;
    const url2 = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${p2}&include_adult=false`;

    const [res1, res2] = await Promise.all([fetch(url1, options), fetch(url2, options)]);
    const data1 = res1.ok ? await res1.json() : { results: [] };
    const data2 = res2.ok ? await res2.json() : { results: [] };

    // isSearch = true activates the 0-vote VOD filter
    const merged = [...(data1.results || []), ...(data2.results || [])].filter((m) => isValidFilm(m, true));
    return {
      results: merged.slice(0, 28),
      totalPages: Math.max(1, Math.floor((data1.total_pages || 1) / 2))
    };
  } catch (err) {
    console.error('searchMovies error:', err);
    return { results: [], totalPages: 1 };
  }
};

// 3. Discover Filtered Movies (28 titles)
export const discoverLetterboxd = async ({
  decade = '',
  ratingOrder = '',
  popularTime = 'all',
  genreId = '',
  page = 1
} = {}) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const p1 = page * 2 - 1;
    const p2 = page * 2;

    const buildUrl = (pageNum) => {
      let url = `${BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=${pageNum}&with_original_language=en%7Cja%7Cko`;

      if (decade) {
        const startYear = parseInt(decade, 10);
        url += `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${startYear + 9}-12-31&sort_by=popularity.desc&vote_count.gte=25`;
      } else if (ratingOrder === 'highest') {
        url += `&sort_by=vote_average.desc&vote_count.gte=200&primary_release_date.lte=${today}`;
      } else if (ratingOrder === 'lowest') {
        url += `&sort_by=vote_average.asc&vote_count.gte=50&primary_release_date.lte=${today}`;
      } else if (popularTime === 'week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        url += `&sort_by=popularity.desc&primary_release_date.gte=${d.toISOString().split('T')[0]}&primary_release_date.lte=${today}&vote_count.gte=10`;
      } else if (popularTime === 'month') {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        url += `&sort_by=popularity.desc&primary_release_date.gte=${d.toISOString().split('T')[0]}&primary_release_date.lte=${today}&vote_count.gte=15`;
      } else if (popularTime === 'year') {
        url += `&sort_by=popularity.desc&primary_release_year=${new Date().getFullYear()}&vote_count.gte=20`;
      } else {
        url += `&sort_by=popularity.desc&vote_count.gte=25`;
      }

      if (genreId) {
        url += `&with_genres=${genreId}`;
      }

      return url;
    };

    const [res1, res2] = await Promise.all([fetch(buildUrl(p1), options), fetch(buildUrl(p2), options)]);
    const data1 = res1.ok ? await res1.json() : { results: [] };
    const data2 = res2.ok ? await res2.json() : { results: [] };

    const merged = [...(data1.results || []), ...(data2.results || [])].filter((m) => isValidFilm(m, false));
    return {
      results: merged.slice(0, 28),
      totalPages: Math.max(1, Math.floor((data1.total_pages || 1) / 2))
    };
  } catch (err) {
    console.error('discoverLetterboxd error:', err);
    return { results: [], totalPages: 1 };
  }
};

export const getMovieDetails = async (movieId) => {
  const res = await fetch(`${BASE_URL}/movie/${movieId}?language=en-US&append_to_response=credits`, options);
  if (!res.ok) throw new Error('Failed to fetch movie details');
  return res.json();
};

export const getImageUrl = (path, size = 'w500') => {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
};