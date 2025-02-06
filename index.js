const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Load all the movies (flat list)
const moviesFile = path.join(__dirname, 'movies.json');
const moviesData = JSON.parse(fs.readFileSync(moviesFile, 'utf-8'));

// 2. Load pages + metadata
const pagesFile = path.join(__dirname, 'pages.json');
const pagesData = JSON.parse(fs.readFileSync(pagesFile, 'utf-8'));

// The top-level "pages" object in pages.json
const pagesMeta = pagesData.pages;

// The array of page assignments, e.g. [ { page:1, movieIds:[...] }, ... ]
const allPageAssignments = pagesMeta.page_list;

// Dynamically compute the total_pages by finding the highest "page" value
const totalPages = Math.max(...allPageAssignments.map((p) => p.page));

app.get('/api/:page', (req, res) => {
  const requestedPage = parseInt(req.params.page, 10);

  if (isNaN(requestedPage)) {
    return res.status(400).json({ error: 'Invalid page parameter' });
  }

  // Find the page assignment object
  const pageObj = allPageAssignments.find((p) => p.page === requestedPage);

  if (!pageObj) {
    // If there's no matching page, return 404 (or handle however you'd like)
    return res.status(404).json({
      error: 'Page not found',
      requestedPage
    });
  }

  // Filter the flat list of movies by the IDs in this page
  const filteredMovies = moviesData.items.filter((movie) =>
    pageObj.movieIds.includes(movie.id)
  );

  // Construct the response
  const response = {
    // Include the metadata from pages.json
    created_by: pagesMeta.created_by,
    description: pagesMeta.description,
    favorite_count: pagesMeta.favorite_count,
    id: requestedPage,
    iso_639_1: pagesMeta.iso_639_1,
    item_count: pageObj.movieIds.length,
    name: pagesMeta.name,
    poster_path: pagesMeta.poster_path,
    total_results: pagesMeta.total_results,

    // The current page
    page: 1,

    // Dynamically computed total_pages
    total_pages: 1,

    // The movies for this page
    items: filteredMovies
  };

  // Send JSON
  res.json(response);
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});