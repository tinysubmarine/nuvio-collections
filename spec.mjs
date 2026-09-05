// Nuvio collection spec. Edit this file, then run `node build.mjs`.
//
// Every tab is a TMDB feed, so no addons are required. IDs below were verified
// against themoviedb.org on 2026-09-05.

// TMDB genre ids
export const MOVIE = {
  action: 28, adventure: 12, animation: 16, comedy: 35, crime: 80, documentary: 99,
  drama: 18, family: 10751, fantasy: 14, history: 36, horror: 27, mystery: 9648,
  romance: 10749, scifi: 878, thriller: 53, war: 10752, western: 37,
};
export const TV = {
  actionAdventure: 10759, animation: 16, comedy: 35, crime: 80, documentary: 99,
  drama: 18, family: 10751, mystery: 9648, reality: 10764, scifiFantasy: 10765,
  warPolitics: 10768, western: 37,
};

// TMDB keyword ids. In a keyword filter, "|" means OR and "," means AND.
export const KW = {
  supernatural: 6152, possession: 9712, ghost: 162846, hauntedHouse: 3358,
  foundFootage: 163053, slasher: 12339, homeInvasion: 14903,
  dystopia: 4565, postApocalyptic: 4458, timeTravel: 4379, timeLoop: 10854,
  alien: 9951, ufo: 9738, virtualReality: 4563, videoGame: 282, superhero: 9715,
  swordAndSorcery: 234213, naturalDisaster: 5096, tornado: 2213, storm: 14527,
  stormChaser: 12336, survival: 10349, anime: 210024, shounen: 207826,
  cooking: 1918, cookingContest: 227635, sliceOfLife: 9914, periodDrama: 15060,
  basedOnNovel: 818, detective: 703, sherlockHolmes: 273879, swashbuckler: 157186,
  pirate: 12988, trueCrime: 33722,
};

export const COMPANY = { blumhouse: 3172, a24: 41077 };
export const NETWORK = { appleTv: 2552, foodNetwork: 143 };
export const PERSON = { spielberg: 488 };

// Helpers for compact tab definitions. `discover` builds a TMDB Discover source.
const discover = (title, mediaType, filters, sortBy) => ({
  kind: 'DISCOVER', title, mediaType, filters, sortBy,
});
const movies = (title, filters, sortBy) => discover(title, 'MOVIE', filters, sortBy);
const series = (title, filters, sortBy) => discover(title, 'TV', filters, sortBy);

// Vote floors keep obscure or unrated titles out of the rows.
const SOLID = { voteCountGte: 200 };
const FRESH = { voteCountGte: 25 };   // for very recent releases
const NICHE = { voteCountGte: 50 };   // for narrow keyword searches

// Relative date windows are resolved when you run build.mjs.
export const WINDOWS = { recentMonths: 18, airingMonths: 8 };

// AI Picks: a TMDB list that push-picks.mjs keeps in sync with picks.json.
// The list id comes from picks.config.json after the first push; until then
// build.mjs leaves this collection out.
export const aiPicks = (listId) => ({
  id: 'ai-picks',
  title: 'AI Picks',
  emoji: '✨',
  viewMode: 'ROWS',   // show the picks as a row of tiles, not a folder icon
  folders: [
    {
      id: 'for-you', title: 'For You', emoji: '✨', tileShape: 'POSTER',
      sources: [
        { kind: 'LIST', title: 'Nuvio AI Picks', tmdbId: listId, mediaType: 'MOVIE', sortBy: 'original' },
      ],
    },
  ],
});

export const collections = [
  {
    id: 'fright-night',
    title: 'Fright Night',
    emoji: '🔪',
    folders: [
      {
        id: 'new-horror', title: 'New Horror', emoji: '🩸',
        sources: [
          movies('New Horror Movies', { withGenres: MOVIE.horror, sinceMonths: 'recent', ...FRESH }, 'primary_release_date.desc'),
        ],
      },
      {
        id: 'supernatural', title: 'Supernatural', emoji: '👻',
        sources: [
          movies('Possession & Ghosts', { withGenres: MOVIE.horror, withKeywords: [KW.supernatural, KW.possession, KW.ghost, KW.hauntedHouse].join('|'), ...NICHE }),
          series('Supernatural Series', { withGenres: TV.scifiFantasy, withKeywords: [KW.supernatural, KW.ghost].join('|'), ...NICHE }),
        ],
      },
      {
        id: 'found-footage', title: 'Found Footage', emoji: '📹',
        sources: [
          movies('Found Footage Horror', { withGenres: MOVIE.horror, withKeywords: KW.foundFootage, ...FRESH }),
        ],
      },
      {
        id: 'horror-comedy', title: 'Horror Comedy', emoji: '🤡',
        sources: [
          movies('Horror Comedies', { withGenres: `${MOVIE.horror},${MOVIE.comedy}`, ...SOLID }),
        ],
      },
      {
        id: 'slashers', title: 'Slashers & Invasions', emoji: '🏚️',
        sources: [
          movies('Slashers & Home Invasion', { withGenres: MOVIE.horror, withKeywords: [KW.slasher, KW.homeInvasion].join('|'), ...NICHE }),
        ],
      },
      {
        id: 'studios', title: 'Blumhouse & A24', emoji: '🎬',
        sources: [
          movies('Blumhouse', { withGenres: MOVIE.horror, withCompanies: COMPANY.blumhouse, ...FRESH }),
          movies('A24 Horror', { withGenres: MOVIE.horror, withCompanies: COMPANY.a24, ...FRESH }),
        ],
      },
      {
        id: 'top-rated', title: 'Top Rated', emoji: '🏆',
        sources: [
          movies('Top Rated Horror', { withGenres: MOVIE.horror, voteCountGte: 1500 }, 'vote_average.desc'),
        ],
      },
    ],
  },
  {
    id: 'signal-lost',
    title: 'Signal Lost',
    emoji: '📡',
    folders: [
      {
        id: 'dystopia', title: 'Dystopian', emoji: '🏙️',
        sources: [
          series('Dystopian Series', { withGenres: TV.scifiFantasy, withKeywords: [KW.dystopia, KW.postApocalyptic].join('|'), ...NICHE }),
          movies('Dystopian Movies', { withGenres: MOVIE.scifi, withKeywords: [KW.dystopia, KW.postApocalyptic].join('|'), ...SOLID }),
        ],
      },
      {
        id: 'time', title: 'Time Loops', emoji: '⏳',
        sources: [
          series('Time Travel Series', { withKeywords: [KW.timeTravel, KW.timeLoop].join('|'), ...NICHE }),
          movies('Time Travel Movies', { withKeywords: [KW.timeTravel, KW.timeLoop].join('|'), ...SOLID }),
        ],
      },
      {
        id: 'contact', title: 'Alien Contact', emoji: '🛸',
        sources: [
          movies('Aliens & UFOs', { withGenres: MOVIE.scifi, withKeywords: [KW.alien, KW.ufo].join('|'), ...SOLID }),
          series('Alien Series', { withGenres: TV.scifiFantasy, withKeywords: [KW.alien, KW.ufo].join('|'), ...NICHE }),
        ],
      },
      {
        id: 'apple', title: 'Apple TV+ Sci-Fi', emoji: '🍎',
        sources: [
          series('Apple TV+ Sci-Fi & Fantasy', { withGenres: TV.scifiFantasy, withNetworks: NETWORK.appleTv, voteCountGte: 20 }),
        ],
      },
      {
        id: 'top-series', title: 'Top Rated Series', emoji: '🏆',
        sources: [
          series('Top Rated Sci-Fi Series', { withGenres: TV.scifiFantasy, withoutGenres: TV.animation, voteCountGte: 800 }, 'vote_average.desc'),
        ],
      },
      {
        id: 'new-scifi', title: 'New Sci-Fi', emoji: '🚀',
        sources: [
          movies('New Sci-Fi Movies', { withGenres: MOVIE.scifi, sinceMonths: 'recent', ...FRESH }, 'primary_release_date.desc'),
          series('New Sci-Fi Series', { withGenres: TV.scifiFantasy, withoutGenres: TV.animation, sinceMonths: 'recent', voteCountGte: 20 }, 'first_air_date.desc'),
        ],
      },
    ],
  },
  {
    id: 'big-screen',
    title: 'Big Screen',
    emoji: '🎥',
    folders: [
      {
        id: 'fantasy', title: 'Fantasy Adventure', emoji: '🗡️',
        sources: [
          movies('Fantasy Adventure', { withGenres: `${MOVIE.adventure},${MOVIE.fantasy}`, withoutGenres: MOVIE.animation, ...SOLID }),
        ],
      },
      {
        id: 'virtual', title: 'Virtual Worlds', emoji: '🕹️',
        sources: [
          movies('Virtual Reality & Video Games', { withKeywords: [KW.virtualReality, KW.videoGame].join('|'), ...SOLID }),
        ],
      },
      {
        id: 'superheroes', title: 'Superheroes', emoji: '🦸',
        sources: [
          movies('Superhero Movies', { withKeywords: KW.superhero, ...SOLID }),
          series('Superhero Series', { withKeywords: KW.superhero, withoutGenres: TV.animation, ...NICHE }),
        ],
      },
      {
        id: 'spielberg', title: 'Spielberg', emoji: '🎬',
        sources: [
          { kind: 'DIRECTOR', title: 'Directed by Steven Spielberg', tmdbId: PERSON.spielberg, mediaType: 'MOVIE', sortBy: 'popularity.desc' },
        ],
      },
      {
        id: 'sword', title: 'Sword & Sorcery', emoji: '⚔️',
        sources: [
          movies('Sword & Sorcery', { withKeywords: [KW.swordAndSorcery, KW.swashbuckler, KW.pirate].join('|'), withGenres: `${MOVIE.adventure}|${MOVIE.fantasy}|${MOVIE.action}`, ...NICHE }),
        ],
      },
      {
        id: 'popular', title: 'Popular Now', emoji: '🔥',
        sources: [
          movies('Popular Adventure', { withGenres: `${MOVIE.adventure}|${MOVIE.action}|${MOVIE.fantasy}`, sinceMonths: 'recent', ...FRESH }),
        ],
      },
    ],
  },
  {
    id: 'storm-season',
    title: 'Storm Season',
    emoji: '🌪️',
    folders: [
      {
        id: 'disasters', title: 'Natural Disasters', emoji: '🌋',
        sources: [
          movies('Natural Disaster Movies', { withKeywords: KW.naturalDisaster, ...NICHE }),
        ],
      },
      {
        id: 'storms', title: 'Storm Chasers', emoji: '⛈️',
        sources: [
          movies('Tornadoes & Storms', { withKeywords: [KW.tornado, KW.storm, KW.stormChaser].join('|'), ...NICHE }),
        ],
      },
      {
        id: 'survival', title: 'Survival', emoji: '🧭',
        sources: [
          movies('Survival Movies', { withKeywords: KW.survival, withoutGenres: MOVIE.horror, ...SOLID }),
        ],
      },
    ],
  },
  {
    id: 'anime-corner',
    title: 'Anime Corner',
    emoji: '⛩️',
    folders: [
      {
        id: 'popular', title: 'Popular', emoji: '🔥',
        sources: [
          series('Popular Anime', { withGenres: TV.animation, withOriginalLanguage: 'ja', ...NICHE }),
        ],
      },
      {
        id: 'top-rated', title: 'Top Rated', emoji: '🏆',
        sources: [
          series('Top Rated Anime', { withGenres: TV.animation, withOriginalLanguage: 'ja', voteCountGte: 300 }, 'vote_average.desc'),
        ],
      },
      {
        id: 'airing', title: 'Airing Now', emoji: '📺',
        sources: [
          series('New Anime', { withGenres: TV.animation, withOriginalLanguage: 'ja', sinceMonths: 'airing', voteCountGte: 10 }, 'first_air_date.desc'),
        ],
      },
      {
        id: 'shonen', title: 'Shonen Action', emoji: '🍥',
        sources: [
          series('Shonen', { withGenres: `${TV.animation},${TV.actionAdventure}`, withOriginalLanguage: 'ja', withKeywords: [KW.shounen, KW.anime].join('|'), ...NICHE }),
        ],
      },
      {
        id: 'food', title: 'Food & Slice of Life', emoji: '🍜',
        sources: [
          series('Food & Slice of Life Anime', { withGenres: TV.animation, withOriginalLanguage: 'ja', withKeywords: [KW.cooking, KW.sliceOfLife].join('|'), voteCountGte: 20 }),
        ],
      },
      {
        id: 'films', title: 'Anime Films', emoji: '🎞️',
        sources: [
          movies('Anime Movies', { withGenres: MOVIE.animation, withOriginalLanguage: 'ja', ...SOLID }),
        ],
      },
    ],
  },
  {
    id: 'cloak-and-dagger',
    title: 'Cloak & Dagger',
    emoji: '🕯️',
    folders: [
      {
        id: 'period', title: 'Period Drama', emoji: '🏰',
        sources: [
          series('Period Drama Series', { withGenres: TV.drama, withKeywords: KW.periodDrama, ...NICHE }),
        ],
      },
      {
        id: 'novels', title: 'From the Page', emoji: '📖',
        sources: [
          series('Literary Adaptations', { withGenres: TV.drama, withKeywords: KW.basedOnNovel, withoutGenres: TV.animation, ...SOLID }),
          movies('Adapted Adventure', { withGenres: `${MOVIE.adventure},${MOVIE.drama}`, withKeywords: KW.basedOnNovel, ...SOLID }),
        ],
      },
      {
        id: 'detectives', title: 'Detectives', emoji: '🔍',
        sources: [
          series('Detective Series', { withGenres: `${TV.mystery}|${TV.crime}`, withKeywords: [KW.detective, KW.sherlockHolmes].join('|'), withoutGenres: TV.animation, ...NICHE }),
          movies('Sherlock Holmes', { withKeywords: KW.sherlockHolmes, voteCountGte: 100 }),
        ],
      },
      {
        id: 'swashbucklers', title: 'Swashbucklers', emoji: '🏴‍☠️',
        sources: [
          movies('Swashbucklers & Pirates', { withKeywords: [KW.swashbuckler, KW.pirate].join('|'), ...NICHE }),
        ],
      },
    ],
  },
  {
    id: 'unscripted',
    title: 'Unscripted',
    emoji: '📺',
    folders: [
      {
        id: 'reality', title: 'Reality TV', emoji: '🎤',
        sources: [
          series('Popular Reality', { withGenres: TV.reality, withOriginalLanguage: 'en', voteCountGte: 30 }),
        ],
      },
      {
        id: 'true-crime', title: 'True Crime', emoji: '🚔',
        sources: [
          series('True Crime Docuseries', { withGenres: TV.documentary, withKeywords: KW.trueCrime, voteCountGte: 10 }, 'first_air_date.desc'),
          movies('True Crime Documentaries', { withGenres: MOVIE.documentary, withKeywords: KW.trueCrime, voteCountGte: 20 }),
        ],
      },
      {
        id: 'cooking', title: 'Cooking Shows', emoji: '🍳',
        sources: [
          series('Cooking Competitions', { withKeywords: [KW.cookingContest, KW.cooking].join('|'), withGenres: TV.reality, voteCountGte: 5 }),
          series('Food Network', { withNetworks: NETWORK.foodNetwork, voteCountGte: 5 }),
        ],
      },
      {
        id: 'docs', title: 'Documentaries', emoji: '🎞️',
        sources: [
          movies('Top Documentaries', { withGenres: MOVIE.documentary, voteCountGte: 300 }, 'vote_average.desc'),
          series('Docuseries', { withGenres: TV.documentary, withOriginalLanguage: 'en', voteCountGte: 50 }),
        ],
      },
    ],
  },
];
