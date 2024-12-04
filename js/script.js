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

let bodySegmentation; // Contains Body Segmentation model
let video; 
let segmentation; // Contains result from model
let screenshots = []; // Array of results
let screenshotTime = 0; // Holds start time
let intervalRate = 500; // Rate of screenshots
let segmentationActive = true; // Off or on value of model
let opacityLevel = 255; // Level of opacity
let maxScreenshots = 25; // Max number of screenshots before they start deleting 

// Dictates the model type for Body Segmentation
let options = {
    maskType: "background", 
};

let bgImage; // Stores the user-uploaded background image
let fileInput; // Contains file button 
let freePaintMode = false;


// Preloading the body segmentation model with the SelfieSegmentation model
function preload() {
    bodySegmentation = ml5.bodySegmentation("SelfieSegmentation", options);
}

// Setting up all the necessary things for our program
function setup() {
    let canvas = createCanvas(windowWidth * 0.65, windowHeight * 0.9); // Creating the canvas 
    canvas.parent("canvas-container"); // Creating parent canvas container to stylize

    video = createCapture(VIDEO); // Starting the video
    video.size(640, 480); // Keeps the video size fixed
    video.hide(); 

    bodySegmentation.detectStart(video, gotResults); // Starting the body segmentation model

    recognition.continuous = true; // Making the speech recognition continuously on 
    recognition.onResult = handleResult; // This calls for the voice recognizer to run the handleResult function when it has a result 
    recognition.start(); // Starts the voice recognition

    fileInput = createFileInput(handleFile); // Creating file input button
    fileInput.position(100, 350); // Setting position
    applyFileButtonStyles(fileInput); // Applying the style from the proper styling function

    // These all contain the elements necessary for the opacity and interval slider 
    const opacitySlider = document.getElementById("opacity-slider");
    const opacityValue = document.getElementById("opacity-value");
    const intervalSlider = document.getElementById("interval-slider");
    const intervalValue = document.getElementById("interval-value");

    // This updates the opacity level from slider
    opacitySlider.addEventListener("input", () => {
        opacityLevel = parseInt(opacitySlider.value, 10);
        opacityValue.textContent = opacityLevel;
    });

    // Same thing but for interval rate from slider
    intervalSlider.addEventListener("input", () => {
        intervalRate = parseInt(intervalSlider.value, 10);
        intervalValue.textContent = intervalRate;
    });

    // Ths contains the Add Layer button
    let addLayerButton = createButton('Add Layer');
    addLayerButton.position(100, 600); 
    addLayerButton.mousePressed(saveCurrentCanvasAsBackground);
    applyButtonStyles(addLayerButton);

    // Contains the Free Paint button
    let freePaintButton = createButton('Free Paint');
    freePaintButton.position(100, 650); 
    freePaintButton.mousePressed(activateFreePaintMode);
    applyButtonStyles(freePaintButton);
}


// This is the function that continuously goes
function draw() {
    // Resets to fresh background when free paint is not on
    if (!freePaintMode)
        background(255); 

    if (freePaintMode)
        bgImage = get(); 

    // If a background image is loaded, display it without applying tint
    if (bgImage) {
        noTint(); // Stops image from being transparent
        image(bgImage, 0, 0, width, height); // Stretch image to fit  canvas
    }

    let currentTime = millis(); //Sets current time to check with other functions

    // This for loop displays the array of screenshots onto the canvas using its image properties
    for (let screenshot of screenshots) {
        tint(255, screenshot.opacity); // Applies opacity change to the elements in the array
        image(screenshot.image, 0, 0, width, height); // Displays image on canvas
        screenshot.opacity = opacityLevel; // Sets the opacity level 

        // Makes any screenshot older than 10 seconds invisible to keep a consistent look and feel
        if (currentTime - screenshot.timestamp > 10000 && segmentationActive) {
            screenshot.opacity = 0; 
        }
    }
    
    
    // Video is only on when segmentation is on
    if (segmentationActive && segmentation) {
        video.mask(segmentation.mask);
        tint(255); 
        image(video, 0, 0, width, height); // Stretch the video to fit onto the canvas
    }
    
    // This is the rate at which screenshots are taken (i.e interval rate)
    if (millis() - screenshotTime > intervalRate) {
        takeScreenshot(); // Calls function to take screenshot
        screenshotTime = millis();
    }    
    
}


// Allows the window to be resized
// Does not work very well
function windowResized() {
    resizeCanvas(windowWidth * 0.7, windowHeight * 0.8); // Keep 70% width and 80% height on resize
}


// The key function of the time-based art
// Allows for images to be created and placed on the background for main effect of program
function takeScreenshot() {
    // Ensures that program is on and results are coming in to work
    if (segmentationActive && segmentation) {
        let screenshot = createGraphics(width, height); // Creates p5 graphic object of current canvas state
        screenshot.image(video, 0, 0, width, height); 
        screenshots.push({
            image: screenshot, 
            opacity: 255, // Gives opacity value so it can be manipulated later
            timestamp: millis() // Checks how old the screenshots are
        });
    }

    // When the max length of the array is reached, it starts deleting itself to aid the memory leak
    if (screenshots.length > maxScreenshots && segmentationActive) {
        let oldScreenshots = screenshots.shift(); // Removes the oldest snapshot
        oldScreenshots.image.remove(); // Removes it from the array
    }
}


// Sets the body segmentation result into the segmentation variable
function gotResults(result) {
    segmentation = result;
}


// This function allows for all the key command functions in our program
function keyPressed() {

    // Change opacity with up and down arrows
    if (keyCode === UP_ARROW) {
        opacityLevel = min(opacityLevel + 10, 255); // Setting max level to 255
        console.log("Opacity Level:", opacityLevel);
    }
    
    if (keyCode === DOWN_ARROW) {
        opacityLevel = max(opacityLevel - 10, 0); // Setting min level to 0
        console.log("Opacity Level:", opacityLevel);
    }
    
    // Change interval rate with left and right arrows
    if (keyCode === LEFT_ARROW) {
        intervalRate = max(intervalRate - 50, 400); // Setting min rate to 400
        console.log("Interval Rate:", intervalRate);
    }

    if (keyCode === RIGHT_ARROW) {
        intervalRate = min(intervalRate + 50, 2000); // Setting max rate to 2000
        console.log("Interval Rate:", intervalRate);
    }

    // Allows to toggle program on and off using the space bar
    if (key === ' ') {
        segmentationActive = !segmentationActive; 
    }
    
    // Clears the array/canvas when c key is pressed
    if (key === 'c' || key === 'C') {
        screenshots = []; 
        console.log("Screenshots Cleared");
    }
}


// This function handles all the results from the speech recognition model and returns a lower case string result
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


// This function is for the voice command to stop the segmentation model
function offResponse() {
    segmentationActive = false; 
}


// This function is for the voice command to clear the canvas
function clearResponse() {
    screenshots = [];
}


// This function is for the voice command to start the segmentation model
function startResponse() {
    segmentationActive = true; 
}


// This function handles the input file by the user
function handleFile(file) {
    if (file.type === 'image') {
        bgImage = loadImage(file.data); // Loads the user-selected image file
    } else {
        console.log("Not an image file!"); // Debug to check if it worked
    }
}


// Does exactly what the function says
function saveCurrentCanvasAsBackground() {
    bgImage = get();
}


// Turns free paint mode on and off when button is clicked
function activateFreePaintMode()
{
    freePaintMode = !freePaintMode;
}


// This function holds all the styling for the free paint and add layer button 
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


// This function holds all the button styling used for the file selection button
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