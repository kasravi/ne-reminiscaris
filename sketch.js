let texts = [];
let genocideData = {};
let font;
let myMusicTracks = [];
let currentStageIndex = 0;
let currentTrackIndex = 0;
let playingMusic = false;
let fontSize=18;
let subFontSize=10;
let stages = ["Classification", "Symbolization", "Discrimination", "Dehumanization", "Organization", "Polarization", "Preparation", "Persecution", "Extermination", "Denial"];

function preload() {
  let trackNames = ['1-Intro.mp3']; // Add more track names as necessary

  for (let i = 0; i < trackNames.length; i++) {
    myMusicTracks.push(loadSound(trackNames[i]));
  }
  font = loadFont('Lora-VariableFont_wght.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);
  smooth();
  colorMode(RGB);
  stroke(0);
  strokeWeight(0.5);

  fill(0);
  textFont(font);

  loadGenocideData();
}

function draw() {
  background(0);

  for (let i = 0; i < texts.length; i++) {
    let t = texts[i];
    let elapsedTime = millis() - t.startTime;
    let charsToShow = Math.min(floor(elapsedTime / t.delay), t.text.length);

    if (!t.readyToFade && charsToShow >= t.text.length) {
      t.fadeStartTime = millis() + 2000; // Small delay before subtext starts to fade in
      t.readyToFade = true;
      textSize(t.fontSize);
      t.mainTextHeight = font.textBounds(t.text, t.x, t.y, t.fontSize).h; // Store main text height
    }

    let subTextY = t.y + t.mainTextHeight + 5;

    if (!t.readyToFade) {
      let displayedText = t.text.substring(0, charsToShow);
      fill(t.color);
      textSize(t.fontSize);
      text(displayedText, t.x, t.y, t.width);
    }

    if (t.readyToFade) {
      let subFadeElapsed = millis() - t.fadeStartTime;

      // Fade in subtext
      if (subFadeElapsed <= t.subFadeInDuration) {
        let fadeInProgress = constrain(subFadeElapsed / t.subFadeInDuration, 0, 1);
        let fadeInColor = lerpColor(color(0), color(t.color), fadeInProgress);
        fill(fadeInColor);

        textSize(t.subFontSize);
        text(t.subText, t.x, subTextY);

        fill(t.color);
        textSize(t.fontSize);
        text(t.text, t.x, t.y, t.width);
      } else if (subFadeElapsed >= t.subFadeInDuration) {
        let fadeOutElapsed = subFadeElapsed - t.subFadeInDuration;

        if (fadeOutElapsed <= t.mainFadeOutDuration) {
          let fadeOutProgress = constrain(fadeOutElapsed / t.mainFadeOutDuration, 0, 1);
          let fadeOutColor = lerpColor(color(t.color), color(0), fadeOutProgress);
          fill(fadeOutColor);
          textSize(t.fontSize);
          text(t.text, t.x, t.y, t.width);
        }

        let subFadeOutProgress = constrain((fadeOutElapsed - t.mainFadeOutDuration) / (t.subFadeOutDuration - t.mainFadeOutDuration), 0, 1);
        let subFadeOutColor = lerpColor(color(t.color), color(0), subFadeOutProgress);
        fill(subFadeOutColor);

        textSize(t.subFontSize);
        text(t.subText, t.x, subTextY);

        if (subFadeOutProgress >= 1) {
          texts.splice(i, 1);
        }
      }
    }
  }
}

function startTyping(originalText, x, y, color, width, delay, originalSubText = "", fontSize = 32, subFontSize = 16) {
  let text = addNewlinesIfNeeded(originalText, width);
  let subText = addNewlinesIfNeeded(originalSubText, width);

  texts.push({
    text: text,
    x: x,
    y: y,
    color: color,
    width: width,
    delay: delay,
    startTime: millis(),
    readyToFade: false,
    fadeStartTime: null,
    fontSize: fontSize,
    subText: subText,
    subFontSize: subFontSize,
    mainFadeOutDuration: 5000,
    subFadeInDuration: 2000,
    subFadeOutDuration: 8000,
    mainTextHeight: null
  });
}

function addNewlinesIfNeeded(text, width) {
  let words = text.split(' ');
  let currentLine = '';
  let newText = '';

  for (let word of words) {
    let testLine = currentLine + word + ' ';
    let bounds = font.textBounds(testLine, 0, 0, 32);

    if (bounds.w > width && currentLine.length > 0) {
      newText += currentLine.trim() + '\n';
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  }
  newText += currentLine.trim();
  return newText;
}

function mousePressed() {
  if (playingMusic) {
    // Stop the music and show the next stage text
    myMusicTracks[currentTrackIndex].stop();
    playingMusic = false;
    if (currentStageIndex < stages.length) {
      let stage = stages[currentStageIndex];
      let items = genocideData[stage];

      if (items) {
        let delays = items.map(() => random(6000, 10000)); // Random delay for each item
        let accumulatedDelay = 0;

        items.forEach((item, index) => {
          setTimeout(() => {
            let positionFound = false;
            let maxTries = 100; // Max number of attempts to find a non-overlapping position
            let randomX, randomY;

            while (!positionFound && --maxTries > 0) {
              randomX = random(50, width - 700);
              randomY = random(50, height - 500);

              positionFound = true;

              for (let t of texts) {
                textSize(t.fontSize);
                let textBounds = font.textBounds(t.text, t.x, t.y, t.fontSize);
                let newTextBounds = font.textBounds(item.evidence, randomX, randomY, 18);

                // Check if the new text box overlaps with any existing text box
                if (!(randomX + newTextBounds.w < t.x ||
                      randomX > t.x + textBounds.w ||
                      randomY + newTextBounds.h < t.y ||
                      randomY > t.y + textBounds.h)) {
                  positionFound = false;
                  break;
                }
              }
            }

            if (maxTries > 0) {
              let randomColor = color(random(90, 100), random(90, 100), random(90, 100));
              let randomText = item.evidence;
              startTyping(randomText, randomX, randomY, randomColor, 700, 100, item.source, 18, 10);
            } else {
              console.warn("Could not find non-overlapping position for text box.");
            }
          }, accumulatedDelay);

          accumulatedDelay += delays[index];
        });

        currentStageIndex++;
      }
    }
  } else {
    // Play the next music track
    if (currentTrackIndex < myMusicTracks.length) {
      playingMusic = true;
      myMusicTracks[currentTrackIndex].play();
      currentTrackIndex = (currentTrackIndex + 1) % myMusicTracks.length;
    }
  }
}

function loadGenocideData() {
  loadTable('genocides.tsv', 'tsv', 'header', (table) => {
    let genocideDataT = [];
    for (let i = 0; i < table.getRowCount(); i++) {
      let row = table.getRow(i);
      genocideDataT.push({
        stageName: row.get('Stage Name'),
        genocideName: row.get('Genocide Name'),
        evidence: row.get('Evidence'),
        source: row.get('Source')
      });
    }
    genocideData = genocideDataT.reduce((acc, item) => {
      if (!acc[item.stageName]) {
        acc[item.stageName] = [];
      }
      acc[item.stageName].push(item);
      return acc;
    }, {});
  }, (err) => {
    console.error("Failed to load file:", err);
  });
}