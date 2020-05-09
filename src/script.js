/*
 * Jedy Chen
 */


/* https://threejs.org/examples/js/Detector.js */
var Detector={canvas:!!window.CanvasRenderingContext2D,webgl:function(){try{var e=document.createElement("canvas");return!!window.WebGLRenderingContext&&(e.getContext("webgl")||e.getContext("experimental-webgl"))}catch(t){return false}}(),workers:!!window.Worker,fileapi:window.File&&window.FileReader&&window.FileList&&window.Blob,getWebGLErrorMessage:function(){var e=document.createElement("div");e.id="webgl-error-message";e.style.fontFamily="monospace";e.style.fontSize="13px";e.style.fontWeight="normal";e.style.textAlign="center";e.style.background="#fff";e.style.color="#000";e.style.padding="1.5em";e.style.width="400px";e.style.margin="5em auto 0";if(!this.webgl){e.innerHTML=window.WebGLRenderingContext?['Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n"):['Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n")}return e},addGetWebGLMessage:function(e){var t,n,r;e=e||{};t=e.parent!==undefined?e.parent:document.body;n=e.id!==undefined?e.id:"oldie";r=Detector.getWebGLErrorMessage();r.id=n;t.appendChild(r)}};
var script=document.createElement('script');

if (!Detector.webgl) Detector.addGetWebGLMessage()


// **********************************************************************
// DECLARATIONS
// ----------------------------------------------------------------------

/* - Window Configurations - */
var _width, _height
const _breakpoints = {
    xs: 600,
    sm: 960,
    md: 1264,
    lg: 1904
}
const _cameraDistance = {
    single: 360,
    double: 720,
    triple: 1090
}
/* - Project Configurations - */
var projectsConfig
var CARD_SIZE, WALL_SIZE, OFFSET_TOP, CARD_CREATED, AUTO_FLIP, PIXEL_RATIO
var PROJ_NUM, PROJ_COL_NUM, CARD_COL_NUM, CARD_ROW_NUM
var LIGHT_COLOR, BACKGROUND_COLOR
/* - Interaction Configurations - */
var SCROLL_SPEED, CAMERA_Y, CAMERA_Z
/* - Ray Caster Configurations - */
var raycaster, mouse, INTERSECTED
/* - ThreeJS Rendering Scene Variables - */
var renderer, camera, scene, group, stats, cards
var coverImages, loadManager, imageLoader

init()
animate()


// **********************************************************************
// MAIN
// ----------------------------------------------------------------------

/* - Main Functions - */
// Set up basic scene and interaction configurations.
function init() {
    _width = window.innerWidth
    _height = window.innerHeight

    // Check based on device info
    if (mobileCheck() === true) {
        AUTO_FLIP = true // True only on mobile and tablet
        if (!tabletCheck()) PIXEL_RATIO = window.devicePixelRatio
        else PIXEL_RATIO = 1
    } else {
        PIXEL_RATIO = 1
        AUTO_FLIP = false
    }

    CARD_SIZE = 100 // Card's width, height
    CARD_CREATED = false
    OFFSET_TOP = 60 // Move the group upwards
    SCROLL_SPEED = 10.0 // Mouse scrolling spped
    WALL_SIZE = (9 * CARD_SIZE) // Standard size for setting up positions of light and other major elements. 
    LIGHT_COLOR = 0xFFFFFF
    BACKGROUND_COLOR = 0x000000
    cards = []

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
        PROJ_NUM = projectsConfig.projects.length
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
    if (AUTO_FLIP === true) {
        renderer.render(scene, camera)
        return
    }
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

    for (var i=0; i < PROJ_NUM; i++) {
        for (var j=0; j<6; j++) {
            var coverImage = imageLoader.load( projectsConfig.projects[i].imageUrl );
            coverImage.repeat.set( 0.333, 0.5 );
            //coverImage.generateMipmaps = false;
            //coverImage.minFilter = THREE.LinearFilter;
            //coverImage.magFilter = THREE.LinearFilter;
            coverImage.offset.set( imageOffsets[j].x, imageOffsets[j].y );
            //coverImage.anisotropy = renderer.getMaxAnisotropy();
            coverImages.push(coverImage)
        }
    }
     
    loadManager.onLoad = () => {
        setupResponsive()
        setupLights(group)
        group.position.y = 0
        scene.add(group)
        setupRenderer(document.body)
    };
}



// **********************************************************************
// SETUP
// ----------------------------------------------------------------------


/* -- Set up responsive behavior -- */
function setupResponsive(resize=false) {
    renderer.setSize(_width, _height)
    CARD_COL_NUM = 3
    CARD_ROW_NUM = 2
    
    console.log(_width, PIXEL_RATIO)
    aspectRatio = _width / _height
    
    // Check based on screen size
    switch (true) {
        case (_width < _breakpoints.xs * PIXEL_RATIO):
            PROJ_COL_NUM = 1
            CAMERA_Z = _cameraDistance.single / aspectRatio
            console.log("xs")
            break;
        case (_width < _breakpoints.sm * PIXEL_RATIO):
            PROJ_COL_NUM = 2
            CAMERA_Z = _cameraDistance.double / aspectRatio
            console.log("sm")
            break;
        case (_width < _breakpoints.md * PIXEL_RATIO):
            PROJ_COL_NUM = 2
            CAMERA_Z = _cameraDistance.double / aspectRatio
            console.log("md")
            break;
        default:
            PROJ_COL_NUM = 3
            CAMERA_Z = _cameraDistance.triple / aspectRatio
            console.log("default")
            break;
    }
    console.log(CAMERA_Z)
    // Move the camera to the top of project cards
    CAMERA_Y = Math.floor(PROJ_NUM / PROJ_COL_NUM / 2) * CARD_ROW_NUM * CARD_SIZE
    setupCamera(0, CAMERA_Y, CAMERA_Z)
    camera.aspect = aspectRatio
    camera.updateProjectionMatrix()

    if (!CARD_CREATED)
        setupProjectCards(group, projectsConfig)
    else
        resetProjectCards(resize)
}

/* -- Set up ThreeJS camera -- */
//  x, y, z: number.
function setupCamera(x, y, z) {
    camera.position.set(x, y, z)
}

/* -- Set up ThreeJS lights -- */
//  parent: object3D Object group.
function setupLights(parent) {
    var key_light, ambient_light
    key_light = new THREE.DirectionalLight(LIGHT_COLOR, 1.5)
    ambient_light = new THREE.AmbientLight(LIGHT_COLOR, 1.2)
    key_light.position.set(-WALL_SIZE, WALL_SIZE, WALL_SIZE)
    ambient_light.position.set(WALL_SIZE, WALL_SIZE, WALL_SIZE)
    parent.add(key_light).add(ambient_light)
}

/* -- Set up ThreeJS render -- */
//  parent: object3D Object group.
function setupRenderer(parent) {
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(BACKGROUND_COLOR, 1.0)
    parent.appendChild(renderer.domElement)
}

/* -- Set up project cards --*/
//  parent: object3D Object group.
//  projectConfig: json Project configuration file. 
function setupProjectCards(parent, projectsConfig) {
    var geometry = new THREE.BoxBufferGeometry(CARD_SIZE, CARD_SIZE, 0.03)
    const blankMaterial = new THREE.MeshBasicMaterial({color: 0xFFFFFF})
    for (var i=0; i < PROJ_NUM; i++) {
        _setupCardsSingleProject(parent, projectsConfig.projects[i], blankMaterial, geometry)
    }
}

/* -- Set up cards for a single project --*/
//  parent: object3D Object group.
//  projectConfig: json Single project's configuration file.
//  geometry: mesh BoxBufferGeometry.
function _setupCardsSingleProject(parent, projectConfig, material, geometry) {
    var projectIndex = projectConfig.position
    var projectOrigin = _calcuProjOriginPos(projectIndex)
    
    for (i = 0; i < 6; i++) {
        var horizontalFlip = Math.random() >= 0.5;
        var index = i + projectIndex*6
        var cardMaterial = [
            material, //left
            material, //right
            material, // top
            material, // bottom
            new THREE.MeshBasicMaterial({ // front
                map: coverImages[index],
                transparent: true
            }),
            new THREE.MeshStandardMaterial({ // back
                map: _drawTextAsTexture(
                    projectConfig.blocks[i].text.split(','), 
                    projectConfig.themeColor,
                    projectConfig.blocks[i].weight,
                    horizontalFlip
                )
            })
        ]

        var card = new THREE.Mesh(geometry, cardMaterial )
        card.name = 'card'
        card.index = i // index between 0 to 6
        card.projectIndex = projectIndex
        card.rotateDir = (Math.random() < 0.5 ? -Math.PI : Math.PI)
        card.rotateAxis = horizontalFlip ? 'y' : 'x'

        _setProjectCard(card, projectOrigin, projectIndex, i)

        cards.push(card)
        parent.add(card)
    }

    CARD_CREATED = true
}

function resetProjectCards(resize=false) {
    for (var i=0; i<cards.length; i++) {
        var card = cards[i]
        var projectIndex = card.projectIndex
        var projectOrigin = _calcuProjOriginPos(projectIndex)

        _setProjectCard(card, projectOrigin, projectIndex, card.index, resize)
    }
}

function _setProjectCard(card, projectOrigin, projectIndex, cardIndex, resize) {
    var x = projectOrigin.x + (cardIndex % CARD_COL_NUM) * CARD_SIZE
    var y = projectOrigin.y - Math.floor(cardIndex / CARD_COL_NUM) * CARD_SIZE
    card.position.set(x, y, 0)
    // Gives each card a relative position of index (x, y) within the canvas, 
    // card at the top left corner is (0, 0), the card on the right is (1, 0)
    var projOriginPos = {
        x: (projectIndex % PROJ_COL_NUM) * CARD_COL_NUM,
        y: Math.floor(projectIndex / PROJ_COL_NUM) * CARD_ROW_NUM
    }
    card.coordinatePos = {
        x: projOriginPos.x + cardIndex % CARD_COL_NUM,
        y: projOriginPos.y + Math.floor(cardIndex / CARD_COL_NUM)
    }
    if (!resize) _addCardFlipAnimation(card, resize)
}

function _calcuProjOriginPos(projectIndex) {
    var projectWidth = CARD_COL_NUM * CARD_SIZE
    var projectHeight = CARD_ROW_NUM * CARD_SIZE
    var overallWidth = PROJ_COL_NUM * projectWidth
    var overallHeight = Math.floor(PROJ_NUM/PROJ_COL_NUM) * projectHeight

    var xOrigin =  - overallWidth / 2 + (projectIndex % PROJ_COL_NUM) * projectWidth
    var yOrigin = overallHeight * 0.5 - Math.floor(projectIndex / PROJ_COL_NUM) * projectHeight

    return {x: xOrigin + CARD_SIZE * 0.5, y: yOrigin + CARD_SIZE * 0.5}
}

/* -- Draws text on a canvas --*/
// To be used as texture on cards.
//  textArray: string Separated with ','.
//  color: hex number.
//  fontWeight: string 'normal'/'bold'/'lighter'
//  horizontalFlip: boolean If the card is flipping horizontally. 
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
    //texture.generateMipmaps = false;
    //texture.minFilter = THREE.LinearFilter;
    //texture.magFilter = THREE.LinearFilter;
    //texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    return texture
}

/* -- Adds flipping animation as GSAP timeline --*/
//  card: object3D Project card
function _addCardFlipAnimation(card) {
    const duration = 2 // 2 seconds
    var delay = 0
    var pause = true
    var repeat = 0
    if (AUTO_FLIP) {
        delay = randomInRange(0, 40)
        pause = false
        repeat = -1
    }
    var config_flip = {
        ease : Elastic.easeOut,
        duration: duration,
        delay: delay,
    }
    var config_reverse = {
        ease : Elastic.easeOut,
        duration: duration,
    }

    config_flip[card.rotateAxis] = card.rotateDir
    config_reverse[card.rotateAxis] = 0

    card.flip = gsap.timeline({
        paused: pause,
        repeat: repeat
    }).to(
        card.rotation,
        config_flip
    ).to(
        card.rotation,
        config_reverse
    )
}

/* -- Adds fade away transition to all the cards --*/
//  cardVisited: object3D Project card, currently clicked card.
function _addCardTransition(cardVisited) {
    for (var i=0; i<cards.length; i++) {
        var card = cards[i]
        var config_ripple = {
            ease : Elastic.easeOut,
            duration: 2,
            z: 100
        }
        config_ripple['delay'] =
            0.2 * calcDistance(card.coordinatePos, cardVisited.coordinatePos)
        var config_flip = {
            ease : Power4.easeOut,
            duration: 0.5,
        }
        config_flip[card.rotateAxis] = 0
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
            card.position,
            config_ripple
        )
        // Removes the flip animation completely
        card.flip.clear()
        // Flips back the cards that are turned around.
        gsap.to(
            card.rotation,
            config_flip
        )
        // Fading animation to the front side of the cards
        gsap.to(
            card.material[4],
            config_fade
        )
        // // Fading animation to the front side of the cards
        // gsap.to(
        //     card.position,
        //     config_disappear
        // )
    }
}


// **********************************************************************
// LISTENER
// ----------------------------------------------------------------------


/* - Camera scrolling - */
function updateCamera() {
    camera.position.y = CAMERA_Y - window.scrollY * SCROLL_SPEED / 50.0
}

/* - Camera scrolling - */
function resizeHandler() {
    _width = window.innerWidth
    _height = window.innerHeight
    setupResponsive(true)
}

/* - Camera scrolling - */
function onMouseMove( event ) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components
    event.preventDefault()
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1
}

/* - Camera scrolling - */
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

// **********************************************************************
// UTILITIES
// ----------------------------------------------------------------------

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
//  pos1: vec2
//  pos2: vec2
function calcDistance(pos1, pos2) {
    var a = pos1.x - pos2.x
    var b = pos1.y - pos2.y
    return Math.sqrt( a*a + b*b );
}

function mobileCheck() {
    var isMobile = false; //initiate as false
    // device detection
    if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
        || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) { 
        isMobile = true;
    }
    return isMobile
};

function tabletCheck() {
    if (/ipad|tablet/i.test(navigator.userAgent)) return true
    else false
};

function randomInRange(min, max) {
    return Math.random() * (max- min + 1) + min;
}