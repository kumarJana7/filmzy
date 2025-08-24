import { useState, useEffect } from 'react';
import './App.css';
import Search from './components/Search';
import Spinner from './components/Sprinner';
import MovieCard from './components/MovieCard';
import { useDebounce } from 'react-use';
const API_BASE_URL = 'https://api.themoviedb.org/3';
import { updateSearchCount, getTrendingMovies } from './appwrite.js';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: 'GET',
    headers: {
        Authorization: `Bearer ${API_KEY}`,
        accept: 'application/json',
    },
};

function App() {
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(false);

    const [trendingMovies, setTrendingMovies] = useState([]);

    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

    const fetchMovies = async (query = '') => {
        try {
            setLoading(true);
            setError('');
            const endpoint = query
                ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
                : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

            const response = await fetch(endpoint, API_OPTIONS);

            if (!response.ok) {
                throw new Error('Failed to fetch');
            }

            const data = await response.json();
            if (data.Response === 'False') {
                setError(data.Error || 'Failed to fetch movies.');
                setMovies([]);
                return;
            }

            setMovies(Array.isArray(data.results) ? data.results : []);
            if (query && data.results.length > 0) {
                await updateSearchCount(query, data.results[0]);
            }
        } catch (error) {
            console.error('Error fetching movies:', error);
            setError('Failed to fetch movies.');
        } finally {
            setLoading(false);
        }
    };

    const loadTrendingMovies = async () => {
        try {
            const trending = await getTrendingMovies();
            setTrendingMovies(trending);
        } catch (error) {
            console.error('Error fetching trending movies:', error);
        }
    };

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 1000, [searchTerm]);
    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    return (
        <main>
            <div className="pattern" />
            <div className="wrapper">
                <header>
                    <img src="./hero.png" alt="Hero Banner" />
                    <h1>
                        Hello <span className="text-gradient">Movies</span>{' '}
                        You'll Love Without Hassle
                    </h1>
                    <Search
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                    />
                </header>
                {trendingMovies.length > 0 && (
                    <section className="trending">
                        <h2>Trending Movies</h2>
                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.id}>
                                    <p>{index + 1}</p>
                                    <img
                                        src={movie.poster_url}
                                        alt={movie.title}
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            
                <section className="all-movies">
                    <h2 className="mt-[20px]">All Movies</h2>
                    {loading ? (
                        <Spinner />
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : (
                        <ul>
                            {movies.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </main>
    );
}

export default App;
