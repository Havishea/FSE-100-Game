let track = [];
let trackDistance = 0;
let carPos = 0;
let playerCurvature = 0;
let trackCurvature = 0;
let currentLapTime = 0;
let lapTimes = [0, 0, 0, 0, 0];
let speed = 0;
let distance = 0;
let curvature = 0;
let pixelCanvas;
let carImage;
let barrelImage;
let backgroundMusic;
let backgroundRev;
let hillHeight = 40;
let carDirection;
let carImageLeft;
let carImageRight;
let gameOver = false; // Game state


function preload() {
  carImage = loadImage('Purple rain.png');
  carImageLeft = loadImage('car - left.png');
  carImageRight = loadImage('Car - right.png');
  backgroundMusic = loadSound('Level 3.m4a'); 
  backgroundRev = loadSound('Rev.m4a'); 
  barrelImage = loadImage('Flaming Barrel copy.png');
  backgroundImage = loadImage('BACKG.jpg');
}

function setup() {
  createCanvas(854, 480);
  frameRate(60);

  
  backgroundRev.play();
  backgroundRev.onended(() => {
    backgroundMusic.loop(); 
  });

  // low-resolution graphics buffer 
  pixelCanvas = createGraphics(200, 150);

  // Define track with curvature and length [curvature, length]
  track = [
    [0.0, 100.0], [0.0, 200.0], [1.0, 200.0],
    [0.0, 400.0], [-1.0, 100.0], [1.0, 200.0],
    [-1.0, 200.0], [1.0, 200.0], [0.0, 200.0],
    [0.2, 500.0], [0.0, 200.0]
  ];

  // Calculate total track distance
  track.forEach(t => trackDistance += t[1]);
}

function draw() {
  if (gameOver) {
    pixelCanvas.background(0);
    pixelCanvas.fill(255, 0, 0);
    pixelCanvas.textSize(20);
    pixelCanvas.textAlign(CENTER);
    pixelCanvas.text("GREAT DRIVING!", pixelCanvas.width / 2, pixelCanvas.height / 2);

    // Display game-over screen
    image(pixelCanvas, 0, 0, width, height);
    return; // Stop updating the game
  }

  pixelCanvas.background(0, 0, 0);
  drawHill(pixelCanvas);
  drawTrack(pixelCanvas);
  drawCar(pixelCanvas);
  drawStats(pixelCanvas);

  // Display the pixelated buffer scaled up to full size
  image(pixelCanvas, 0, 0, width, height);
}

function updateBarrels() {
  barrels.forEach((barrel, index) => {
    let relativeDistance = barrel.distance - (distance * 0.5); 

    if (relativeDistance < -1) {
      barrels.splice(index, 1);
    }
  });

  // Periodically spawn new barrels
  if (frameCount % 240 === 0) { 
    spawnBarrel();
  }
}

function spawnBarrel() {
  let barrel = {
    distance: distance + random(10, 20), 
    position: random(-0.2, 0.2) 
  };
  barrels.push(barrel);
}

function drawBarrels(g) {
  barrels.forEach(barrel => {
    let relativeDistance = barrel.distance - (distance - 0.5); // Consistent slowdown

    if (relativeDistance > 0) {
      let perspective = 1 / relativeDistance; 
      let midPoint = 0.5 + curvature * pow(perspective - 1, 3);
      let laneWidth = perspective * 0.5; 

      let barrelX = g.width * (midPoint + barrel.position * laneWidth) - 100;
      let barrelY = g.height * (perspective - 1) + 10; // Lower = closer
      let barrelScale = perspective * 40; // Scale size by perspective

      // Draw the barrel at the calculated position
      g.image(barrelImage, barrelX - barrelScale / 2, barrelY - barrelScale, barrelScale, barrelScale);

      // Check for collision
      if (
        abs(barrel.position - carPos) < 5 && 
        relativeDistance < 0.2 
      ) {
        gameOver = true; 
      }
    }
  });
}



function spawnBarrel() {
  let barrel = {
    distance: distance + random(1, 5), 
    position: random(-0.2, 0.2) 
  };
  barrels.push(barrel);
}


function drawHill(g) {
  // Calculate the horizontal offset for the parallax effect
  let parallaxOffset = trackCurvature * 100; 
  
  // Repeat the background image to cover the screen
  for (let x = -backgroundImage.width - 700; x < g.width + backgroundImage.width; x += backgroundImage.width) {
    let imageX = x + parallaxOffset;

    
    g.image(backgroundImage, imageX, g.height / 3 - backgroundImage.height / 2);
  }
}

function drawTrack(g) {
  
  
  let roadWidth = 0.5;
  let clipWidth = 0.02;
  

  // Draw the track and animated ground
  for (let y = 0; y < g.height / 2; y++) {
    let perspective = y / (g.height / 2) + 0.25;
    let midPoint = 0.5 + curvature * pow(1 - perspective, 5);
    let laneWidth = perspective * 0.5;

    let leftGrass = (midPoint - laneWidth - clipWidth) * g.width;
    let leftRoad = (midPoint - laneWidth) * g.width;
    let rightRoad = (midPoint + laneWidth) * g.width;
    let rightGrass = (midPoint + laneWidth + clipWidth) * g.width;

    let row = g.height / 2 + y;

    // Calculate dynamic grass color
    let grassColor = sin(20.0 * pow(1.0 - perspective, 3) + distance * 0.1) > 0 ?
                     color(19, 62, 124) : color(10, 20, 124);

    // Calculate dynamic curb color
    let curbColor = sin(80.0 * pow(1.0 - perspective, 2) + distance) > 0 ?
                    color(252, 151, 183) : color(0, 0, 0);

    // Draw left side of the track
    g.fill(grassColor);
    g.rect(0, row, leftGrass, 1);     // Grass
    g.fill(curbColor);
    g.rect(leftGrass, row, leftRoad - leftGrass, 1);  // Curb
    g.fill(9, 24, 51);  // Road
    g.rect(leftRoad, row, rightRoad - leftRoad, 1);   // Road
    g.fill(curbColor);
    g.rect(rightRoad, row, rightGrass - rightRoad, 1); // Curb
    g.fill(grassColor);
    g.rect(rightGrass, row, g.width - rightGrass, 1);  // Grass
  }
}

function drawCar(g) {
  carPos = playerCurvature - trackCurvature;
  let carX = g.width / 2 + carPos * g.width / 2;

  g.noStroke();
  let carDirection = 0;

  // Handle input for car speed and direction
  if (keyIsDown(UP_ARROW)) speed += 0.7;
  else speed -= 0.02;

  g.fill(0, 0, 0); 
  g.rect(carX - 50, g.height - 60, 0.000001, 50); 

  if (keyIsDown(LEFT_ARROW) && keyIsDown(UP_ARROW)) {
    playerCurvature -= 0.05 * (1 - speed / 2);
    carDirection = -1;
    g.image(carImageLeft, carX - 45, g.height - 49); 
  } else if (keyIsDown(RIGHT_ARROW) && keyIsDown(UP_ARROW)) {
    playerCurvature += 0.05 * (1 - speed / 2);
    carDirection = 1;
    g.image(carImageRight, carX - 45, g.height - 48); 
  } else {
    g.image(carImage, carX - 45, g.height - 50); 
  }

  // Prevent the car from exceeding track curvature
  if (abs(playerCurvature - trackCurvature) >= 0.8) speed -= 1;
  speed = constrain(speed, 0, 1);

  // Move the car along the track
  distance += speed * 3;
  if (distance >= trackDistance) {
    distance -= trackDistance;
    lapTimes.unshift(currentLapTime);
    lapTimes.pop();
    currentLapTime = 0;
  }

  // Find the section of the track the car is on
  let offset = 0;
  let section = 0;
  while (section < track.length && offset <= distance) {
    offset += track[section][1];
    section++;
  }

  // Interpolate curvature for smooth transitions between track sections
  let targetCurvature = track[section - 1][0];
  let curveDiff = (targetCurvature - curvature) * speed * 0.05;
  curvature += curveDiff;
  trackCurvature += curvature * speed * 0.01;

  // Update lap time
  currentLapTime += deltaTime / 1000;
}

function drawStats(g) {
  g.fill(255);
  g.textSize(8);
  g.textAlign(LEFT);
  g.text(`Distance: ${distance.toFixed(2)}`, 5, 10);
  g.text(`Speed: ${speed.toFixed(2)}`, 5, 20);

  // Display lap times
  g.text(`Lap Time: ${currentLapTime.toFixed(2)}`, 5, 40);
  for (let i = 0; i < lapTimes.length; i++) {
    g.text(`Lap ${i + 1}: ${lapTimes[i].toFixed(2)}`, 5, 50 + i * 10);
      if ((lapTimes[4]) != 0) {
        gameOver = true;
      } 
  }

  
}

