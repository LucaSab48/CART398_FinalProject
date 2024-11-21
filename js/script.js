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

let options = {
    maskType: "background", 
};

function preload() {
    bodySegmentation = ml5.bodySegmentation("SelfieSegmentation", options);
}

function setup() {
    createCanvas(1280, 960); 
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();

    bodySegmentation.detectStart(video, gotResults);

    recognition.continuous = true; 
    recognition.onResult = handleResult; // This calls for the voice recognizer to run the handleResult function when it has a result 
    recognition.start(); // Starts the voice recognition
}

function draw() {
    background(255);

    let currentTime = millis();

    
    for (let screenshot of screenshots) {
        tint(255, screenshot.opacity); 
        image(screenshot.image, 0, 0, width, height); 
        screenshot.opacity = opacityLevel;

        if (currentTime - screenshot.timestamp > 10000) {
            screenshot.opacity = 0; 
        }
    }
    
    screenshots = screenshots.filter(screenshot => screenshot.opacity > 0);
    
    if (segmentationActive && segmentation) {
        video.mask(segmentation.mask);
        image(video, 0, 0, width, height); 
    }
    
    if (millis() - screenshotTime > intervalRate) {
        takeSnapshot();
        screenshotTime = millis();
    }
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
}


function gotResults(result) {
    segmentation = result;
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

// Function that is assigned to the command callback 
function clearResponse() {
    screenshots = [];
}

// Function also assigned to the command callback
function startResponse() {
    segmentationActive = true; 
}