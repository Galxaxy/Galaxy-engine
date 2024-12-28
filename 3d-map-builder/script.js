// Get the canvas element
const canvas = document.getElementById('scene-container');
const gl = canvas.getContext('webgl');

// Check if WebGL is supported
if (!gl) {
    alert("WebGL is not supported in your browser.");
}

// Resize canvas to fit the screen
canvas.width = window.innerWidth;
canvas.height = 500;

// Vertex shader (for drawing shapes)
const vertexShaderSource = `
    attribute vec3 position;
    uniform mat4 projectionMatrix;
    uniform mat4 modelViewMatrix;
    void main() {
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;

// Fragment shader (defines color of shapes)
const fragmentShaderSource = `
    precision mediump float;
    void main() {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 1.0); // Green color
    }
`;

// Compile shader programs
function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("ERROR compiling shader:", gl.getShaderInfoLog(shader));
        return null;
    }
    return shader;
}

const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

// Create shader program
const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error("ERROR linking program:", gl.getProgramInfoLog(shaderProgram));
}

// Use the shader program
gl.useProgram(shaderProgram);

// Define geometry (a simple cube)
const vertices = [
    -0.5, -0.5, -0.5, // Front bottom-left
     0.5, -0.5, -0.5, // Front bottom-right
     0.5,  0.5, -0.5, // Front top-right
    -0.5,  0.5, -0.5, // Front top-left
    -0.5, -0.5,  0.5, // Back bottom-left
     0.5, -0.5,  0.5, // Back bottom-right
     0.5,  0.5,  0.5, // Back top-right
    -0.5,  0.5,  0.5  // Back top-left
];

// Define indices to create cube faces
const indices = [
    0, 1, 2, 0, 2, 3, // Front face
    4, 5, 6, 4, 6, 7, // Back face
    0, 1, 5, 0, 5, 4, // Bottom face
    2, 3, 7, 2, 7, 6, // Top face
    1, 2, 6, 1, 6, 5, // Right face
    3, 0, 4, 3, 4, 7  // Left face
];

// Create buffer for vertices
const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

// Create buffer for indices
const indexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

// Link the vertex data to the shader program
const positionLocation = gl.getAttribLocation(shaderProgram, "position");
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(positionLocation);

// Setup projection matrix (perspective)
const projectionMatrix = mat4.create();
mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100.0);

// Setup model-view matrix (camera)
const modelViewMatrix = mat4.create();
mat4.lookAt(modelViewMatrix, [0, 0, 5], [0, 0, 0], [0, 1, 0]);

// Send matrices to shader program
const projectionLocation = gl.getUniformLocation(shaderProgram, "projectionMatrix");
const modelViewLocation = gl.getUniformLocation(shaderProgram, "modelViewMatrix");
gl.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
gl.uniformMatrix4fv(modelViewLocation, false, modelViewMatrix);

// Draw the cube
gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set background color to black
gl.clear(gl.COLOR_BUFFER_BIT); // Clear the canvas
gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0); // Render cube

// Camera and scene setup
let camera = {
    x: 0,
    y: 0,
    z: 5,
    rotationX: 0, // Rotate around X-axis (pitch)
    rotationY: 0, // Rotate around Y-axis (yaw)
    rotationZ: 0  // Rotate around Z-axis (roll)
};

// Update camera position based on user input (for example)
function updateCamera() {
    // Move the camera
    camera.x += 0.1;  // Example: move camera along the X-axis
    camera.y += 0.1;  // Example: move camera along the Y-axis
    // Update rotation if necessary
    camera.rotationX += 0.05;
    camera.rotationY += 0.05;
}

// Basic render loop
function render() {
    updateCamera(); // Update the camera position and rotation

    // Now your rendering logic can adjust for the camera's position and rotation
    gl.clear(gl.COLOR_BUFFER_BIT); // Clear previous frame

    // Send updated model-view matrix to shader program
    mat4.lookAt(modelViewMatrix, [camera.x, camera.y, camera.z], [0, 0, 0], [0, 1, 0]);
    gl.uniformMatrix4fv(modelViewLocation, false, modelViewMatrix);

    // Draw the cube
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    requestAnimationFrame(render); // Request next frame
}

// Start rendering
render();
// Load and apply texture
function loadTexture(texturePath) {
    const img = new Image();
    img.src = texturePath;
    img.onload = () => {
        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
}
// Fragment shader with texture application
const fragmentShaderSource = `
    precision mediump float;
    uniform sampler2D u_texture;
    varying vec2 v_texCoord;

    void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
    }
`;

// Add texture coordinates to the geometry (for each vertex)
const vertices = [
    -0.5, -0.5, -0.5, 0.0, 0.0, // Front bottom-left
     0.5, -0.5, -0.5, 1.0, 0.0, // Front bottom-right
     0.5,  0.5, -0.5, 1.0, 1.0, // Front top-right
    -0.5,  0.5, -0.5, 0.0, 1.0, // Front top-left
    -0.5, -0.5,  0.5, 0.0, 0.0, // Back bottom-left
     0.5, -0.5,  0.5, 1.0, 0.0, // Back bottom-right
     0.5,  0.5,  0.5, 1.0, 1.0, // Back top-right
    -0.5,  0.5,  0.5, 0.0, 1.0  // Back top-left
];
// Add an event listener for adding blocks to the scene
document.getElementById('add-block').onclick = () => {
    let newBlock = {
        x: Math.random() * 2 - 1, // Random position between -1 and 1
        y: Math.random() * 2 - 1,
        z: Math.random() * 2 - 1,
        size: 0.1  // Cube size
    };
    objects.push(newBlock); // Add new block to the scene
};

// Draw all blocks in the scene
function drawScene() {
    objects.forEach(block => {
        drawCube(block.x, block.y, block.z, block.size);
    });
}

// Call `drawScene` inside the `render` function
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT); // Clear previous frame

    // Update and draw all objects in the scene
    drawScene();

    requestAnimationFrame(render);
}
// Export scene data as JSON
document.getElementById('export').onclick = () => {
    const mapData = objects.map(object => ({
        x: object.x,
        y: object.y,
        z: object.z,
        size: object.size
    }));

    // Create a JSON file from the map data
    const blob = new Blob([JSON.stringify(mapData)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scene_data.json';
    link.click();
};
// Camera properties
let camera = {
    x: 0,
    y: 0,
    z: 5,
    rotationX: 0,  // Rotation around X-axis (pitch)
    rotationY: 0,  // Rotation around Y-axis (yaw)
    rotationZ: 0   // Rotation around Z-axis (roll)
};

// Update camera position based on user input
function updateCamera() {
    // Camera movement with arrow keys
    if (keysPressed['ArrowUp']) {
        camera.z -= 0.1;
    }
    if (keysPressed['ArrowDown']) {
        camera.z += 0.1;
    }
    if (keysPressed['ArrowLeft']) {
        camera.x -= 0.1;
    }
    if (keysPressed['ArrowRight']) {
        camera.x += 0.1;
    }

    // Camera rotation with WASD keys
    if (keysPressed['w']) {
        camera.rotationX += 0.05;
    }
    if (keysPressed['s']) {
        camera.rotationX -= 0.05;
    }
    if (keysPressed['a']) {
        camera.rotationY += 0.05;
    }
    if (keysPressed['d']) {
        camera.rotationY -= 0.05;
    }
}

// Handle keydown and keyup events to track keys
let keysPressed = {};

document.addEventListener('keydown', (event) => {
    keysPressed[event.key] = true;
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key] = false;
});

// Update camera in render loop
function render() {
    updateCamera();  // Update camera position based on input

    gl.clear(gl.COLOR_BUFFER_BIT);  // Clear previous frame

    // Draw objects, applying camera adjustments
    drawScene();

    requestAnimationFrame(render);  // Keep rendering the scene
}
// Function to export the map as JSON
document.getElementById('export').onclick = () => {
    // Get the map data (objects, positions, sizes, etc.)
    const mapData = objects.map(object => ({
        x: object.x,
        y: object.y,
        z: object.z,
        size: object.size,
        rotationX: object.rotationX || 0,
        rotationY: object.rotationY || 0,
        rotationZ: object.rotationZ || 0,
        texture: object.texture || null  // Export texture path (if any)
    }));

    // Create a Blob from the map data and prompt download
    const blob = new Blob([JSON.stringify(mapData)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scene.json';
    link.click();
};
// Function to check if two objects are colliding (simple AABB collision)
function checkCollision(obj1, obj2) {
    return !(obj1.x + obj1.size < obj2.x || 
             obj1.x > obj2.x + obj2.size || 
             obj1.y + obj1.size < obj2.y || 
             obj1.y > obj2.y + obj2.size || 
             obj1.z + obj1.size < obj2.z || 
             obj1.z > obj2.z + obj2.size);
}
function render() {
    updateCamera();  // Update camera position based on user input

    gl.clear(gl.COLOR_BUFFER_BIT);  // Clear previous frame

    // Check for collisions between objects
    objects.forEach((object, i) => {
        for (let j = i + 1; j < objects.length; j++) {
            const otherObject = objects[j];
            if (checkCollision(object, otherObject)) {
                console.log(`Collision detected between object ${i} and object ${j}`);
            }
        }
    });

    // Draw all objects
    objects.forEach(object => {
        if (object.vertices && object.indices) {
            drawModel(object);  // If it's a model, draw it
        } else {
            drawCube(object.x, object.y, object.z, object.size);  // Draw cubes if not a model
        }
    });

    requestAnimationFrame(render);  // Keep rendering the scene
}
// Function to scale an object (change its size)
function scaleObject(object, scaleFactor) {
    object.size *= scaleFactor;  // Adjust the size
}

// Function to rotate an object
function rotateObject(object, deltaRotationX, deltaRotationY, deltaRotationZ) {
    object.rotationX += deltaRotationX;
    object.rotationY += deltaRotationY;
    object.rotationZ += deltaRotationZ;
}
// Apply transformations to objects
function applyTransformations() {
    objects.forEach(object => {
        if (object.size !== undefined) {
            scaleObject(object, 1.01);  // Slightly increase the size every frame
        }
        if (object.rotationX !== undefined && object.rotationY !== undefined) {
            rotateObject(object, 0.01, 0.01, 0);  // Rotate the object slowly
        }
    });
}

// Update the render loop
function render() {
    updateCamera();  // Update camera position based on user input

    gl.clear(gl.COLOR_BUFFER_BIT);  // Clear previous frame

    applyTransformations();  // Apply transformations before drawing

    // Draw all objects
    objects.forEach(object => {
        if (object.vertices && object.indices) {
            drawModel(object);  // If it's a model, draw it
        } else {
            drawCube(object.x, object.y, object.z, object.size);  // Draw cubes if not a model
        }
    });

    requestAnimationFrame(render);  // Keep rendering the scene
}
function loadTexture(texturePath) {
    const texture = gl.createTexture();
    const image = new Image();
    image.onload = function() {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    image.src = texturePath;
    return texture;
}
function drawModel(model) {
    // Apply texture if it exists
    if (model.texture) {
        gl.bindTexture(gl.TEXTURE_2D, model.texture);
    }

    // Link the vertex data to the shader program
    const positionLocation = gl.getAttribLocation(shaderProgram, "position");
    gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
    gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // Draw the model using the index buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
    gl.drawElements(gl.TRIANGLES, model.indices.length, gl.UNSIGNED_SHORT, 0);
}
let isDragging = false;
let selectedObject = null;
let offsetX = 0, offsetY = 0, offsetZ = 0;

canvas.addEventListener('mousedown', function(event) {
    // Convert mouse position to world coordinates
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    // Check for collisions with objects (simplified here)
    objects.forEach(object => {
        if (mouseIsOverObject(mouseX, mouseY, object)) {
            selectedObject = object;
            offsetX = mouseX - object.x;
            offsetY = mouseY - object.y;
            isDragging = true;
        }
    });
});
canvas.addEventListener('mousemove', function(event) {
    if (isDragging && selectedObject) {
        selectedObject.x = event.clientX - offsetX;
        selectedObject.y = event.clientY - offsetY;
        render();  // Redraw the scene
    }
});
canvas.addEventListener('mouseup', function() {
    isDragging = false;
    selectedObject = null;
});
canvas.addEventListener('wheel', function(event) {
    if (selectedObject) {
        const scaleChange = event.deltaY > 0 ? 1.1 : 0.9;  // Zoom in or out
        scaleObject(selectedObject, scaleChange);
        render();  // Redraw the scene
    }
});
let prevMouseY = 0;

canvas.addEventListener('mousemove', function(event) {
    if (isDragging && selectedObject) {
        const deltaX = event.clientX - prevMouseX;
        rotateObject(selectedObject, 0, deltaX * 0.01, 0);  // Rotate around Y-axis
        prevMouseX = event.clientX;
        render();  // Redraw the scene
    }
});
let prevMouseX= 0;
function mouseIsOverObject(mouseX, mouseY, object) {
    const objectScreenX = object.x - camera.x;
    const objectScreenY = object.y - camera.y;
    
    // Simple check to see if mouse is over object (adjust for scaling)
    return mouseX >= objectScreenX - object.size / 2 &&
           mouseX <= objectScreenX + object.size / 2 &&
           mouseY >= objectScreenY - object.size / 2 &&
           mouseY <= objectScreenY + object.size / 2;
}
function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);  // Clear the canvas for the new frame

    // Apply transformations and interact with objects (e.g., scaling, rotation)
    objects.forEach(object => {
        if (object.size !== undefined) {
            // Apply any changes such as scaling, rotation, or movement
            drawObject(object);  // Draw updated object
        }
    });

    requestAnimationFrame(render);  // Continuously update the scene
}
// Add export functionality
document.getElementById('export').onclick = function() {
    // Map data (objects with their positions, sizes, and rotations)
    const mapData = objects.map(object => ({
        x: object.x,
        y: object.y,
        z: object.z,
        size: object.size,
        rotationX: object.rotationX,
        rotationY: object.rotationY,
        rotationZ: object.rotationZ
    }));

    // Convert map data to JSON
    const jsonMapData = JSON.stringify(mapData, null, 2); // Indented for readability

    // Create a blob of the JSON data
    const blob = new Blob([jsonMapData], { type: 'application/json' });

    // Create a download link and trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'map_data.json';  // The name of the exported file
    link.click();
};
// Add import functionality
document.getElementById('import').onclick = function() {
    // Create a file input element dynamically
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';  // Only allow JSON files

    // Trigger file input when the user clicks the import button
    fileInput.click();

    // Handle file selection
    fileInput.onchange = function(event) {
        const file = event.target.files[0];

        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                // Parse the JSON file contents
                const importedMapData = JSON.parse(e.target.result);

                // Reconstruct the objects in the scene
                objects = importedMapData.map(data => ({
                    x: data.x,
                    y: data.y,
                    z: data.z,
                    size: data.size,
                    rotationX: data.rotationX || 0,
                    rotationY: data.rotationY || 0,
                    rotationZ: data.rotationZ || 0
                }));

                // Re-render the scene
                render();
            };
            reader.readAsText(file);  // Read the file as text
        }
    };
};
// Define an ambient light (simple white light)
const ambientLight = {
    r: 1.0,  // Red component
    g: 1.0,  // Green component
    b: 1.0,  // Blue component
    intensity: 0.5  // Light intensity
};

// Modify the fragment shader to include ambient light
const fragmentShaderSourcev = `
    precision mediump float;
    uniform vec3 ambientLight;
    void main() {
        gl_FragColor = vec4(ambientLight, 1.0);  // Apply ambient light color
    }
`;

// Send the light color to the fragment shader
const ambientLightLocation = gl.getUniformLocation(shaderProgram, "ambientLight");
gl.uniform3fv(ambientLightLocation, [ambientLight.r * ambientLight.intensity, ambientLight.g * ambientLight.intensity, ambientLight.b * ambientLight.intensity]);
// Define the directional light source
const directionalLight = {
    direction: [1.0, -1.0, -1.0], // Light coming from the top-left
    color: [1.0, 1.0, 1.0],       // White light
    intensity: 0.7                // Intensity of the light
};

// Modify fragment shader to account for directional light
const fragmentShaderSource = `
    precision mediump float;
    uniform vec3 ambientLight;
    uniform vec3 directionalLightColor;
    uniform vec3 directionalLightDirection;
    
    void main() {
        float diffuse = max(dot(normalize(vec3(0.0, 0.0, 1.0)), normalize(directionalLightDirection)), 0.0);
        gl_FragColor = vec4(ambientLight * 0.5 + directionalLightColor * diffuse * 0.7, 1.0);
    }
`;// Get the locations of the directional light uniforms
const directionalLightColorLocation = gl.getUniformLocation(shaderProgram, "directionalLightColor");
const directionalLightDirectionLocation = gl.getUniformLocation(shaderProgram, "directionalLightDirection");

// Send the directional light data to the shader
gl.uniform3fv(directionalLightColorLocation, directionalLight.color);
gl.uniform3fv(directionalLightDirectionLocation, directionalLight.direction);
// Add point light to the shader
const fragmentShaderSource = `
    precision mediump float;
    uniform vec3 ambientLight;
    uniform vec3 directionalLightColor;
    uniform vec3 directionalLightDirection;
    uniform vec3 pointLightColor;
    uniform vec3 pointLightPosition;

    void main() {
        // Directional lighting
        float diffuse = max(dot(normalize(vec3(0.0, 0.0, 1.0)), normalize(directionalLightDirection)), 0.0);

        // Point light attenuation (1 / distance^2)
        vec3 toLight = pointLightPosition - gl_FragCoord.xyz;
        float distance = length(toLight);
        float attenuation = 1.0 / (distance * distance);  // Inverse square law

        // Combine ambient, directional, and point light effects
        gl_FragColor = vec4(
            ambientLight * 0.5 + 
            directionalLightColor * diffuse * 0.7 + 
            pointLightColor * attenuation, 1.0);
    }
`;
// Define point light properties
const pointLight = {
    color: [1.0, 1.0, 1.0],  // White light
    position: [1.0, 1.0, 1.0] // Position of the point light
};

// Get the locations of the point light uniforms
const pointLightColorLocation = gl.getUniformLocation(shaderProgram, "pointLightColor");
const pointLightPositionLocation = gl.getUniformLocation(shaderProgram, "pointLightPosition");

// Send point light data to the shader
gl.uniform3fv(pointLightColorLocation, pointLight.color);
gl.uniform3fv(pointLightPositionLocation, pointLight.position);
// Spotlight shader modifications
const fragmentShaderSource = `
    precision mediump float;
    uniform vec3 ambientLight;
    uniform vec3 directionalLightColor;
    uniform vec3 directionalLightDirection;
    uniform vec3 pointLightColor;
    uniform vec3 pointLightPosition;
    uniform vec3 spotlightColor;
    uniform vec3 spotlightPosition;
    uniform vec3 spotlightDirection;
    uniform float spotlightAngle;

    void main() {
        // Directional lighting
        float diffuse = max(dot(normalize(vec3(0.0, 0.0, 1.0)), normalize(directionalLightDirection)), 0.0);

        // Point light attenuation
        vec3 toLight = pointLightPosition - gl_FragCoord.xyz;
        float distance = length(toLight);
        float attenuation = 1.0 / (distance * distance);

        // Spotlight effect (dot product of light direction and fragment normal)
        vec3 toSpotlight = spotlightPosition - gl_FragCoord.xyz;
        float spotlightIntensity = max(dot(normalize(spotlightDirection), normalize(toSpotlight)), 0.0);
        if (spotlightIntensity > cos(spotlightAngle)) {
            spotlightIntensity = pow(spotlightIntensity, 3.0); // Sharpness of the spotlight
        } else {
            spotlightIntensity = 0.0;
        }

        // Combine all light sources
        gl_FragColor = vec4(
            ambientLight * 0.5 + 
            directionalLightColor * diffuse * 0.7 + 
            pointLightColor * attenuation + 
            spotlightColor * spotlightIntensity, 1.0);
    }
`;
// Define spotlight properties
const spotlight = {
    color: [1.0, 1.0, 1.0], // White light
    position: [0.0, 1.0, 0.0], // Spotlight position
    direction: [0.0, -1.0, 0.0], // Direction the spotlight is pointing
    angle: Math.PI / 4 // Angle of the spotlight cone
};

// Get the locations of the spotlight uniforms
const spotlightColorLocation = gl.getUniformLocation(shaderProgram, "spotlightColor");
const spotlightPositionLocation = gl.getUniformLocation(shaderProgram, "spotlightPosition");
const spotlightDirectionLocation = gl.getUniformLocation(shaderProgram, "spotlightDirection");
const spotlightAngleLocation = gl.getUniformLocation(shaderProgram, "spotlightAngle");

// Send spotlight data to the shader
gl.uniform3fv(spotlightColorLocation, spotlight.color);
gl.uniform3fv(spotlightPositionLocation, spotlight.position);
gl.uniform3fv(spotlightDirectionLocation, spotlight.direction);
gl.uniform1f(spotlightAngleLocation, spotlight.angle);
// Variables to track mouse position and camera rotation
let mouseX = 0;
let mouseY = 0;
let isMouseDown = false;

// Event listeners to track mouse movements
canvas.addEventListener('mousedown', () => {
    isMouseDown = true;
});

canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});

canvas.addEventListener('mousemove', (event) => {
    if (isMouseDown) {
        // Calculate the change in mouse position
        let deltaX = event.movementX;
        let deltaY = event.movementY;

        // Update camera rotation based on mouse movement
        camera.rotationY += deltaX * 0.01; // Y-axis (yaw)
        camera.rotationX -= deltaY * 0.01; // X-axis (pitch)

        // Clamp the camera's pitch to prevent flipping upside down
        camera.rotationX = Math.max(Math.min(camera.rotationX, Math.PI / 2), -Math.PI / 2);
    }
});
// Setup model-view matrix (camera)
const modelViewMatrix = mat4.create();

// Function to update the camera
function updateCamera() {
    mat4.identity(modelViewMatrix);

    // Apply rotations around the X and Y axes based on mouse movements
    mat4.rotateX(modelViewMatrix, modelViewMatrix, camera.rotationX);
    mat4.rotateY(modelViewMatrix, modelViewMatrix, camera.rotationY);

    // Move the camera along the Z-axis
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -camera.z]);
}

let keys = {
    w: false,
    a: false,
    s: false,
    d: false
};

// Event listeners for keydown and keyup
window.addEventListener('keydown', (event) => {
    if (event.key === 'w') keys.w = true;
    if (event.key === 'a') keys.a = true;
    if (event.key === 's') keys.s = true;
    if (event.key === 'd') keys.d = true;
});

window.addEventListener('keyup', (event) => {
    if (event.key === 'w') keys.w = false;
    if (event.key === 'a') keys.a = false;
    if (event.key === 's') keys.s = false;
    if (event.key === 'd') keys.d = false;
});
function updateCamera() {
    // Rotate the camera based on mouse movement
    mat4.identity(modelViewMatrix);
    mat4.rotateX(modelViewMatrix, modelViewMatrix, camera.rotationX);
    mat4.rotateY(modelViewMatrix, modelViewMatrix, camera.rotationY);
    mat4.translate(modelViewMatrix, modelViewMatrix, [0, 0, -camera.z]);

    // Move the camera based on keyboard input
    let moveSpeed = 0.1; // Speed of camera movement
    if (keys.w) camera.z -= moveSpeed;
    if (keys.s) camera.z += moveSpeed;
    if (keys.a) camera.x -= moveSpeed;
    if (keys.d) camera.x += moveSpeed;
}
function render() {
    // Update the camera position and rotation
    updateCamera();

    // Clear the canvas and render objects
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Draw your objects here...
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

    // Request the next frame
    requestAnimationFrame(render);
}

// Start rendering
render();
document.getElementById('export').onclick = () => {
    // Create a JSON object with object data
    const exportData = objects.map(object => ({
        position: { x: object.x, y: object.y, z: object.z },
        size: object.size,
        color: object.color
    }));

    // Create a JSON file from the data
    const blob = new Blob([JSON.stringify(exportData)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scene_export.json';
    link.click();
};
