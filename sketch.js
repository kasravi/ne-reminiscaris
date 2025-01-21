let texts = [];
let genocideData = {};
let font;
let myMusicTracks = [];
let currentStageIndex = -1;
let currentTrackIndex = -1;
let playingMusic = false;
let fontSize = 18;
let subFontSize = 10;
let stages = [
  "Classification",
  "Symbolization",
  "Discrimination",
  "Dehumanization",
  "Organization",
  "Polarization",
  "Preparation",
  "Persecution",
  "Extermination",
  "Denial",
];
let titleText = "Ne Reminiscaris";
let fft;
let startedAt = 0;

let backgroundColor;

var titleFade = 255;
let targetTitleX, targetTitleY, targetTitleColor, targetTitleSize;
let currentTitleX, currentTitleY, currentTitleColor, currentTitleSize;
let titleEasing = 0.05; // Adjust for transition speed

let initCircleAlpha = 0;

function preload() {
  let trackNames = [
    "1-Intro",
    "2-Classification",
    "3-Symbolization",
    "4-Dehumanization",
    "5-Organization",
    "6-Polarization",
    "7-Preparation",
    "8-Extermination",
    "9-Denial"]
  for (let i = 0; i < trackNames.length; i++) {
    let s = loadSound(trackNames[i]+".mp3");
    s.setVolume(0.5);
    myMusicTracks.push(s);
  }
  font = loadFont("Lora-VariableFont_wght.ttf");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  angleMode(DEGREES);

  backgroundColor = color(0, 0, 0);
  smooth();
  colorMode(RGB);
  stroke(0);
  strokeWeight(0.5);

  fill(0);
  textFont(font);

  fft = new p5.FFT();

  currentTitleX = width / 3;
  currentTitleY = height / 3;
  currentTitleColor = color(100); // Initial color
  currentTitleSize = 40;

  targetTitleX = currentTitleX;
  targetTitleY = currentTitleY;
  targetTitleColor = currentTitleColor;
  targetTitleSize = currentTitleSize;

  loadGenocideData();
}

let waves = [];

function visualizeSpectrum() {
  if (initCircleAlpha <= 0) return;

  push();

  strokeWeight(1);
  noFill();

  translate(width / 2, height / 2);

  if (playingMusic) {
    waves.unshift(fft.waveform());
  }
  for (let i = 0; i < waves.length; i++) {
    let wave = waves[i];
    let circleColor = color(
      random(90, 100),
      random(90, 100),
      random(90, 100),
      initCircleAlpha * (1 - i / (waves.length - 1))
    );
    initCircleAlpha * (1 - i / (waves.length - 1));
    stroke(circleColor);
    beginShape();
    for (let i = 0; i <= 360; i += 10) {
      //180 metade de um circulo
      let index = floor(map(i, 0, 360, 0, wave.length - 1));

      let r = map(wave[index], -1, 1, 150, 350);

      let x = r * sin(i);
      let y = r * cos(i);
      vertex(x, y);
    }
    endShape();
  }
  if (waves.length > 10) {
    waves.pop();
  }
  pop();
}

function drawTitleIfNeeded() {
  push();
  if (startedAt === 0) {
    if (frameCount % 3 === 0) {
      // Adjust frequency of change
      targetTitleX = width / 3.5 + random(-2, 2);
      targetTitleY = height / 3 + random(-1, 1);
      targetTitleColor = color(random(80, 120));
      targetTitleSize = random(39, 41);
    }

    // Smoothly transition to the target properties
    currentTitleX += (targetTitleX - currentTitleX) * titleEasing;
    currentTitleY += (targetTitleY - currentTitleY) * titleEasing;
    currentTitleColor = lerpColor(
      currentTitleColor,
      targetTitleColor,
      titleEasing
    );
    currentTitleSize += (targetTitleSize - currentTitleSize) * titleEasing;

    fill(currentTitleColor);
    textSize(40);
    text(titleText, currentTitleX, currentTitleY);
  } else if (titleFade > 1) {
    currentTitleColor.setAlpha(titleFade);
    fill(currentTitleColor);
    textSize(40);
    text(titleText, currentTitleX, currentTitleY);
    titleFade -= 5;
  }
  pop();
}

function renderTexts() {
  // Timing variables
  let delayBeforeFade = 100; // Delay before subtext starts to fade in (milliseconds)
  let mainTextFadeOutDelay = 8000; // Delay before main text starts to fade out after subtext fade in (milliseconds)

  push(); // Save the current drawing state

  for (let i = texts.length - 1; i >= 0; i--) {
    let t = texts[i];
    let elapsedTime = millis() - t.startTime;
    let charsToShow = Math.min(floor(elapsedTime / t.delay), t.text.length);

    // Check if the main text has fully appeared
    if (!t.readyToFade && charsToShow >= t.text.length) {
      t.fadeStartTime = millis(); // Set the fade start time immediately after the text appears
      t.readyToFade = true;
      textSize(t.fontSize);
      t.mainTextHeight = font.textBounds(t.text, t.x, t.y, t.fontSize).h; // Store main text height
    }

    let subTextY = t.y + t.mainTextHeight + 5; // Position subtext below the main text

    if (!t.readyToFade) {
      // Display main text, appearing letter by letter
      let displayedText = t.text.substring(0, charsToShow);
      fill(t.color);
      textSize(t.fontSize);
      text(displayedText, t.x, t.y, t.width);
    } else {
      let fadeElapsedTime = millis() - t.fadeStartTime;

      // Handling subtext fade in
      if (fadeElapsedTime <= delayBeforeFade) {
        fill(t.color);
        textSize(t.fontSize);
        text(t.text, t.x, t.y, t.width);
      } else {
        let subFadeInElapsed = fadeElapsedTime - delayBeforeFade;

        if (subFadeInElapsed <= t.subFadeInDuration) {
          let fadeInProgress = constrain(
            subFadeInElapsed / t.subFadeInDuration,
            0,
            1
          );
          let fadeInColor = lerpColor(
            backgroundColor,
            color(t.color),
            fadeInProgress
          );
          fill(fadeInColor);
          textSize(t.subFontSize);
          text(t.subText, t.x, subTextY);

          // Draw main text again
          fill(t.color);
          textSize(t.fontSize);
          text(t.text, t.x, t.y, t.width);
        } else {
          // Main text fade out duration calculation
          let mainFadeOutStart =
            delayBeforeFade + t.subFadeInDuration + mainTextFadeOutDelay;
          let mainFadeOutElapsed = fadeElapsedTime - mainFadeOutStart;

          if (mainFadeOutElapsed <= t.mainFadeOutDuration) {
            let mainFadeOutProgress = constrain(
              mainFadeOutElapsed / t.mainFadeOutDuration,
              0,
              1
            );
            let mainFadeOutColor = lerpColor(
              color(t.color),
              backgroundColor,
              mainFadeOutProgress
            );
            fill(mainFadeOutColor);
            textSize(t.fontSize);
            text(t.text, t.x, t.y, t.width);

            // Draw subtext
            fill(t.color);
            textSize(t.subFontSize);
            text(t.subText, t.x, subTextY);
          } else {
            // Subtext fade out duration calculation
            let subFadeOutStart = mainFadeOutStart + t.mainFadeOutDuration;
            let subFadeOutElapsed = fadeElapsedTime - subFadeOutStart;

            if (subFadeOutElapsed <= t.subFadeOutDuration) {
              let subFadeOutProgress = constrain(
                subFadeOutElapsed / t.subFadeOutDuration,
                0,
                1
              );
              let subFadeOutColor = lerpColor(
                color(t.color),
                backgroundColor,
                subFadeOutProgress
              );
              fill(subFadeOutColor);
              textSize(t.subFontSize);
              text(t.subText, t.x, subTextY);
            } else {
              // Remove text from array when fully faded out
              texts.splice(i, 1);
            }
          }
        }
      }
    }
  }

  pop(); // Restore the previous drawing state
}
function draw() {
  background(backgroundColor);
  drawTitleIfNeeded();

  if (currentTrackIndex>=0) {
      if(myMusicTracks[currentTrackIndex].isPlaying()){
        if (initCircleAlpha < 255) {
          initCircleAlpha+=0.2;
        }
      } else {
        if (initCircleAlpha > 0) {
          initCircleAlpha-=0.5;
        }
      }
  }
  visualizeSpectrum();

  renderTexts();
}

function startTyping(
  originalText,
  x,
  y,
  color,
  width,
  delay,
  originalSubText = "",
  fontSize = 32,
  subFontSize = 16
) {
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
    mainTextHeight: null,
  });
}

function addNewlinesIfNeeded(text, width) {
  let words = text.split(" ");
  let currentLine = "";
  let newText = "";

  for (let word of words) {
    let testLine = currentLine + word + " ";
    let bounds = font.textBounds(testLine, 0, 0, 32);

    if (bounds.w > width && currentLine.length > 0) {
      newText += currentLine.trim() + "\n";
      currentLine = word + " ";
    } else {
      currentLine = testLine;
    }
  }
  newText += currentLine.trim();
  return newText;
}

function getNonOverlappingPosition(
  existingPositions,
  width,
  height,
  maxWidth,
  maxHeight,
  delay
) {
  let newPos = { x: random(maxWidth - width), y: random(maxHeight - height) };
  let counter = 0;
  while (checkOverlap(existingPositions, newPos, width, height, delay)) {
    counter++;
    if (counter > 1000) break;
    newPos = { x: random(maxWidth - width), y: random(maxHeight - height) };
  }
  return newPos;
}

function checkOverlap(boxes, newBox, width, height, delay) {
  for (let i = 0; i < boxes.length; i++) {
    let existing = boxes[i];
    // Check only boxes active within delay/2 ms
    if (Math.abs(delay - existing.d) < 30000) {
      if (
        newBox.x < existing.x + existing.w &&
        newBox.x + width > existing.x &&
        newBox.y < existing.y + existing.h &&
        newBox.y + height > existing.y
      ) {
        return true;
      }
    }
  }

  return false;
}

function mousePressed(){
  handleStageChange();
}

function keyPressed() {
  if (key === ' ' || keyCode === 32) {
    // Call your function here that you want to trigger with the space bar
    handleStageChange();
  }
}

// Your existing mousePressed logic can be moved to this function
function handleStageChange() {
  startedAt = millis();
  if (playingMusic) {
    // Stop the music and show the next stage text
    myMusicTracks[currentTrackIndex].stop();
    playingMusic = false;
    if (currentStageIndex < stages.length) {
      currentStageIndex++;

      let stage = stages[currentStageIndex];
      let items = genocideData[stage];

      if (items) {
        let delays = items.map(() => random(8000, 14000)); // Random delay for each item
        let accumulatedDelay = 0;

        let poses = [];
        items.forEach((item, index) => {
          let randomPos = getNonOverlappingPosition(
            poses,
            700,
            200,
            width,
            height,
            accumulatedDelay
          );
          poses.push({
            x: randomPos.x,
            y: randomPos.y,
            w: 700,
            h: 200,
            d: accumulatedDelay,
          });
          let randomColor = color(
            random(90, 100),
            random(90, 100),
            random(90, 100)
          );
          let randomText = item.evidence;
          setTimeout(() => {
            startTyping(
              randomText,
              randomPos.x,
              randomPos.y,
              randomColor,
              700,
              110,
              item.source,
              18,
              10
            );
          }, accumulatedDelay);

          accumulatedDelay += delays[index];
        });

      }
    }
  } else {
    // Play the next music track
    if (currentTrackIndex < myMusicTracks.length) {
      currentTrackIndex = currentTrackIndex + 1;
      playingMusic = true;
      myMusicTracks[currentTrackIndex].play();
      fft.setInput(myMusicTracks[currentTrackIndex]);
    }
  }
}

function loadGenocideData() {
  loadTable(
    "genocides.tsv",
    "tsv",
    "header",
    (table) => {
      let genocideDataT = [];
      for (let i = 0; i < table.getRowCount(); i++) {
        let row = table.getRow(i);
        genocideDataT.push({
          stageName: row.get("Stage Name"),
          genocideName: row.get("Genocide Name"),
          evidence: row.get("Evidence"),
          source: row.get("Source"),
        });
      }
      genocideData = genocideDataT.reduce((acc, item) => {
        if (!acc[item.stageName]) {
          acc[item.stageName] = [];
        }
        acc[item.stageName].push(item);
        return acc;
      }, {});
    },
    (err) => {
      console.error("Failed to load file:", err);
    }
  );
}
