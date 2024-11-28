// Constants that will remain the same
const recognition = new p5.SpeechRec(); // Contains the speech recognizer 

// This constant contains a variety of commands that will initialize a function called a callback
const commands = [
    {
        "command": ["stop", "off"],
        "callback": offResponse
    },
    {
        "command": ["clear", "reset"],
        "callback": clearResponse
    },
    {
        "command": ["start", "go"],
        "callback": startResponse
    }
];

let bodySegmentation;
let video;
let segmentation;
let screenshots = []; 
let screenshotTime = 0; 
let intervalRate = 500; 
let segmentationActive = true; 
let opacityLevel = 255;
let maxScreenshots = 25; 

let options = {
    maskType: "background", 
};

let bgImage; // Variable to store the user-uploaded background image
let fileInput;

function preload() {
    bodySegmentation = ml5.bodySegmentation("SelfieSegmentation", options);
}

function setup() {
    // Create canvas and place it inside the container
    let canvas = createCanvas(windowWidth * 0.65, windowHeight * 0.9);
    canvas.parent("canvas-container");

    video = createCapture(VIDEO);
    video.size(640, 480); // Keep video size fixed
    video.hide();

    bodySegmentation.detectStart(video, gotResults);

    // recognition.continuous = true; 
    // recognition.onResult = handleResult; // This calls for the voice recognizer to run the handleResult function when it has a result 
    // recognition.start(); // Starts the voice recognition

    fileInput = createFileInput(handleFile);
    fileInput.position(100, 350);
    applyFileButtonStyles(fileInput);

    const opacitySlider = document.getElementById("opacity-slider");
    const opacityValue = document.getElementById("opacity-value");
    const intervalSlider = document.getElementById("interval-slider");
    const intervalValue = document.getElementById("interval-value");

    // Update opacity level from slider
    opacitySlider.addEventListener("input", () => {
        opacityLevel = parseInt(opacitySlider.value, 10);
        opacityValue.textContent = opacityLevel;
    });

    // Update interval rate from slider
    intervalSlider.addEventListener("input", () => {
        intervalRate = parseInt(intervalSlider.value, 10);
        intervalValue.textContent = intervalRate;
    });

    // Create the 'Add Layer' button
    let addLayerButton = createButton('Add Layer');
    addLayerButton.position(100, 600); // Adjust the position as needed
    addLayerButton.mousePressed(saveCurrentCanvasAsBackground);
    applyButtonStyles(addLayerButton);

    // Create the 'Free Paint' button
    let freePaintButton = createButton('Free Paint');
    freePaintButton.position(100, 650); // Adjust the position as needed
    freePaintButton.mousePressed(activateFreePaintMode);
    applyButtonStyles(freePaintButton);
}

let freePaintMode = false;
function draw() {
    if (!freePaintMode)
        background(255); // Default white background

    if (freePaintMode)
        bgImage = get(); 

    // If a background image is loaded, display it without applying tint
    if (bgImage) {
        noTint(); // Reset tint to default (no transparency effect)
        image(bgImage, 0, 0, width, height); // Stretch background to fit the canvas
    }

    let currentTime = millis();

    // Display existing screenshots with opacity fading over time
    for (let screenshot of screenshots) {
        tint(255, screenshot.opacity); // Apply opacity to screenshots only
        image(screenshot.image, 0, 0, width, height); 
        screenshot.opacity = opacityLevel;

        if (currentTime - screenshot.timestamp > 10000 && segmentationActive) {
            screenshot.opacity = 0; 
        }
    }
    
    screenshots = screenshots.filter(screenshot => screenshot.opacity > 0);
    
    // Only show video if segmentation is active
    if (segmentationActive && segmentation) {
        video.mask(segmentation.mask);
        tint(255); // Reset tint to default for the video layer
        image(video, 0, 0, width, height); // Stretch video to canvas size
    }
    
    if (millis() - screenshotTime > intervalRate) {
        takeSnapshot();
        screenshotTime = millis();
    }    
    
    // displayMessages();
}

function windowResized() {
    // Adjust only the canvas size, leave video unchanged
    resizeCanvas(windowWidth * 0.7, windowHeight * 0.8); // Keep 70% width and 80% height on resize
}

function takeSnapshot() {
    if (segmentationActive && segmentation) {
        let screenshot = createGraphics(width, height);
        screenshot.image(video, 0, 0, width, height); 
        screenshots.push({
            image: screenshot,
            opacity: 255,
            timestamp: millis() 
        });
    }

    if (screenshots.length > maxScreenshots && segmentationActive) {
        let oldScreenshots = screenshots.shift(); // Remove the oldest snapshot
        oldScreenshots.image.remove();
    }
}

function gotResults(result) {
    segmentation = result;
}

function displayMessages() {
    fill(255); // Sets text color to black
    textAlign(LEFT, TOP); // Aligns the text to the top-left corner
    textSize(20); // Adjust font size for better readability
    textFont('Doto');

    stroke(0, 0, 0, 255); // Set border color to black (you can change the color here)
    strokeWeight(1); // Set the border thickness (you can adjust this value)
    text("Opacity: " + opacityLevel, 10, 5); // Display opacity in the top-left corner
    text("Interval Rate: " + intervalRate, 10, 25); // Display interval rate slightly below
}

function keyPressed() {
    // Increase opacity change rate with Up arrow
    if (keyCode === UP_ARROW) {
        opacityLevel = min(opacityLevel + 10, 255); 
        console.log("Opacity Level:", opacityLevel);
    }
    
    if (keyCode === DOWN_ARROW) {
        opacityLevel = max(opacityLevel - 10, 0); 
        console.log("Opacity Level:", opacityLevel);
    }
    
    if (keyCode === LEFT_ARROW) {
        intervalRate = max(intervalRate - 50, 400);
        console.log("Interval Rate:", intervalRate);
    }

    if (keyCode === RIGHT_ARROW) {
        intervalRate = min(intervalRate + 50, 2000);
        console.log("Interval Rate:", intervalRate);
    }

    if (key === ' ') {
        segmentationActive = !segmentationActive; 
    }
    
    if (key === 'c' || key === 'C') {
        screenshots = []; 
        console.log("Screenshots Cleared");
    }
}

function handleResult() {
    let spoke = recognition.resultString.toLowerCase(); // This variable contains the lower-case string of the recognized speech
    
    // This for loop checks if any command is spoken and then assigns the proper callback function
    for (let command of commands) {
        for (let i = 0; i < command.command.length; i++) {
            if (spoke === command.command[i]) {
                command.callback();
                return; // This stops the loop from continuing if a recognized command is picked up
            }
        }
    }
    console.log(spoke);
}

function offResponse() {
    segmentationActive = false; 
}

function clearResponse() {
    screenshots = [];
}

function startResponse() {
    segmentationActive = true; 
}

function handleFile(file) {
    if (file.type === 'image') {
        bgImage = loadImage(file.data); // Load the user-selected image
    } else {
        console.log("Not an image file!");
    }
}

function saveCurrentCanvasAsBackground() {
    bgImage = get(); // Capture current canvas content as an image
}

function activateFreePaintMode()
{
    freePaintMode = !freePaintMode;
}

function applyButtonStyles(button) {

    button.style('align-items', 'center');
    button.style('appearance', 'button');
    button.style('background-color', '#0276FF');
    button.style('border-radius', '8px');
    button.style('border-style', 'none');
    button.style('box-shadow', 'rgba(255, 255, 255, 0.26) 0 1px 2px inset');
    button.style('box-sizing', 'border-box');
    button.style('color', '#fff');
    button.style('cursor', 'pointer');
    button.style('display', 'flex');
    button.style('flex-direction', 'row');
    button.style('flex-shrink', '0');
    button.style('font-family', '"RM Neue", sans-serif');
    button.style('font-size', '100%');
    button.style('line-height', '1.15');
    button.style('margin', '0');
    button.style('padding', '10px 21px');
    button.style('text-align', 'center');
    button.style('text-transform', 'none');
    button.style('transition', 'color .13s ease-in-out, background .13s ease-in-out, opacity .13s ease-in-out, box-shadow .13s ease-in-out');
}

function applyFileButtonStyles(button) {
    
    button.style('align-items', 'center');
    button.style('appearance', 'button');
    button.style('background-color', '#0276FF');
    button.style('border-radius', '8px');
    button.style('border-style', 'none');
    button.style('box-shadow', 'rgba(255, 255, 255, 0.26) 0 1px 2px inset');
    button.style('box-sizing', 'border-box');
    button.style('color', '#fff');
    button.style('cursor', 'pointer');
    button.style('display', 'flex');
    button.style('flex-direction', 'row');
    button.style('flex-shrink', '0');
    button.style('font-family', '"RM Neue", sans-serif');
    button.style('font-size', '100%');
    button.style('line-height', '1.15');
    button.style('margin', '0');
    button.style('padding', '10px 5px');
    button.style('text-align', 'center');
    button.style('text-transform', 'none');
    button.style('transition', 'color .13s ease-in-out, background .13s ease-in-out, opacity .13s ease-in-out, box-shadow .13s ease-in-out');
}