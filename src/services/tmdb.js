const BASE_URL = 'https://api.themoviedb.org/3';
const TOKEN = import.meta.env.VITE_TMDB_READ_ACCESS_TOKEN;

const options = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${TOKEN}`
  }
};

// In-memory cache for API calls (10 minutes TTL)
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
  const voteCount = movie.vote_count || 0;
  const popularity = movie.popularity || 0;

  if (isSearch) {
    if (voteCount === 0 && popularity < 2.0) {
      return false;
    }
  }

  // Japanese films must have verified release data
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

// 1. Trending Week (Home Feed: strictly 18 titles)
export const getTrendingMoviesWeek = async () => {
  try {
    const url1 = `${BASE_URL}/trending/movie/week?language=en-US&page=1`;
    const url2 = `${BASE_URL}/trending/movie/week?language=en-US&page=2`;
    
    const [data1, data2] = await Promise.all([
      fetchWithCache(url1, 1000 * 60 * 5),
      fetchWithCache(url2, 1000 * 60 * 5)
    ]);

    const merged = [...(data1.results || []), ...(data2.results || [])];
    return merged.filter((m) => isValidFilm(m, false)).slice(0, 18);
  } catch (err) {
    console.error('getTrendingMoviesWeek error:', err);
    return [];
  }
};

// 1b. Top Rated Movies (Home Feed: strictly 18 titles)
export const getTopRatedMovies = async () => {
  try {
    const url1 = `${BASE_URL}/movie/top_rated?language=en-US&page=1`;
    const url2 = `${BASE_URL}/movie/top_rated?language=en-US&page=2`;

    const [data1, data2] = await Promise.all([
      fetchWithCache(url1, 1000 * 60 * 5),
      fetchWithCache(url2, 1000 * 60 * 5)
    ]);

    const merged = [...(data1.results || []), ...(data2.results || [])];
    return merged.filter((m) => isValidFilm(m, false)).slice(0, 18);
  } catch (err) {
    console.error('getTopRatedMovies error:', err);
    return [];
  }
};

// 1c. In Theaters / Now Playing (Home Feed: strictly 18 titles)
export const getNowPlayingMovies = async () => {
  try {
    const url1 = `${BASE_URL}/movie/now_playing?language=en-US&page=1`;
    const url2 = `${BASE_URL}/movie/now_playing?language=en-US&page=2`;

    const [data1, data2] = await Promise.all([
      fetchWithCache(url1, 1000 * 60 * 5),
      fetchWithCache(url2, 1000 * 60 * 5)
    ]);

    const merged = [...(data1.results || []), ...(data2.results || [])];
    return merged.filter((m) => isValidFilm(m, false)).slice(0, 18);
  } catch (err) {
    console.error('getNowPlayingMovies error:', err);
    return [];
  }
};

// 1d. Upcoming Movies (High-profile upcoming films: release date >= today sorted by popularity)
export const getUpcomingMovies = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const url1 = `${BASE_URL}/discover/movie?include_adult=false&language=en-US&page=1&sort_by=popularity.desc&primary_release_date.gte=${today}&with_original_language=en%7Cja%7Cko`;
    const url2 = `${BASE_URL}/discover/movie?include_adult=false&language=en-US&page=2&sort_by=popularity.desc&primary_release_date.gte=${today}&with_original_language=en%7Cja%7Cko`;

    const [data1, data2] = await Promise.all([
      fetchWithCache(url1, 1000 * 60 * 5),
      fetchWithCache(url2, 1000 * 60 * 5)
    ]);

    const merged = [...(data1.results || []), ...(data2.results || [])];
    return merged.filter((m) => isValidFilm(m, false)).slice(0, 18);
  } catch (err) {
    console.error('getUpcomingMovies error:', err);
    return [];
  }
};

// 2. Search Movies (30 titles)
export const searchMovies = async (query, page = 1) => {
  try {
    const p1 = page * 2 - 1;
    const p2 = page * 2;
    const p3 = page * 2 + 1;
    
    const url1 = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${p1}&include_adult=false`;
    const url2 = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${p2}&include_adult=false`;
    const url3 = `${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&language=en-US&page=${p3}&include_adult=false`;

    const [data1, data2, data3] = await Promise.all([
      fetchWithCache(url1, 1000 * 60 * 3), 
      fetchWithCache(url2, 1000 * 60 * 3),
      fetchWithCache(url3, 1000 * 60 * 3)
    ]);

    const merged = [
      ...(data1.results || []), 
      ...(data2.results || []),
      ...(data3.results || [])
    ].filter((m) => isValidFilm(m, true));

    return {
      results: merged.slice(0, 30),
      totalPages: Math.max(1, Math.floor((data1.total_pages || 1) / 2))
    };
  } catch (err) {
    console.error('searchMovies error:', err);
    return { results: [], totalPages: 1 };
  }
};

// 3. Discover Filtered Movies (30 titles, supporting combined filters)
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

      // 1. Release Year / Decade Filter
      const exactYear = year || primaryReleaseYear;
      if (exactYear) {
        url += `&primary_release_year=${exactYear}`;
      } else if (decade) {
        const startYear = parseInt(decade, 10);
        url += `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${startYear + 9}-12-31`;
      }

      // 2. Acclaim or Popularity Sort / Date Bounds
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
        url += `&sort_by=popularity.desc&vote_count.gte=20`;
      }

      // 3. Multi-genre handling (comma-separated for OR)
      if (genreId) {
        url += `&with_genres=${genreId}`;
      }

      return url;
    };

    const [data1, data2, data3] = await Promise.all([
      fetchWithCache(buildUrl(p1), 1000 * 60 * 5), 
      fetchWithCache(buildUrl(p2), 1000 * 60 * 5),
      fetchWithCache(buildUrl(p3), 1000 * 60 * 5)
    ]);

    const merged = [
      ...(data1.results || []), 
      ...(data2.results || []),
      ...(data3.results || [])
    ].filter((m) => isValidFilm(m, false));

    return {
      results: merged.slice(0, 30),
      totalPages: Math.max(1, Math.floor((data1.total_pages || 1) / 2))
    };
  } catch (err) {
    console.error('discoverLetterboxd error:', err);
    return { results: [], totalPages: 1 };
  }
};

export const getMovieDetails = async (movieId) => {
  return fetchWithCache(`${BASE_URL}/movie/${movieId}?language=en-US&append_to_response=credits,videos`);
};

// Fetch Watch Providers (Streaming, Rent, Buy)
export const getMovieWatchProviders = async (movieId) => {
  try {
    const data = await fetchWithCache(`${BASE_URL}/movie/${movieId}/watch/providers`);
    return data.results || null;
  } catch (err) {
    console.error('getMovieWatchProviders error:', err);
    return null;
  }
};

// Fetch Recommended & Similar Movies
export const getMovieRecommendations = async (movieId) => {
  try {
    const [recData, simData] = await Promise.all([
      fetchWithCache(`${BASE_URL}/movie/${movieId}/recommendations?language=en-US&page=1`),
      fetchWithCache(`${BASE_URL}/movie/${movieId}/similar?language=en-US&page=1`)
    ]);

    const combined = [...(recData.results || []), ...(simData.results || [])];
    const map = new Map();
    combined.forEach((m) => {
      if (m.id && m.poster_path && !map.has(m.id)) {
        map.set(m.id, m);
      }
    });

    return Array.from(map.values())
      .filter((m) => isValidFilm(m, false))
      .slice(0, 16);
  } catch (err) {
    console.error('getMovieRecommendations error:', err);
    return [];
  }
};

export const getImageUrl = (path, size = 'w500') => {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : 'https://via.placeholder.com/500x750?text=No+Poster';
};

// Fetch person details (biography, birthday, place of birth)
export async function getPersonDetails(personId) {
  return fetchWithCache(`${BASE_URL}/person/${personId}?language=en-US`);
}

// Fetch person movie credits (cast & crew filmography)
export async function getPersonMovieCredits(personId) {
  return fetchWithCache(`${BASE_URL}/person/${personId}/movie_credits?language=en-US`);
}

// Fetch production company / studio details
export async function getCompanyDetails(companyId) {
  return fetchWithCache(`${BASE_URL}/company/${companyId}`);
}

// Fetch movies produced by a company / studio
export async function getCompanyMovies(companyId, page = 1) {
  try {
    const url1 = `${BASE_URL}/discover/movie?with_companies=${companyId}&include_adult=false&language=en-US&sort_by=popularity.desc&page=${page * 2 - 1}&with_original_language=en%7Cja%7Cko`;
    const url2 = `${BASE_URL}/discover/movie?with_companies=${companyId}&include_adult=false&language=en-US&sort_by=popularity.desc&page=${page * 2}&with_original_language=en%7Cja%7Cko`;

    const [data1, data2] = await Promise.all([
      fetchWithCache(url1, 1000 * 60 * 5),
      fetchWithCache(url2, 1000 * 60 * 5)
    ]);

    const merged = [...(data1.results || []), ...(data2.results || [])].filter((m) => isValidFilm(m, false));
    const map = new Map();
    merged.forEach((m) => {
      if (m.id && m.poster_path && !map.has(m.id)) {
        map.set(m.id, m);
      }
    });

    return Array.from(map.values());
  } catch (err) {
    console.error('getCompanyMovies error:', err);
    return [];
  }
}