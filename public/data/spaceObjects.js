/*
 * SpaceSkribble – NASA Sky Challenge
 * ----------------------------------
 * The astronomy object database.
 *
 * Every object the drawer can receive lives here. To add a new one, copy an
 * existing entry, give it a unique `id`, and fill in the fields. See README.md
 * ("How to add new astronomy objects") for a field-by-field guide.
 *
 * This file works in the browser (window.SPACE_OBJECTS) and in Node.js
 * (require('./data/spaceObjects.js')) so the server and the client share it.
 *
 * Numbers are rounded values from NASA fact sheets. Viewing tips describe
 * typical, repeating sky patterns – they are NOT real-time visibility claims.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SPACE_OBJECTS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const IMG = '/assets/img/';

  return [
    // ───────────────────────────── PLANETS ─────────────────────────────
    {
      id: 'mercury',
      name: 'Mercury',
      aliases: [],
      category: 'Planet',
      difficulty: 'medium',
      color: '#b7b2a8',
      sketch: 'mercury',
      description:
        'Mercury is the smallest planet in our solar system and the closest to the Sun. Its cratered surface looks a lot like our Moon.',
      interestingFacts: [
        'A year on Mercury lasts just 88 Earth days – the fastest orbit of any planet.',
        'Mercury has almost no atmosphere, so temperatures swing from about 430 °C in the day to −180 °C at night.',
        'NASA’s MESSENGER spacecraft found water ice hiding in permanently shadowed craters near its poles.',
      ],
      observationGuide:
        'Mercury never strays far from the Sun, so look low on the horizon shortly after sunset or before sunrise around its “greatest elongation” dates. Never point binoculars or a telescope near the Sun.',
      stats: [
        { label: 'Surface gravity', value: '3.7 m/s²', g: 3.7 },
        { label: 'Distance from Sun', value: '57.9 million km (0.39 AU)' },
        { label: 'Diameter', value: '4,879 km' },
        { label: 'Year length', value: '88 Earth days' },
      ],
      clues: [
        'Its gravity is only 3.7 m/s² – a 10 kg backpack would feel like 3.8 kg.',
        'It is the closest planet to the Sun.',
        'Named after the speedy messenger of the Roman gods.',
      ],
      images: [{ src: IMG + 'mercury.jpg', credit: 'NASA / JHU APL / Carnegie Institution (MESSENGER)' }],
      nasaReference: { title: 'NASA Science – Mercury', url: 'https://science.nasa.gov/mercury/' },
    },
    {
      id: 'venus',
      name: 'Venus',
      aliases: [],
      category: 'Planet',
      difficulty: 'easy',
      color: '#f2d29b',
      sketch: 'venus',
      description:
        'Venus is the second planet from the Sun and Earth’s nearest planetary neighbor. Thick clouds of sulfuric acid trap heat, making it the hottest planet.',
      interestingFacts: [
        'Its surface is about 465 °C – hot enough to melt lead.',
        'Venus spins backwards compared to most planets, and one rotation takes 243 Earth days.',
        'Air pressure on the surface is about 90 times what we feel on Earth.',
      ],
      observationGuide:
        'Venus is often the brightest point of light in the sky after the Sun and Moon. Look in the west after sunset or the east before sunrise (it’s nicknamed the “Evening Star” or “Morning Star”). Through a small telescope it shows Moon-like phases.',
      stats: [
        { label: 'Surface gravity', value: '8.87 m/s²', g: 8.87 },
        { label: 'Distance from Sun', value: '108.2 million km (0.72 AU)' },
        { label: 'Diameter', value: '12,104 km' },
        { label: 'Surface temperature', value: '≈ 465 °C' },
      ],
      clues: [
        'Gravity here is 8.87 m/s² – almost the same as Earth’s 9.8.',
        'Often called the “Evening Star”, but it isn’t a star at all.',
        'Hottest planet, wrapped in thick clouds.',
      ],
      images: [{ src: IMG + 'venus.jpg', credit: 'NASA / JPL (Mariner 10)' }],
      nasaReference: { title: 'NASA Science – Venus', url: 'https://science.nasa.gov/venus/' },
    },
    {
      id: 'earth',
      name: 'Earth',
      aliases: ['the earth', 'planet earth', 'world'],
      category: 'Planet',
      difficulty: 'easy',
      color: '#4d96ff',
      sketch: 'earth',
      description:
        'Earth, our home planet, is the third planet from the Sun and the only place we know of that hosts life. About 71% of its surface is covered by water.',
      interestingFacts: [
        'Surface gravity is 9.8 m/s² – drop a ball and it gains about 9.8 m/s of speed every second.',
        'Sunlight takes about 8 minutes 20 seconds to reach Earth.',
        'Earth is the densest planet in the solar system.',
      ],
      observationGuide:
        'You’re standing on it! For a space view, explore NASA’s daily Earth images from the EPIC camera, or watch ISS live video of Earth from orbit.',
      stats: [
        { label: 'Surface gravity', value: '9.8 m/s²', g: 9.81 },
        { label: 'Distance from Sun', value: '149.6 million km (1 AU)' },
        { label: 'Diameter', value: '12,756 km' },
        { label: 'Day length', value: '≈ 24 hours' },
      ],
      clues: [
        'Gravity here is exactly the famous 9.8 m/s².',
        'One Astronomical Unit (AU) is defined by its distance to the Sun.',
        'Blue oceans, white clouds, green and brown continents.',
      ],
      images: [
        { src: IMG + 'earth.jpg', credit: 'NASA / NOAA (Blue Marble)' },
        { src: IMG + 'thorpe-cliff.jpg', credit: 'NASA – planetary scientists doing field geology on Earth (Scotland)' },
      ],
      nasaReference: { title: 'NASA Science – Earth', url: 'https://science.nasa.gov/earth/' },
    },
    {
      id: 'mars',
      name: 'Mars',
      aliases: ['red planet', 'the red planet'],
      category: 'Planet',
      difficulty: 'easy',
      color: '#e2603c',
      sketch: 'mars',
      description:
        'Mars is the fourth planet from the Sun – a dusty, cold desert world with a thin atmosphere. Rusty iron minerals in its soil give it a red color.',
      interestingFacts: [
        'Olympus Mons on Mars is the tallest volcano in the solar system – about 2.5 times the height of Mount Everest.',
        'Mars has two small moons, Phobos and Deimos.',
        'A day on Mars (a “sol”) is 24 hours and 37 minutes – very close to an Earth day.',
      ],
      observationGuide:
        'Mars looks like a reddish-orange “star” that doesn’t twinkle much. It is brightest around “opposition”, which happens roughly every 26 months. A telescope may show its polar ice caps.',
      stats: [
        { label: 'Surface gravity', value: '3.71 m/s²', g: 3.71 },
        { label: 'Distance from Sun', value: '227.9 million km (1.52 AU)' },
        { label: 'Diameter', value: '6,792 km' },
        { label: 'Year length', value: '687 Earth days' },
      ],
      clues: [
        'Gravity is 3.71 m/s² – you could jump about 2.6 times higher than on Earth.',
        'Home of NASA rovers Curiosity and Perseverance.',
        'Known for its rusty red color.',
      ],
      images: [{ src: IMG + 'mars.jpg', credit: 'ESA / MPS / OSIRIS team' }],
      nasaReference: { title: 'NASA Science – Mars', url: 'https://science.nasa.gov/mars/' },
    },
    {
      id: 'jupiter',
      name: 'Jupiter',
      aliases: [],
      category: 'Planet',
      difficulty: 'easy',
      color: '#d9a066',
      sketch: 'jupiter',
      description:
        'Jupiter is the largest planet in our solar system – more than twice as massive as all the other planets combined. It is a gas giant with colorful cloud bands.',
      interestingFacts: [
        'The Great Red Spot is a storm wider than Earth that has raged for centuries.',
        'Jupiter has the shortest day of any planet: about 10 hours.',
        'Its four large Galilean moons – Io, Europa, Ganymede and Callisto – were discovered by Galileo in 1610.',
      ],
      observationGuide:
        'Jupiter shines as a very bright, steady point of light. Even ordinary binoculars held steady can show up to four of its moons as tiny dots in a line.',
      stats: [
        { label: 'Cloud-top gravity', value: '24.79 m/s²', g: 24.79 },
        { label: 'Distance from Sun', value: '778.5 million km (5.2 AU)' },
        { label: 'Diameter', value: '142,984 km' },
        { label: 'Day length', value: '≈ 10 hours' },
      ],
      clues: [
        'Gravity is 24.79 m/s² – about 2.5 times Earth’s 9.8!',
        'Has a giant storm bigger than Earth.',
        'The largest planet of all.',
      ],
      images: [{ src: IMG + 'jupiter.jpg', credit: 'NASA / ESA / A. Simon (GSFC) – Hubble' }],
      nasaReference: { title: 'NASA Science – Jupiter', url: 'https://science.nasa.gov/jupiter/' },
    },
    {
      id: 'saturn',
      name: 'Saturn',
      aliases: [],
      category: 'Planet',
      difficulty: 'easy',
      color: '#e8cf94',
      sketch: 'saturn',
      description:
        'Saturn is the sixth planet from the Sun and is famous for its extensive ring system, made of countless pieces of ice and rock.',
      interestingFacts: [
        'Saturn is less dense than water – in a (gigantic) bathtub it would float.',
        'NASA’s Cassini spacecraft orbited Saturn for 13 years before diving into it in 2017.',
        'A six-sided jet stream, “the hexagon”, swirls around its north pole.',
      ],
      observationGuide:
        'Saturn can be observed from Earth and appears as a bright, yellowish object in the night sky. A small telescope at about 25× magnification can reveal its rings and its largest moon, Titan.',
      stats: [
        { label: 'Cloud-top gravity', value: '10.44 m/s²', g: 10.44 },
        { label: 'Distance from Sun', value: '1.43 billion km (9.5 AU)' },
        { label: 'Diameter', value: '120,536 km' },
        { label: 'Year length', value: '≈ 29.4 Earth years' },
      ],
      clues: [
        'Gravity is 10.44 m/s² – very close to Earth’s 9.8 even though it’s huge.',
        'It would float in water.',
        'Famous for its beautiful rings.',
      ],
      images: [
        { src: IMG + 'saturn-voyager2.jpg', credit: 'NASA / JPL (Voyager 2)' },
        { src: IMG + 'saturn-cassini-approach.jpg', credit: 'NASA / JPL / Space Science Institute (Cassini)' },
        { src: IMG + 'saturn-above.jpg', credit: 'NASA / JPL-Caltech / Space Science Institute (Cassini)' },
        { src: IMG + 'saturn-voyager-moons.jpg', credit: 'NASA / JPL (Voyager 1)' },
        { src: IMG + 'saturn-voyager1.jpg', credit: 'NASA / JPL (Voyager)' },
        { src: IMG + 'saturn-globe.jpg', credit: 'NASA / JPL-Caltech / Space Science Institute (Cassini)' },
        { src: IMG + 'saturn-rings-hd.jpg', credit: 'NASA / JPL-Caltech / Space Science Institute (Cassini)' },
        { src: IMG + 'saturn-backlit.jpg', credit: 'NASA / JPL / Space Science Institute (Cassini)' },
        { src: IMG + 'saturn-farewell.jpg', credit: 'NASA / JPL-Caltech / Space Science Institute (Cassini)' },
        { src: IMG + 'saturn-rings.jpg', credit: 'NASA / JPL / Space Science Institute (Cassini)' },
        { src: IMG + 'saturn-titan.jpg', credit: 'NASA / JPL-Caltech / Space Science Institute – Saturn and Titan' },
        { src: IMG + 'saturn-five-moons.jpg', credit: 'NASA / JPL / Space Science Institute – five moons' },
      ],
      nasaReference: { title: 'NASA Science – Saturn', url: 'https://science.nasa.gov/saturn/' },
    },
    {
      id: 'uranus',
      name: 'Uranus',
      aliases: [],
      category: 'Planet',
      difficulty: 'medium',
      color: '#9fe3e8',
      sketch: 'uranus',
      description:
        'Uranus is the seventh planet from the Sun – an ice giant that rotates on its side, tilted about 98 degrees.',
      interestingFacts: [
        'Because of its tilt, each pole gets around 42 years of continuous sunlight, then 42 years of darkness.',
        'Methane in its atmosphere gives Uranus its blue-green color.',
        'Voyager 2 is the only spacecraft to have visited Uranus (1986).',
      ],
      observationGuide:
        'Uranus is just at the limit of naked-eye visibility under very dark skies. Binoculars and a star chart make it easier – look for a faint blue-green “star”.',
      stats: [
        { label: 'Gravity', value: '8.69 m/s²', g: 8.69 },
        { label: 'Distance from Sun', value: '2.87 billion km (19.2 AU)' },
        { label: 'Diameter', value: '51,118 km' },
        { label: 'Year length', value: '84 Earth years' },
      ],
      clues: [
        'Gravity is 8.69 m/s² – a bit less than Earth’s 9.8.',
        'This ice giant spins tipped over on its side.',
        'Pale blue-green color.',
      ],
      images: [{ src: IMG + 'uranus.jpg', credit: 'NASA / JPL-Caltech (Voyager 2)' }],
      nasaReference: { title: 'NASA Science – Uranus', url: 'https://science.nasa.gov/uranus/' },
    },
    {
      id: 'neptune',
      name: 'Neptune',
      aliases: [],
      category: 'Planet',
      difficulty: 'medium',
      color: '#3d5afe',
      sketch: 'neptune',
      description:
        'Neptune is the eighth and most distant major planet from the Sun – a dark, cold ice giant whipped by supersonic winds.',
      interestingFacts: [
        'Neptune’s winds can exceed 2,000 km/h – the fastest in the solar system.',
        'It was the first planet found by mathematical prediction rather than by observation (1846).',
        'One Neptune year lasts about 165 Earth years.',
      ],
      observationGuide:
        'Neptune is too faint to see without optical aid. With a telescope and a star chart it appears as a tiny blue dot.',
      stats: [
        { label: 'Gravity', value: '11.15 m/s²', g: 11.15 },
        { label: 'Distance from Sun', value: '4.5 billion km (30.1 AU)' },
        { label: 'Diameter', value: '49,528 km' },
        { label: 'Year length', value: '≈ 165 Earth years' },
      ],
      clues: [
        'Gravity is 11.15 m/s² – slightly stronger than Earth’s 9.8.',
        'Farthest major planet from the Sun.',
        'Deep blue with a dark storm spot.',
      ],
      images: [{ src: IMG + 'neptune.jpg', credit: 'NASA / JPL (Voyager 2)' }],
      nasaReference: { title: 'NASA Science – Neptune', url: 'https://science.nasa.gov/neptune/' },
    },

    // ───────────────────────── MOON · SUN · ISS ─────────────────────────
    {
      id: 'moon',
      name: 'Moon',
      aliases: ['the moon', 'luna', 'full moon'],
      category: 'Natural Satellite',
      difficulty: 'easy',
      color: '#d6d6d6',
      sketch: 'moon',
      description:
        'The Moon is Earth’s only natural satellite. It is about one quarter of Earth’s width and orbits us roughly every 27 days.',
      interestingFacts: [
        'The Moon is about 384,400 km away – light takes only 1.3 seconds to cross that distance.',
        'Twelve astronauts walked on the Moon during NASA’s Apollo missions (1969–1972).',
        'The same side of the Moon always faces Earth because it is tidally locked.',
      ],
      observationGuide:
        'The easiest sky object to observe! Binoculars show craters and dark “seas” (maria). The best detail appears along the terminator – the line between day and night – during crescent and quarter phases.',
      stats: [
        { label: 'Surface gravity', value: '1.62 m/s²', g: 1.62 },
        { label: 'Distance from Earth', value: '384,400 km (≈ 1.3 light-seconds)' },
        { label: 'Diameter', value: '3,475 km' },
        { label: 'Orbit around Earth', value: '≈ 27.3 days' },
      ],
      clues: [
        'Gravity is 1.62 m/s² – about 1/6 of Earth’s 9.8. Astronauts bounced here!',
        'It is 384,400 km from Earth.',
        'Shows phases: crescent, half, full…',
      ],
      images: [{ src: IMG + 'moon.jpg', credit: 'Gregory H. Revera / Wikimedia Commons' }],
      nasaReference: { title: 'NASA Science – Earth’s Moon', url: 'https://science.nasa.gov/moon/' },
    },
    {
      id: 'sun',
      name: 'Sun',
      aliases: ['the sun', 'sol'],
      category: 'Star',
      difficulty: 'easy',
      color: '#ffb703',
      sketch: 'sun',
      description:
        'The Sun is the star at the center of our solar system – a 4.6-billion-year-old ball of hot plasma that holds the planets in their orbits.',
      interestingFacts: [
        'About 1.3 million Earths could fit inside the Sun.',
        'The Sun is 149.6 million km away; its light takes about 8 minutes 20 seconds to reach us.',
        'NASA’s Parker Solar Probe is the closest-ever spacecraft to the Sun.',
      ],
      observationGuide:
        'NEVER look directly at the Sun or point binoculars or telescopes at it. Use certified solar eclipse glasses or a pinhole projector. NASA’s Solar Dynamics Observatory publishes safe, near-live images online.',
      stats: [
        { label: 'Surface gravity', value: '274 m/s² (28 × Earth)', g: 274 },
        { label: 'Distance from Earth', value: '149.6 million km (1 AU)' },
        { label: 'Diameter', value: '1.39 million km' },
        { label: 'Surface temperature', value: '≈ 5,500 °C' },
      ],
      clues: [
        'Gravity is 274 m/s² – 28 times Earth’s 9.8!',
        'Its light takes about 8 minutes to reach you.',
        'The star our whole solar system orbits.',
      ],
      images: [{ src: IMG + 'sun.jpg', credit: 'NASA / SDO (AIA)' }],
      nasaReference: { title: 'NASA Science – The Sun', url: 'https://science.nasa.gov/sun/' },
    },
    {
      id: 'iss',
      name: 'International Space Station',
      aliases: ['iss', 'space station', 'the iss', 'international space station iss'],
      category: 'Spacecraft',
      difficulty: 'medium',
      color: '#cfd8dc',
      sketch: 'iss',
      description:
        'The International Space Station (ISS) is a science laboratory orbiting Earth about 400 km up. It has been continuously crewed by astronauts since November 2000.',
      interestingFacts: [
        'The ISS travels at about 28,000 km/h and circles Earth every 90 minutes – crews see about 16 sunrises a day.',
        'Gravity at the station’s height is still about 90% of Earth’s! Astronauts float because they are constantly falling around Earth (free fall).',
        'It is about as long as an American football field, including its huge solar arrays.',
      ],
      observationGuide:
        'The ISS looks like a very bright, steady, fast-moving point of light – no blinking lights. It’s visible shortly after sunset or before sunrise. Use NASA’s “Spot the Station” service for pass times at your location.',
      stats: [
        { label: 'Orbit altitude', value: '≈ 400 km' },
        { label: 'Speed', value: '≈ 28,000 km/h' },
        { label: 'One orbit', value: '≈ 90 minutes' },
        { label: 'Gravity at orbit', value: '≈ 8.7 m/s² (free fall!)', g: 8.7 },
      ],
      clues: [
        'Gravity up there is still ~8.7 m/s², yet the crew floats.',
        'Orbits Earth every 90 minutes at ~400 km altitude.',
        'Has huge solar panel “wings”.',
      ],
      images: [{ src: IMG + 'iss.jpg', credit: 'NASA (STS-132 crew)' }],
      nasaReference: { title: 'NASA – International Space Station', url: 'https://www.nasa.gov/international-space-station/' },
    },

    // ──────────────────── CONSTELLATIONS & CLUSTERS ────────────────────
    {
      id: 'orion',
      name: 'Orion',
      aliases: ['orion constellation', 'the hunter', 'orion the hunter'],
      category: 'Constellation',
      difficulty: 'medium',
      color: '#7fb3ff',
      sketch: 'orion',
      description:
        'Orion, “the Hunter”, is one of the most recognizable constellations, with three bright stars in a row forming Orion’s Belt.',
      interestingFacts: [
        'Red supergiant Betelgeuse marks his shoulder; blue-white Rigel marks his foot.',
        'The belt stars are Alnitak, Alnilam and Mintaka.',
        'Orion sits on the celestial equator, so it can be seen from almost everywhere on Earth.',
      ],
      observationGuide:
        'Best seen in evening skies from about December to March (Northern Hemisphere winter). Find the three belt stars in a short straight line, then the four bright stars forming a box around them.',
      stats: [
        { label: 'Betelgeuse distance', value: '≈ 550 light-years' },
        { label: 'Rigel distance', value: '≈ 860 light-years' },
        { label: 'Brightest stars', value: 'Rigel & Betelgeuse' },
        { label: 'Best season', value: 'Dec – Mar evenings (N. Hem.)' },
      ],
      clues: [
        'Look for three stars in a straight line – a “belt”.',
        'Named after a hunter from Greek mythology.',
        'Contains a red giant star named Betelgeuse.',
      ],
      images: [{ src: IMG + 'orion.jpg', credit: 'Mouser / Wikimedia Commons' }],
      nasaReference: { title: 'NASA Science – Skywatching', url: 'https://science.nasa.gov/skywatching/' },
    },
    {
      id: 'big-dipper',
      name: 'Big Dipper',
      aliases: ['the big dipper', 'plough', 'the plough', 'ursa major'],
      category: 'Asterism',
      difficulty: 'easy',
      color: '#ffe08a',
      sketch: 'dipper',
      description:
        'The Big Dipper is a pattern of seven bright stars in the constellation Ursa Major (the Great Bear), shaped like a ladle or saucepan.',
      interestingFacts: [
        'The two stars at the end of the “bowl”, Dubhe and Merak, point toward Polaris, the North Star.',
        'It is an asterism – a famous star pattern that is part of a larger constellation.',
        'In the UK it’s called “the Plough”.',
      ],
      observationGuide:
        'From mid-northern latitudes the Big Dipper is visible all year in the northern sky, highest in spring evenings. Follow the pointer stars upward to find the North Star.',
      stats: [
        { label: 'Number of stars', value: '7 bright stars' },
        { label: 'Typical distance', value: '≈ 80 – 125 light-years' },
        { label: 'Part of', value: 'Ursa Major (Great Bear)' },
        { label: 'Best season', value: 'Spring evenings (N. Hem.)' },
      ],
      clues: [
        'Seven stars shaped like a kitchen ladle.',
        'Two of its stars point toward the North Star.',
        'Part of the Great Bear constellation.',
      ],
      images: [{ src: IMG + 'big-dipper.jpg', credit: 'Johannes Hevelius, Uranographia (1690)' }],
      nasaReference: { title: 'NASA Science – Skywatching', url: 'https://science.nasa.gov/skywatching/' },
    },
    {
      id: 'pleiades',
      name: 'Pleiades',
      aliases: ['seven sisters', 'the pleiades', 'm45', 'subaru'],
      category: 'Star Cluster',
      difficulty: 'hard',
      color: '#8ecdff',
      sketch: 'pleiades',
      description:
        'The Pleiades (M45), or “Seven Sisters”, is a young open star cluster of hot blue stars in the constellation Taurus.',
      interestingFacts: [
        'The cluster lies about 444 light-years away and contains more than 1,000 stars.',
        'Its stars are only about 100 million years old – babies compared with our 4.6-billion-year-old Sun.',
        'The car company Subaru is named after the Japanese name for the cluster, and its logo shows it.',
      ],
      observationGuide:
        'Look for a tiny, dipper-shaped cluster of blue-white stars, best in evening skies from about November to March. Binoculars reveal dozens of stars.',
      stats: [
        { label: 'Distance', value: '≈ 444 light-years' },
        { label: 'Age', value: '≈ 100 million years' },
        { label: 'Messier number', value: 'M45' },
        { label: 'Constellation', value: 'Taurus' },
      ],
      clues: [
        'Nicknamed the “Seven Sisters”.',
        'A tight little cluster of blue stars in Taurus.',
        'A car brand’s logo shows it.',
      ],
      images: [
        { src: IMG + 'pleiades.jpg', credit: 'NASA / ESA / AURA / Caltech' },
        { src: IMG + 'perseus-art.jpg', credit: 'NASA – sky chart (Pleiades lower right, near Perseus)' },
      ],
      nasaReference: { title: 'NASA Hubble – Messier 45', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-45/' },
    },

    // ───────────────────── GALAXIES & NEBULAE ─────────────────────
    {
      id: 'milky-way',
      name: 'Milky Way',
      aliases: ['the milky way', 'milky way galaxy', 'our galaxy'],
      category: 'Galaxy',
      difficulty: 'medium',
      color: '#e0c3fc',
      sketch: 'milkyway',
      description:
        'The Milky Way is our home galaxy – a barred spiral of hundreds of billions of stars. From dark places on Earth we see it as a glowing band across the sky.',
      interestingFacts: [
        'It is about 100,000 light-years across.',
        'Our Sun sits about 26,000 light-years from the galactic center.',
        'A supermassive black hole, Sagittarius A*, sits at the center – about 4 million times the Sun’s mass.',
      ],
      observationGuide:
        'Get far from city lights on a moonless night. In the Northern Hemisphere the brightest, central part is best seen in summer evenings toward Sagittarius.',
      stats: [
        { label: 'Diameter', value: '≈ 100,000 light-years' },
        { label: 'Sun to center', value: '≈ 26,000 light-years' },
        { label: 'Stars', value: '100 – 400 billion' },
        { label: 'Type', value: 'Barred spiral galaxy' },
      ],
      clues: [
        'You live inside it.',
        'Looks like a cloudy band of light across a dark sky.',
        'Named after something you can pour on cereal.',
      ],
      images: [
        { src: IMG + 'night-scene.jpg', credit: 'NASA / Bill Dunford' },
        { src: IMG + 'milky-way.jpg', credit: 'Steve Jurvetson / Wikimedia Commons' },
      ],
      nasaReference: { title: 'NASA Science – The Milky Way Galaxy', url: 'https://science.nasa.gov/resource/the-milky-way-galaxy/' },
    },
    {
      id: 'andromeda',
      name: 'Andromeda Galaxy',
      aliases: ['andromeda', 'm31', 'the andromeda galaxy'],
      category: 'Galaxy',
      difficulty: 'hard',
      color: '#c9b6ff',
      sketch: 'andromeda',
      description:
        'The Andromeda Galaxy (M31) is the nearest large spiral galaxy to the Milky Way and the most distant object most people can see without a telescope.',
      interestingFacts: [
        'Its light has traveled about 2.5 million years to reach your eyes.',
        'Andromeda contains roughly a trillion stars.',
        'Astronomers have long predicted it may merge with the Milky Way billions of years from now.',
      ],
      observationGuide:
        'Best in autumn evenings from the Northern Hemisphere. From a dark site, look for a faint oval smudge in the constellation Andromeda; binoculars help a lot.',
      stats: [
        { label: 'Distance', value: '≈ 2.5 million light-years' },
        { label: 'Messier number', value: 'M31' },
        { label: 'Type', value: 'Spiral galaxy' },
        { label: 'Best season', value: 'Autumn evenings (N. Hem.)' },
      ],
      clues: [
        'Its light left it 2.5 million years ago.',
        'Our nearest big spiral neighbor galaxy.',
        'Named after a princess from Greek mythology.',
      ],
      images: [{ src: IMG + 'andromeda.jpg', credit: 'Adam Evans / Wikimedia Commons' }],
      nasaReference: { title: 'NASA Hubble – Messier 31', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-31/' },
    },
    {
      id: 'orion-nebula',
      name: 'Orion Nebula',
      aliases: ['m42', 'the orion nebula', 'great orion nebula'],
      category: 'Nebula',
      difficulty: 'hard',
      color: '#ff7eb6',
      sketch: 'nebula',
      description:
        'The Orion Nebula (M42) is a huge cloud of gas and dust where new stars are being born – the closest large star-forming region to Earth.',
      interestingFacts: [
        'It lies roughly 1,344 light-years away.',
        'At its heart, four bright young stars called the Trapezium light up the gas.',
        'Hubble has found many young stars here surrounded by planet-forming disks.',
      ],
      observationGuide:
        'Find Orion’s Belt, then look just below it for the “sword”. The middle “star” of the sword is the nebula – a fuzzy glow to the eye, a glowing cloud in binoculars.',
      stats: [
        { label: 'Distance', value: '≈ 1,344 light-years' },
        { label: 'Messier number', value: 'M42' },
        { label: 'Type', value: 'Star-forming nebula' },
        { label: 'Location', value: 'Orion’s Sword' },
      ],
      clues: [
        'A cosmic nursery where stars are born.',
        'Hangs below the hunter’s belt.',
        'A glowing cloud of pink and purple gas.',
      ],
      images: [{ src: IMG + 'orion-nebula.jpg', credit: 'NASA / ESA / M. Robberto – Hubble' }],
      nasaReference: { title: 'NASA Hubble – Messier 42', url: 'https://science.nasa.gov/mission/hubble/science/explore-the-night-sky/hubble-messier-catalog/messier-42/' },
    },

    // ───────────────────────── METEOR SHOWERS ─────────────────────────
    {
      id: 'orionids',
      name: 'Orionid Meteor Shower',
      aliases: ['orionids', 'orionid', 'orionid meteors', 'orionid shower'],
      category: 'Meteor Shower',
      difficulty: 'hard',
      color: '#ffd166',
      sketch: 'meteor',
      description:
        'The Orionids are an annual meteor shower made of dust left behind by the famous Halley’s Comet. The meteors seem to fly out of the constellation Orion.',
      interestingFacts: [
        'Orionid meteors hit our atmosphere at about 66 km/s – among the fastest.',
        'Halley’s Comet also produces a second shower each May: the Eta Aquariids.',
        'At peak you might see around 20 meteors per hour under dark skies.',
      ],
      observationGuide:
        'The shower is usually active from early October to early November, with its peak around October 20–22. Watch after midnight from a dark place, lie back, and let your eyes adapt for 30 minutes – no telescope needed.',
      stats: [
        { label: 'Parent comet', value: '1P/Halley' },
        { label: 'Typical peak', value: 'Around Oct 21 each year' },
        { label: 'Meteor speed', value: '≈ 66 km/s' },
        { label: 'Rate at peak', value: '≈ 20 per hour' },
      ],
      clues: [
        'Dust from Halley’s Comet burning up in our sky.',
        'Streaks seem to come out of the hunter constellation.',
        'Peaks in late October each year.',
      ],
      images: [{ src: IMG + 'meteor.jpg', credit: 'Navicore / Wikimedia Commons – a meteor streak' }],
      nasaReference: { title: 'NASA Science – Orionids', url: 'https://science.nasa.gov/solar-system/meteors-meteorites/orionids/' },
    },
    {
      id: 'draconids',
      name: 'Draconid Meteor Shower',
      aliases: ['draconids', 'draconid', 'draconid meteors', 'giacobinids'],
      category: 'Meteor Shower',
      difficulty: 'hard',
      color: '#7cf29a',
      sketch: 'meteor',
      description:
        'The Draconids are an early-October meteor shower created by debris from comet 21P/Giacobini-Zinner. They appear to radiate from the constellation Draco, the Dragon.',
      interestingFacts: [
        'Unlike most showers, the Draconids are best seen in the evening rather than before dawn.',
        'Usually it is a quiet shower, but in 1933 and 1946 it produced spectacular outbursts of thousands of meteors per hour.',
        'Draconid meteors are slow – about 20 km/s.',
      ],
      observationGuide:
        'Usually peaks around October 8–9 each year. Look toward the northern sky in the evening from a dark location. Rates are normally low, so be patient!',
      stats: [
        { label: 'Parent comet', value: '21P/Giacobini-Zinner' },
        { label: 'Typical peak', value: 'Around Oct 8 each year' },
        { label: 'Meteor speed', value: '≈ 20 km/s (slow)' },
        { label: 'Radiant', value: 'Draco, the Dragon' },
      ],
      clues: [
        'Named after a dragon constellation.',
        'Best seen in the evening, unlike most meteor showers.',
        'Shooting stars in early October.',
      ],
      images: [{ src: IMG + 'night-scene.jpg', credit: 'NASA / Bill Dunford – dark-sky viewing site' }],
      nasaReference: { title: 'NASA Science – Meteors & Meteorites', url: 'https://science.nasa.gov/solar-system/meteors-meteorites/' },
    },
    {
      id: 'perseids',
      name: 'Perseid Meteor Shower',
      aliases: ['perseids', 'perseid', 'perseid meteors'],
      category: 'Meteor Shower',
      difficulty: 'hard',
      color: '#ff8a3d',
      sketch: 'meteor',
      description:
        'The Perseids are one of the most popular meteor showers, produced by comet Swift-Tuttle. Meteors appear to come from the constellation Perseus.',
      interestingFacts: [
        'At peak, dark skies can show 50–100 meteors per hour.',
        'The Perseids are famous for “fireballs” – extra-bright meteors.',
        'Comet Swift-Tuttle’s nucleus is about 26 km wide.',
      ],
      observationGuide:
        'Usually active mid-July to late August, peaking around August 12–13. Best in the pre-dawn hours from the Northern Hemisphere, away from city lights.',
      stats: [
        { label: 'Parent comet', value: '109P/Swift-Tuttle' },
        { label: 'Typical peak', value: 'Around Aug 12 each year' },
        { label: 'Meteor speed', value: '≈ 59 km/s' },
        { label: 'Radiant', value: 'Perseus' },
      ],
      clues: [
        'Summer shooting stars, peaking in August.',
        'Appears to fly out of the hero constellation Perseus.',
        'Famous for bright fireballs.',
      ],
      images: [{ src: IMG + 'perseus-art.jpg', credit: 'NASA – Perseus constellation art' }],
      nasaReference: { title: 'NASA Science – Perseids', url: 'https://science.nasa.gov/solar-system/meteors-meteorites/perseids/' },
    },
  ];
});
