// const CLIENT_ID = "YOUR_CLIENT_ID";
// const CLIENT_SECRET = "YOUR_CLIENT_SECRET";

const CLIENT_ID = '2b79e96f8fe54b78852215803dfaebf8';
const CLIENT_SECRET = '40223b925d604ff39ea6e250a1567ca1';

// Get Spotify access token
async function getAccessToken() {
    const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: "Basic " + btoa(CLIENT_ID + ":" + CLIENT_SECRET),
        },
        body: "grant_type=client_credentials",
    });

    const data = await response.json();
    return data.access_token;
}

// Search for artist by name
async function searchArtist() {
    const artistName = document.getElementById("artist-name").value;
    if (!artistName) return alert("Enter an artist name!");

    const token = await getAccessToken();
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    if (data.artists.items.length === 0) return alert("Artist not found!");

    const artistId = data.artists.items[0].id;
    getAllTracks(artistId, token);
}

// Get all tracks the artist appeared in
async function getAllTracks(artistId, token) {
    const albums = await getAlbums(artistId, token);
    const trackSet = new Set();
    let tracks = [];

    for (const album of albums) {
        const albumTracks = await getTracksFromAlbum(album.id, token);

        for (const track of albumTracks) {
            if (!trackSet.has(track.id)) {
                trackSet.add(track.id);
                tracks.push(track);
            }
        }
    }

    // Fetch track popularity for each track
    tracks = await fetchTrackPopularity(tracks, token);

    // Sort tracks by popularity (most played first)
    tracks.sort((a, b) => b.popularity - a.popularity);

    displayTracks(tracks);
}

// Get all albums of the artist
async function getAlbums(artistId, token) {
    let albums = [];
    let nextUrl = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,compilation,appears_on&market=US&limit=50`;

    while (nextUrl) {
        const response = await fetch(nextUrl, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();
        albums = albums.concat(data.items);
        nextUrl = data.next;
    }

    return albums;
}

// Get tracks from an album
async function getTracksFromAlbum(albumId, token) {
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await response.json();
    return data.items;
}

// Fetch track popularity
async function fetchTrackPopularity(tracks, token) {
    const trackIds = tracks.map(track => track.id);
    const batches = [];

    // Spotify allows max 50 tracks per request
    for (let i = 0; i < trackIds.length; i += 50) {
        batches.push(trackIds.slice(i, i + 50));
    }

    for (const batch of batches) {
        const response = await fetch(`https://api.spotify.com/v1/tracks?ids=${batch.join(",")}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const data = await response.json();

        // Update track objects with popularity
        for (let i = 0; i < batch.length; i++) {
            tracks.find(t => t.id === batch[i]).popularity = data.tracks[i].popularity;
        }
    }

    return tracks;
}

// Display tracks on the page
function displayTracks(tracks) {
    const tracksDiv = document.getElementById("tracks");
    tracksDiv.innerHTML = ""; // Clear previous results

    if (tracks.length === 0) {
        tracksDiv.innerHTML = "<p>No tracks found for this artist.</p>";
        return;
    }

    tracks.forEach(track => {
        const trackElement = document.createElement("div");
        trackElement.classList.add("track");

        trackElement.innerHTML = `
            <p><strong>${track.name}</strong> - Popularity: ${track.popularity}/100</p>
            ${track.preview_url ? `
            <audio controls>
                <source src="${track.preview_url}" type="audio/mpeg">
                Your browser does not support the audio element.
            </audio>` : "<p>No preview available</p>"}
        `;

        tracksDiv.appendChild(trackElement);
    });
}




// // Get Spotify access token
// async function getAccessToken() {
    // const response = await fetch("https://accounts.spotify.com/api/token", {
        // method: "POST",
        // headers: {
            // "Content-Type": "application/x-www-form-urlencoded",
            // Authorization: "Basic " + btoa(CLIENT_ID + ":" + CLIENT_SECRET),
        // },
        // body: "grant_type=client_credentials",
    // });

    // const data = await response.json();
    // return data.access_token;
// }

// // Search for artist by name
// async function searchArtist() {
    // const artistName = document.getElementById("artist-name").value;
    // if (!artistName) return alert("Enter an artist name!");

    // const token = await getAccessToken();
    // const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist`, {
        // headers: { Authorization: `Bearer ${token}` },
    // });

    // const data = await response.json();
    // if (data.artists.items.length === 0) return alert("Artist not found!");

    // const artistId = data.artists.items[0].id;
    // getTopTracks(artistId, token);
// }

// // Get artist's top tracks
// async function getTopTracks(artistId, token) {
    // const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=US`, {
        // headers: { Authorization: `Bearer ${token}` },
    // });

    // const data = await response.json();
    // displayTracks(data.tracks);
// }

// // Display tracks on the page
// function displayTracks(tracks) {
    // const tracksDiv = document.getElementById("tracks");
    // tracksDiv.innerHTML = ""; // Clear previous results

    // tracks.forEach(track => {
        // const trackElement = document.createElement("div");
        // trackElement.classList.add("track");

        // trackElement.innerHTML = `
            // <img src="${track.album.images[0]?.url}" alt="Album Cover">
            // <p><strong>${track.name}</strong></p>
            // <audio controls>
                // <source src="${track.preview_url}" type="audio/mpeg">
                // Your browser does not support the audio element.
            // </audio>
        // `;

        // tracksDiv.appendChild(trackElement);
    // });
// }


