/*
 * Jedy Chen
 */


/* https://threejs.org/examples/js/Detector.js */
var Detector={canvas:!!window.CanvasRenderingContext2D,webgl:function(){try{var e=document.createElement("canvas");return!!window.WebGLRenderingContext&&(e.getContext("webgl")||e.getContext("experimental-webgl"))}catch(t){return false}}(),workers:!!window.Worker,fileapi:window.File&&window.FileReader&&window.FileList&&window.Blob,getWebGLErrorMessage:function(){var e=document.createElement("div");e.id="webgl-error-message";e.style.fontFamily="monospace";e.style.fontSize="13px";e.style.fontWeight="normal";e.style.textAlign="center";e.style.background="#fff";e.style.color="#000";e.style.padding="1.5em";e.style.width="400px";e.style.margin="5em auto 0";if(!this.webgl){e.innerHTML=window.WebGLRenderingContext?['Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n"):['Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n")}return e},addGetWebGLMessage:function(e){var t,n,r;e=e||{};t=e.parent!==undefined?e.parent:document.body;n=e.id!==undefined?e.id:"oldie";r=Detector.getWebGLErrorMessage();r.id=n;t.appendChild(r)}};
var script=document.createElement('script');

if (!Detector.webgl) Detector.addGetWebGLMessage()




/* - Window Configurations - */
var _width, _height, _scale
const _breakpoints = {
    xs: 600,
    sm: 960,
    md: 1264,
    lg: 1904
}
const _cameraDistance = {
    xs: 680,
    sm: 680,
    md: 680,
    lg: 680
}
/* - Project Configurations - */
var projectsConfig
var CARD_SIZE, WALL_SIZE, OFFSET_TOP
var LIGHT_COLOR, BACKGROUND_COLOR
/* - Interaction Configurations - */
var SCROLL_SPEED, CAMERA_Y, CAMERA_Z
/* - Ray Caster Configurations - */
var raycaster, mouse, INTERSECTED
/* - ThreeJS Rendering Scene Variables - */
var renderer, camera, scene, group, stats
var coverImages, loadManager, imageLoader

init()
animate()



// MAIN FUNCTIONS

/* - Main Functions - */
// Set up basic scene and interaction configurations.
function init() {
    _width = window.innerWidth
    _height = window.innerHeight
    _scale = 1.0

    CARD_SIZE = 100 // Card's width, height
    OFFSET_TOP = 60 // Move the group upwards
    SCROLL_SPEED = 10.0 // Mouse scrolling spped
    WALL_SIZE = (9 * CARD_SIZE) // Standard size for setting up positions of light and other major elements. 
    CAMERA_Y = (WALL_SIZE * 0.35) // Camera's position
    CAMERA_Z = 680 * _breakpoints.md / _width // Camera's position
    LIGHT_COLOR = 0xFFFFFF
    BACKGROUND_COLOR = 0x000000

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById("viewport")
    })
    camera = new THREE.PerspectiveCamera(45, (_width / _height), 0.1, 2000)
    scene = new THREE.Scene()
    group = new THREE.Object3D()
    mouse = new THREE.Vector2()
    raycaster = new THREE.Raycaster()

    stats = new Stats();
    stats.showPanel( 1 );
    document.body.appendChild( stats.dom );

    // Parse JSON string into object.
    // After loading the project configuratin, will continue loading assets.
    loadJSON(function(response) {
        projectsConfig = JSON.parse(response)
        loadCoverImages()
     });
    
    window.addEventListener('scroll', updateCamera)
    window.addEventListener('mousemove', onMouseMove, false )
    window.addEventListener('resize', resizeHandler, false)
    window.addEventListener('click', onMouseClick, false)
}

/* - Main Update Loop - */
function animate() {
    stats.begin()
    render()
    stats.end()
    requestAnimationFrame( animate )
}

/* - Main Rendering Function - */
function render() {
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera )
    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects( group.children );

    if ( intersects.length > 0 ) {
        if ( INTERSECTED != intersects[ 0 ].object ) {
            INTERSECTED = intersects[ 0 ].object
            if ( INTERSECTED.name == 'card' ) {
                INTERSECTED.flip.restart()
                document.documentElement.style.cursor = 'pointer';
            }
        }
        else if ( INTERSECTED && INTERSECTED.name == 'card') {
            document.documentElement.style.cursor = 'pointer';
            if ( INTERSECTED.flip.progress() >= 0.5 ) {
                INTERSECTED.flip.progress(0.5)
            }
        }

    } else {
        document.documentElement.style.cursor = 'default';
        // INTERSECTED = null
    }

    renderer.render(scene, camera)
}

/* - Load cover images for projects - */
// It will set up all the threejs scene after loading the images.
// Can extend to a loading bar with the link below.
// https://threejsfundamentals.org/threejs/lessons/threejs-textures.html#easy
function loadCoverImages() {
    
    loadManager = new THREE.LoadingManager();
    imageLoader = new THREE.TextureLoader(loadManager);
    coverImages = []

    const imageOffsets = [
        {x: 0., y: 0.5 },
        {x: 0.333, y: 0.5 },
        {x: 0.666, y: 0.5},
        {x: 0., y: 0. },
        {x: 0.333, y: 0. },
        {x: 0.666, y: 0. },
    ]

    for (var i=0; i < projectsConfig.projects.length; i++) {
        for (var j=0; j<6; j++) {
            var coverImage = imageLoader.load( projectsConfig.projects[i].imageUrl );
            coverImage.repeat.set( 0.333, 0.5 );
            coverImage.offset.set( imageOffsets[j].x, imageOffsets[j].y );
            coverImage.anisotropy = renderer.capabilities.getMaxAnisotropy();
            coverImages.push(coverImage)
        }
    }
     
    loadManager.onLoad = () => {
        setupCamera(0, CAMERA_Y, CAMERA_Z)
        setupCards(group, projectsConfig)
        setupLights(group)
        group.position.y = OFFSET_TOP
        scene.add(group)
        setupRenderer(document.body)
    };
}



// SETUP



/* -- Set up ThreeJS camera -- */
function setupCamera(x, y, z) {
    camera.position.set(x, y, z)
}

/* -- Set up ThreeJS lights -- */
function setupLights(parent) {
    var key_light, ambient_light
    key_light = new THREE.DirectionalLight(LIGHT_COLOR, 1.5)
    ambient_light = new THREE.AmbientLight(LIGHT_COLOR, 1.2)
    key_light.position.set(-WALL_SIZE, WALL_SIZE, WALL_SIZE)
    ambient_light.position.set(WALL_SIZE, WALL_SIZE, WALL_SIZE)
    parent.add(key_light).add(ambient_light)
}

/* -- Set up ThreeJS render -- */
function setupRenderer(parent) {
    renderer.setSize(_width, _height)
    renderer.setClearColor(BACKGROUND_COLOR, 1.0)
    parent.appendChild(renderer.domElement)
}

/* -- Set up project cards --*/
function setupCards(parent, projectsConfig) {
    var geometry = new THREE.BoxBufferGeometry(CARD_SIZE, CARD_SIZE, 0.03)
    for (var i=0; i < projectsConfig.projects.length; i++) {
        _setupProjectCards(parent, projectsConfig.projects[i], geometry, i)
    }
}

// Set up cards for a single project
function _setupProjectCards(parent, project, geometry, projectIndex) {
    var rowMaxProjects = 3
    var rowMaxCards = 3
    var colMaxCards = 2
    var projectPosition = project.position
    var half_wall = (WALL_SIZE) / 2
    var xOrigin =  (projectPosition % rowMaxProjects) * CARD_SIZE * rowMaxCards - half_wall + (CARD_SIZE/2)
    var yOrigin =  - Math.floor(projectPosition/rowMaxProjects) * CARD_SIZE * colMaxCards + (CARD_SIZE) * 4
    
    const blankMaterial = new THREE.MeshStandardMaterial({color: 0xFFFFFF})

    for (i = 0; i < 6; i++) {
        var horizontalFlip = Math.random() >= 0.5;
        var index = i + projectIndex*6
        var xStart = (projectPosition % rowMaxProjects) * rowMaxCards
        var yStart = Math.floor(projectPosition/rowMaxProjects) * colMaxCards
        var transitionPosX = xStart + i % rowMaxCards
        var transitionPosY = yStart + Math.floor(i/rowMaxCards)

        var cardMaterial = [
            blankMaterial, //left
            blankMaterial, //right
            blankMaterial, // top
            blankMaterial, // bottom
            new THREE.MeshStandardMaterial({ // front
                map: coverImages[index],
                transparent: true
            }),
            new THREE.MeshStandardMaterial({ // back
                map: _drawTextAsTexture(
                    project.blocks[i].text.split(','), //transitionPosX.toString()+transitionPosY.toString(),
                    project.themeColor,
                    project.blocks[i].weight,
                    horizontalFlip
                )
            })
        ]

        var card = new THREE.Mesh(geometry, cardMaterial )
        var x = xOrigin + (i % rowMaxCards) * CARD_SIZE
        var y = yOrigin - Math.floor(i/rowMaxCards) * CARD_SIZE

        card.position.set(x, y, 0)
        card.name = 'card'
        card.transitionPos = {
            x: transitionPosX, 
            y: transitionPosY
        }
        
        card.direction = (Math.random() < 0.5 ? -Math.PI : Math.PI)
        card.attr = horizontalFlip ? 'y' : 'x'
        _addCardFlipAnimation(card)
        parent.add(card)
    }
}

// Draws text on a canvas, to be used as texture on cards.
function _drawTextAsTexture(textArray, color, fontWeight, horizontalFlip) {
    var canvas = document.createElement("canvas")
    const canvasSize = 256
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    var context = canvas.getContext("2d");
    context.font = fontWeight + " 26pt Helvetica"
    context.textAlign = "left";
    context.fillStyle = color;

    // Rotates canvas if the card is not flipping horizontally.
    var flip = 1;
    if (!horizontalFlip) {
        context.rotate(Math.PI);
        flip = -1;
    }
    // Draw canvas background
    context.fillRect(0,0,flip * canvas.width,flip * canvas.height);
    // Draw texts
    var x = flip * canvas.width / 2 - 110;
    var y = flip * canvas.height / 2 - 70;
    context.fillStyle = "black";
    for (var i=0; i<textArray.length; i++) {
        context.fillText(textArray[i], x, y);
        y += 50;
    }

    var texture = new THREE.Texture( canvas );
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    return texture
}

// Adds flipping animation as GSAP timeline.
function _addCardFlipAnimation(card) {
    const duration = 2 // 2 seconds

    var config_flip = {
        ease : Elastic.easeOut,
        duration: duration,
    }
    var config_reverse = {
        ease : Elastic.easeOut,
        duration: duration,
    }

    config_flip[card.attr] = card.direction
    config_reverse[card.attr] = 0

    card.flip = gsap.timeline({
        paused: true
    }).to(
        card.rotation,
        config_flip
    ).to(
        card.rotation,
        config_reverse
    )
}


// Adds fade away transition to all the cards.
function _addCardTransition(cardVisited) {
    for (var i=0; i<group.children.length; i++) {
        var element = group.children[i]
        if (element.name == 'card') {
            var config_ripple = {
                ease : Elastic.easeOut,
                duration: 2,
                z: 100
            }
            config_ripple['delay'] =
                0.2 * calcDistance(element.transitionPos, cardVisited.transitionPos)
            var config_flip = {
                ease : Power4.easeOut,
                duration: 0.5,
            }
            config_flip[element.attr] = 0
            var config_fade = {
                ease : Power4.easeOut,
                duration: 1,
                opacity: 0.
            }
            config_fade['delay'] = config_ripple['delay'] + config_ripple['duration'] - 1.2

            // var config_disappear = {
            //     ease : Power4.easeOut,
            //     duration: 0.1,
            //     z: 1000
            // }
            // config_disappear['delay'] = config_fade['delay'] + config_fade['duration']
            // Moves the cards up on z axis.
            gsap.to(
                element.position,
                config_ripple
            )
            // Removes the flip animation completely
            element.flip.clear()
            // Flips back the cards that are turned around.
            gsap.to(
                element.rotation,
                config_flip
            )
            // Fading animation to the front side of the cards
            gsap.to(
                element.material[4],
                config_fade
            )
            // // Fading animation to the front side of the cards
            // gsap.to(
            //     element.position,
            //     config_disappear
            // )
        }
    }
}




// LISTENER


/* - Camera scrolling -*/
function updateCamera() {
    camera.position.y = CAMERA_Y - window.scrollY * SCROLL_SPEED / 50.0
}

function resizeHandler() {
    _width = window.innerWidth
    _height = window.innerHeight
    renderer.setSize(_width, _height)
    camera.aspect = _width / _height
    CAMERA_Z = 680 * _breakpoints.md / _width // Camera's position
    setupCamera(0, CAMERA_Y, CAMERA_Z)
    camera.updateProjectionMatrix()
}

function onMouseMove( event ) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    event.preventDefault()
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1
}

function onMouseClick(event) {
    event.preventDefault()
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera )
    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects( group.children );

    if ( intersects.length > 0 && intersects[ 0 ].object.name == 'card' ) {
        _addCardTransition(intersects[ 0 ].object)
    }
}



// UTILITIES


/* -- Load Json in AJAX call -- */
function loadJSON(callback) {   
    var xobj = new XMLHttpRequest();
        xobj.overrideMimeType("application/json");
    xobj.open('GET', 'project_data.json', true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            // Required use of an anonymous callback as .open will NOT return a value but simply returns undefined in asynchronous mode
            callback(xobj.responseText);
          }
    };
    xobj.send(null);  
}

/* -- Calculate distance between two Vec2 points -- */
function calcDistance(pos1, pos2) {
    var a = pos1.x - pos2.x
    var b = pos1.y - pos2.y
    return Math.sqrt( a*a + b*b );
}

