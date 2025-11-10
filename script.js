console.log("Music Player Loaded");

// ---------- Global Variables ----------
let currentSong = new Audio();
let Songs = [];
let allSongs = [];
let currFolder = "";
let isLooping = false;
let isOneTimeLoop = false;
let hasRepeatedOnce = false;
const sidebar = document.querySelector(".left");

// ---------- Utility Functions ----------
function formatTime(seconds) {
    if (!seconds || !isFinite(seconds)) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// ---------- Play Music ----------
function playMusic(track, folder = currFolder) {
    const src = `${folder}/${encodeURIComponent(track)}.mp3`;
    currentSong.src = src;

    document.querySelector(".song-info").textContent = track;
    document.querySelector(".song-time").textContent = "00:00 / 00:00";

    const playBtn = document.querySelector("#play");

    currentSong.play().then(() => {
        playBtn.src = "https://gudigarrohit.github.io/Geeth/img_svg_video/pause.svg";
    }).catch(err => console.warn("Autoplay blocked:", err));
}

async function getSong(folder) {
    currFolder = `https://gudigarrohit.github.io/Geeth${folder}`;

    try {
        const res = await fetch(`${currFolder}/songs.json`);
        if (!res.ok) throw new Error("Songs JSON not found: " + res.status);
        const data = await res.json();

        Songs = data.songs;

        const songUl = document.querySelector(".library-song-list ul");
        songUl.innerHTML = "";

        Songs.forEach(song => {
            const li = document.createElement("li");
            li.innerHTML = `
                <img class="ml-2 invert " src="https://gudigarrohit.github.io/Geeth/img_svg_video/music.svg" width="20" alt="">
                <div class="info">
                    <div>${song}</div>
                    <div>Geeta</div>
                </div>
                <div class="library-playnow d-flex gap-2">
                    <span>Play Now</span>
                    <img class="invert library-play mr-2" src="https://gudigarrohit.github.io/Geeth/img_svg_video/play.svg" alt="">
                </div>
            `;
            songUl.appendChild(li);

            li.addEventListener("click", () => {
                playMusic(song);
                // Close the sidebar after clicking a song
                sidebar.style.left = "-120%";
            });
        });

    } catch (err) {
        console.error("Fetch Error:", err);
    }

    return Songs;
}


// ---------- Fetch All Songs for Search ----------
async function getAllSongs() {
    allSongs = [];
    try {
        const response = await fetch("https://gudigarrohit.github.io/Geeth/Songs/albums.json");
        const albumsData = await response.json();

        for (let album of albumsData.albums) {
            try {
                const res = await fetch(`https://gudigarrohit.github.io/Geeth/Songs/${album.folder}/songs.json`);
                const data = await res.json();

                data.songs.forEach(song => {
                    allSongs.push({
                        name: song,
                        folder: album.folder,
                        path: `https://gudigarrohit.github.io/Geeth/Songs/${album.folder}/${encodeURIComponent(song)}.mp3`
                    });
                });
            } catch (err) {
                console.warn(`Failed to fetch songs.json for album ${album.folder}`, err);
            }
        }

    } catch (err) {
        console.error("Fetch allAlbums error:", err);
    }
}

// ---------- Display Album Cards ----------
async function displayAlbum() {
    const container = document.querySelector(".cardcontainer");
    container.innerHTML = "";

    try {
        const response = await fetch("https://gudigarrohit.github.io/Geeth/Songs/albums.json");
        const data = await response.json();

        data.albums.forEach(album => {
            const div = document.createElement("div");
            div.classList.add("card-right");
            div.dataset.folder = album.folder;
            div.innerHTML = `
                <div class="card-right bg-gray2 pt-2 pl-2 pr-2 pb-1 border-radius-2"> 
                    <div class="play">
                        <img src="https://gudigarrohit.github.io/Geeth/img_svg_video/playlist.svg" alt="">
                    </div>
                    <img src="https://gudigarrohit.github.io/Geeth/Songs/${album.folder}/cover.jpeg" class="border-radius-2 image" alt="">
                    <h5 class="mt-2 ml-1">${album.title}</h5>
                    <p class="ml-1">${album.description}</p>
                </div>
            `;
            container.appendChild(div);

            div.addEventListener("click", async () => {
                await getSong(`/Songs/${album.folder}`);
                if (Songs.length > 0) {
                    playMusic(Songs[0], `https://gudigarrohit.github.io/Geeth/Songs/${album.folder}`);
                }
                ` <div>No Songs available in this album.</div>`
            });

        });

    } catch (err) {
        console.error("Display album error:", err);
    }
}

// ---------- Search Engine ----------
function setupSearch(inputId, resultsId) {
    const searchInput = document.querySelector(`#${inputId}`);
    const searchResults = document.querySelector(`#${resultsId}`);
    let currentIndex = -1;

    function showResults(matches) {
        searchResults.innerHTML = "";
        currentIndex = -1;
        if (!matches.length) return searchResults.style.display = "none";

        matches.forEach(songObj => {
            const li = document.createElement("li");
            li.textContent = songObj.name;

            li.addEventListener("click", e => {
                e.stopPropagation();
                playMusic(songObj.name, `https://gudigarrohit.github.io/Geeth/Songs/${songObj.folder}`);
                searchInput.value = "";
                searchResults.innerHTML = "";
                searchResults.style.display = "none";
            });

            searchResults.appendChild(li);
        });

        searchResults.style.display = "block";
    }
    function updateMatches() {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) return searchResults.style.display = "none";

        // Find matches
        let matches = allSongs.filter(s => s.name.toLowerCase().includes(query));

        // Deduplicate by exact name match
        const seen = new Set();
        matches = matches.filter(s => {
            const key = s.name.toLowerCase().trim(); // exact song name
            if (seen.has(key)) return false;  // skip if already added
            seen.add(key);
            return true;
        });

        showResults(matches);
    }


    searchInput.addEventListener("input", updateMatches);
    searchInput.addEventListener("focus", updateMatches);

    searchInput.addEventListener("keydown", e => {
        const items = searchResults.querySelectorAll("li");
        if (!items.length) return;

        if (e.key === "Escape") {
            searchResults.style.display = "none";
            searchInput.value = "";
            currentIndex = -1;
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % items.length;
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            currentIndex = (currentIndex - 1 + items.length) % items.length;
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (currentIndex === -1) items[0].click();
            else items[currentIndex].click();
        }

        items.forEach((item, i) => item.classList.toggle("active", i === currentIndex));
    });

    document.addEventListener("click", e => {
        if (!e.target.closest(`#${inputId}`) && !e.target.closest(`#${resultsId}`)) {
            searchResults.style.display = "none";
            searchInput.value = "";
            currentIndex = -1;
        }
    });
}

// Initialize search bars
setupSearch("songSearch1", "searchResults1");
setupSearch("songSearch2", "searchResults2");



// ---------- Main Function ----------
async function main() {

    await getAllSongs(); // Fetch all songs for search
    await getSong("/Songs/Mine"); // Load default folder
    playMusic(Songs[-1], true); // Play first song from default folder
    await displayAlbum();



    const playBtn = document.querySelector("#play");
    const previous = document.querySelector("#previous");
    const next = document.querySelector("#next");
    const loopBtn = document.querySelector("#loop");
    const volumeSlider = document.querySelector(".stylish-range");
    const seekbar = document.querySelector(".seekbar");
    const progresion = document.querySelector(".progresion");
    const circle = document.querySelector(".circle");

    let isDragging = false;

    playBtn.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play().then(() => {
                playBtn.src = "https://gudigarrohit.github.io/Geeth/img_svg_video/pause.svg";
            }).catch(err => console.warn("Autoplay blocked:", err));
        } else {
            currentSong.pause();
            playBtn.src = "https://gudigarrohit.github.io/Geeth/img_svg_video/play.svg";
        }
    });


    // --- Time & Seekbar ---
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".song-time").textContent =
            `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;

        if (!isDragging) {
            let percent = (currentSong.currentTime / currentSong.duration) * 100;
            progresion.style.width = percent + "%";
            circle.style.left = percent + "%";
        }
    });

    function handleMove(clientX) {
        let rect = seekbar.getBoundingClientRect();
        let offsetX = Math.min(Math.max(0, clientX - rect.left), rect.width);
        let percent = (offsetX / rect.width) * 100;
        progresion.style.width = percent + "%";
        circle.style.left = percent + "%";
        return percent;
    }
    //--- Seek when clicking on bar ---
    seekbar.addEventListener("click", e => {
        let rect = seekbar.getBoundingClientRect();
        let offsetX = e.clientX - rect.left; let percent = (offsetX / rect.width) * 100;
        progresion.style.width = percent + "%"; circle.style.left = percent + "%";
        currentSong.currentTime = (currentSong.duration * percent) / 100;
    });

    circle.addEventListener("mousedown", () => { isDragging = true; circle.style.cursor = "grabbing"; });
    document.addEventListener("mousemove", e => { if (isDragging) handleMove(e.clientX); });
    document.addEventListener("mouseup", e => {
        if (isDragging) {
            isDragging = false; circle.style.cursor = "grab";
            currentSong.currentTime = (currentSong.duration * handleMove(e.clientX)) / 100;
        }
    });
    circle.addEventListener("touchstart", () => isDragging = true);
    document.addEventListener("touchmove", e => { if (isDragging) handleMove(e.touches[0].clientX); });
    document.addEventListener("touchend", e => {
        if (isDragging) {
            isDragging = false;
            currentSong.currentTime = (currentSong.duration * handleMove(e.changedTouches[0].clientX)) / 100;
        }
    });

    // --- Previous / Next ---
    previous.addEventListener("click", () => {
        if (!isLooping && !isOneTimeLoop) hasRepeatedOnce = false;
        let currentFile = decodeURIComponent(currentSong.src.split("/").pop()).replace(".mp3", "");
        let index = Songs.indexOf(currentFile);
        if (index !== -1) playMusic(Songs[(index - 1 + Songs.length) % Songs.length]);
    });

    next.addEventListener("click", () => {
        if (!isLooping && !isOneTimeLoop) hasRepeatedOnce = false;
        let currentFile = decodeURIComponent(currentSong.src.split("/").pop()).replace(".mp3", "");
        let index = Songs.indexOf(currentFile);
        if (index !== -1) playMusic(Songs[(index + 1) % Songs.length]);
    });

    // --- Volume ---
    volumeSlider.addEventListener("input", e => currentSong.volume = e.target.value / 100);
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (currentSong.volume > 0) { currentSong.volume = 0; volumeSlider.value = 0; e.target.src = "https://gudigarrohit.github.io/Geeth/img_svg_video/mute.svg"; }
        else { currentSong.volume = 0.1; volumeSlider.value = 10; e.target.src = "https://gudigarrohit.github.io/Geeth/img_svg_video/volume.svg"; }
    });

    // --- Loop Button ---
    loopBtn.addEventListener("click", () => {
        if (isOneTimeLoop) return; // Ignore if one-time loop is active
        isLooping = !isLooping;
        loopBtn.classList.toggle("active", isLooping);
        loopBtn.src = "https://gudigarrohit.github.io/Geeth/img_svg_video/loop.svg"; // default loop icon
    });

    loopBtn.addEventListener("dblclick", () => {
        if (!isOneTimeLoop) {
            // Enable one-time loop
            isOneTimeLoop = true;
            isLooping = false;
            hasRepeatedOnce = false;
            loopBtn.classList.add("active");
            loopBtn.src = "https://gudigarrohit.github.io/Geeth/img_svg_video/looponce.svg"; // one-time loop icon
        } else {
            // Disable one-time loop
            isOneTimeLoop = false;
            hasRepeatedOnce = false;
            loopBtn.classList.remove("active");
            loopBtn.src = "https://gudigarrohit.github.io/Geeth/img_svg_video/loop.svg"; // back to default loop icon
        }
    });

    // --- Song Ended Handling ---
    currentSong.addEventListener("ended", () => {
        const playBtn = document.querySelector("#play");

        let currentFile = decodeURIComponent(
            currentSong.src.split("/").pop()
        ).replace(/\.mp3$/i, "").trim();

        // Find exact match ignoring .mp3 differences
        let index = Songs.findIndex(song =>
            song.replace(/\.mp3$/i, "").trim() === currentFile
        );

        // One-time loop (repeat the song only once)
        if (isOneTimeLoop && !hasRepeatedOnce) {
            currentSong.currentTime = 0;
            currentSong.play();
            hasRepeatedOnce = true;
            return;
        }

        // Infinite loop of the same song
        if (isLooping) {
            currentSong.currentTime = 0;
            currentSong.play();
            return;
        }

        // ✅ Infinite playlist looping
        if (index !== -1) {
            let nextIndex = (index + 1) % Songs.length;  // loops back to start
            playMusic(Songs[nextIndex]);
            return;
        }

        // If something goes wrong (rare)
        console.warn("Current song not found in Songs[]");
        playBtn.src = "https://gudigarrohit.github.io/Geeth/img_svg_video/play.svg";
    });


    // --- Sidebar ---

    document.querySelector(".humberger").addEventListener("click", () => { sidebar.style.left = "0"; });
    document.querySelector(".close").addEventListener("click", () => { sidebar.style.left = "-120%"; });
    document.addEventListener("click", (e) => { if (!e.target.closest(".left") && !e.target.closest(".humberger")) sidebar.style.left = "-120%"; });

    // --- Focus search inputs ---
    document.querySelectorAll(".search-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-target");
            document.getElementById(targetId).focus();
        })
    });
}

main();
