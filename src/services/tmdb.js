const BASE_URL = 'https://api.themoviedb.org/3';
const TOKEN = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN;

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${TOKEN}`
  }
};

const apiCache = new Map();

async function fetchWithCache(url, cacheDuration = 1000 * 60 * 10) {
  const cached = apiCache.get(url);
  if (cached && Date.now() - cached.timestamp < cacheDuration) {
    return cached.data;
  }
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
  const data = await res.json();
  apiCache.set(url, { data, timestamp: Date.now() });
  return data;
}

const ALLOWED_LANGS = new Set(['en', 'ja', 'ko']);
const EXPLICIT_REGEX = /\b(sex|sexual|erotic|erotica|porn|porno|xxx|nude|nudity|hardcore|fetish|intercourse|sensual|stripper|striptease|lust|orgasm|hibla|vivamax|playboy|penthouse|jav|gravure|uncensored|masturbat|ecchi|hentai|av-idol|blowjob|muscle|hunk|escort|hooker|brothel|manny marquez)\b/i;

export const isValidFilm = (movie, isSearch = false) => {
  if (!movie || movie.adult === true || !movie.poster_path) return false;
  if (!ALLOWED_LANGS.has(movie.original_language)) return false;

  const voteCount = movie.vote_count || 0;
  const popularity = movie.popularity || 0;

  if (isSearch && voteCount === 0 && popularity < 2.0) return false;
  if (movie.original_language === 'ja' && voteCount < 2) return false;

  const text = `${movie.title || ''} ${movie.original_title || ''} ${movie.overview || ''}`;
  return !EXPLICIT_REGEX.test(text);
};

const fetchHomeFeed = async (path) => {
  try {
    const [d1, d2] = await Promise.all([
      fetchWithCache(`${BASE_URL}${path}&page=1`, 1000 * 60 * 5),
      fetchWithCache(`${BASE_URL}${path}&page=2`, 1000 * 60 * 5)
    ]);
    return [...(d1.results || []), ...(d2.results || [])]
      .filter((m) => isValidFilm(m, false))
      .slice(0, 18);
  } catch {
    return [];
  }
};

export const getTrendingMoviesWeek = () => fetchHomeFeed('/trending/movie/week?language=en-US');
export const getTopRatedMovies = () => fetchHomeFeed('/movie/top_rated?language=en-US');
export const getNowPlayingMovies = () => fetchHomeFeed('/movie/now_playing?language=en-US');

export const getUpcomingMovies = () => {
  const today = new Date().toISOString().split('T')[0];
  return fetchHomeFeed(`/discover/movie?include_adult=false&language=en-US&sort_by=popularity.desc&primary_release_date.gte=${today}&with_original_language=en%7Cja%7Cko`);
};

export const searchMovies = async (query, page = 1) => {
  try {
    const p1 = page * 2 - 1;
    const p2 = page * 2;
    const p3 = page * 2 + 1;
    const encoded = encodeURIComponent(query);

    const [d1, d2, d3] = await Promise.all([
      fetchWithCache(`${BASE_URL}/search/movie?query=${encoded}&language=en-US&page=${p1}&include_adult=false`, 1000 * 60 * 3),
      fetchWithCache(`${BASE_URL}/search/movie?query=${encoded}&language=en-US&page=${p2}&include_adult=false`, 1000 * 60 * 3),
      fetchWithCache(`${BASE_URL}/search/movie?query=${encoded}&language=en-US&page=${p3}&include_adult=false`, 1000 * 60 * 3)
    ]);

    const merged = [...(d1.results || []), ...(d2.results || []), ...(d3.results || [])]
      .filter((m) => isValidFilm(m, true));

    return {
      results: merged.slice(0, 30),
      totalPages: Math.max(1, Math.floor((d1.total_pages || 1) / 2))
    };
  } catch {
    return { results: [], totalPages: 1 };
  }
};

export const discoverLetterboxd = async ({
  decade = '',
  year = '',
  primaryReleaseYear = '',
  ratingOrder = '',
  popularTime = '',
  genreId = '',
  page = 1
} = {}) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const p1 = page * 2 - 1;
    const p2 = page * 2;
    const p3 = page * 2 + 1;

    const buildUrl = (pageNum) => {
      let url = `${BASE_URL}/discover/movie?include_adult=false&include_video=false&language=en-US&page=${pageNum}&with_original_language=en%7Cja%7Cko`;
      const exactYear = year || primaryReleaseYear;

      if (exactYear) {
        url += `&primary_release_year=${exactYear}`;
      } else if (decade) {
        const start = parseInt(decade, 10);
        url += `&primary_release_date.gte=${start}-01-01&primary_release_date.lte=${start + 9}-12-31`;
      }

      if (ratingOrder === 'highest') {
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
        url += '&sort_by=popularity.desc&vote_count.gte=20';
      }

      if (genreId) url += `&with_genres=${genreId}`;
      return url;
    };

    const [d1, d2, d3] = await Promise.all([
      fetchWithCache(buildUrl(p1), 1000 * 60 * 5),
      fetchWithCache(buildUrl(p2), 1000 * 60 * 5),
      fetchWithCache(buildUrl(p3), 1000 * 60 * 5)
    ]);

    const merged = [...(d1.results || []), ...(d2.results || []), ...(d3.results || [])]
      .filter((m) => isValidFilm(m, false));

    return {
      results: merged.slice(0, 30),
      totalPages: Math.max(1, Math.floor((d1.total_pages || 1) / 2))
    };
  } catch {
    return { results: [], totalPages: 1 };
  }
};

export const getMovieDetails = (movieId) =>
  fetchWithCache(`${BASE_URL}/movie/${movieId}?language=en-US&append_to_response=credits,videos`);

export const getMovieWatchProviders = async (movieId) => {
  try {
    const data = await fetchWithCache(`${BASE_URL}/movie/${movieId}/watch/providers`);
    return data.results || null;
  } catch {
    return null;
  }
};

export const getMovieRecommendations = async (movieId) => {
  try {
    const [rec, sim] = await Promise.all([
      fetchWithCache(`${BASE_URL}/movie/${movieId}/recommendations?language=en-US&page=1`),
      fetchWithCache(`${BASE_URL}/movie/${movieId}/similar?language=en-US&page=1`)
    ]);

    const seen = new Set();
    return [...(rec.results || []), ...(sim.results || [])]
      .filter((m) => m?.id && m.poster_path && !seen.has(m.id) && seen.add(m.id) && isValidFilm(m, false))
      .slice(0, 16);
  } catch {
    return [];
  }
};

export const getImageUrl = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : 'https://via.placeholder.com/500x750?text=No+Poster';

export const getPersonDetails = (personId) =>
  fetchWithCache(`${BASE_URL}/person/${personId}?language=en-US`);

export const getPersonMovieCredits = (personId) =>
  fetchWithCache(`${BASE_URL}/person/${personId}/movie_credits?language=en-US`);

export const getCompanyDetails = (companyId) =>
  fetchWithCache(`${BASE_URL}/company/${companyId}`);

export const getCompanyMovies = async (companyId, page = 1) => {
  try {
    const p1 = page * 2 - 1;
    const p2 = page * 2;
    const [d1, d2] = await Promise.all([
      fetchWithCache(`${BASE_URL}/discover/movie?with_companies=${companyId}&include_adult=false&language=en-US&sort_by=popularity.desc&page=${p1}&with_original_language=en%7Cja%7Cko`, 1000 * 60 * 5),
      fetchWithCache(`${BASE_URL}/discover/movie?with_companies=${companyId}&include_adult=false&language=en-US&sort_by=popularity.desc&page=${p2}&with_original_language=en%7Cja%7Cko`, 1000 * 60 * 5)
    ]);

    const seen = new Set();
    return [...(d1.results || []), ...(d2.results || [])]
      .filter((m) => m?.id && m.poster_path && !seen.has(m.id) && seen.add(m.id) && isValidFilm(m, false));
  } catch {
    return [];
  }
};