class Particle {
    constructor(x, y, fill) {
        this.x = x; //Contains x position of particle
        this.y = y; //Contains y position of particle 
        this.targetX = x; //Contains x position of particle displacement 
        this.targetY = y; //Contains y position of particle displacement 
        this.fill = fill; //Contains fill of the particle
        this.size = 10; //Contains size of the particle
        this.maxForce = 5; //Max distance of displacement
        this.minForce = 0; //Min distance of displacement
    }

    //This function updates the position of the particles depending on the placement of the mouse
    update() {
        let mouseVector = createVector(mouseX, mouseY); //Creates vector from users mouse
        let particleVector = createVector(this.x, this.y); //Creates vector from particles position 
        let targetVector = createVector(this.targetX, this.targetY); //Creates displacement position of particles
        let mouseToParticle = p5.Vector.sub(particleVector, mouseVector); //Subtracts the vector positions (mouse to particle)
        let mouseDistance = mouseToParticle.mag(); //Calculates the magnitude of the vectors (mouse to particle)
        let particleToTarget = p5.Vector.sub(targetVector, particleVector); //Subtracts the vector positions (particle to target)
        let targetDistance = particleToTarget.mag(); //Calculates the magnitude of the vectors (particle to target)
        let sumForce = createVector(0, 0); //Creates a null vector to let total addition of vectors
        
        //If the mouse distance is smaller than 80, it displaces particle 
        if(mouseDistance < 80) {
            let pushForce = map(mouseDistance, 0, 100, this.maxForce, this.minForce); //Assigns the push force and maps its strength to the min and max
            mouseToParticle.setMag(pushForce); //Sets magnitude of vectors to the mapped push force
            sumForce.add(mouseToParticle); //Adds mouse to particle vector to the sum force vector 
        }

        if(mouseDistance > 0) {
            let pullForce = map(targetDistance, 0, 100, this.minForce, this.maxForce); //Assigns the pull force and maps its strength to the min and max
            particleToTarget.setMag(pullForce); //Sets magnitude of vectors to the mapped pull force
            sumForce.add(particleToTarget); //Adds particle to target vector to the sum force vector 
        }

        this.x += sumForce.x //Starts the motion in the x position of the particles
        this.y += sumForce.y //Starts the motion in the y position of the particles

    }

    //Displays the particles using an ellipse 
    display() {
        fill(this.fill); //Allows the fill to change 
        noStroke();
        ellipse(this.x, this.y, this.size);
    }
}