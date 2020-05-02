/*
 * Jedy Chen
 */


/* https://threejs.org/examples/js/Detector.js */
var Detector={canvas:!!window.CanvasRenderingContext2D,webgl:function(){try{var e=document.createElement("canvas");return!!window.WebGLRenderingContext&&(e.getContext("webgl")||e.getContext("experimental-webgl"))}catch(t){return false}}(),workers:!!window.Worker,fileapi:window.File&&window.FileReader&&window.FileList&&window.Blob,getWebGLErrorMessage:function(){var e=document.createElement("div");e.id="webgl-error-message";e.style.fontFamily="monospace";e.style.fontSize="13px";e.style.fontWeight="normal";e.style.textAlign="center";e.style.background="#fff";e.style.color="#000";e.style.padding="1.5em";e.style.width="400px";e.style.margin="5em auto 0";if(!this.webgl){e.innerHTML=window.WebGLRenderingContext?['Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n"):['Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n")}return e},addGetWebGLMessage:function(e){var t,n,r;e=e||{};t=e.parent!==undefined?e.parent:document.body;n=e.id!==undefined?e.id:"oldie";r=Detector.getWebGLErrorMessage();r.id=n;t.appendChild(r)}};
var script=document.createElement('script');

if (!Detector.webgl) Detector.addGetWebGLMessage()


/* - Main Declarations - */
var _width, _height, PI
var projectData
var CUBE_SIZE, GRID, TOTAL_CUBES, WALL_SIZE, HALF_WALL_SIZE
var MAIN_COLOR, SECONDARY_COLOR, BACKGROUND_COLOR
var cubes, renderer, camera, scene, group, stats
var imageLoader, coverMaterials, loadManager, loader
/* - Ray Caster Selection- */
var raycaster, mouse, INTERSECTED

init()
animate()

/* - Main Functions - */
function init() {
    _width = window.innerWidth
    _height = window.innerHeight
    PI = Math.PI
    // imageLoader = new AjaxTextureLoader

    CUBE_SIZE = 100 /* width, height */
    SCROLL_SPEED = 10.0
    GRID = 9 /* cols, rows */
    TOTAL_CUBES = (GRID * GRID)
    WALL_SIZE = (GRID * CUBE_SIZE)
    HALF_WALL_SIZE = (WALL_SIZE / 2)
    CAMERA_START = (HALF_WALL_SIZE * 0.7)
    MAIN_COLOR = 0xFFFFFF
    LIGHT_COLOR = 0xFFFFFF
    SECONDARY_COLOR = 0x000000
    BACKGROUND_COLOR = 0x000000
    cubes = []

    renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: document.getElementById("viewport"),
    })

    camera = new THREE.PerspectiveCamera(45, (_width / _height), 0.1, 10000)
    scene = new THREE.Scene()
    group = new THREE.Object3D()

    mouse = new THREE.Vector2()
    raycaster = new THREE.Raycaster()

    stats = new Stats();
    stats.showPanel( 1 );
    document.body.appendChild( stats.dom );

    /* -- -- */
    loadJSON(function(response) {
      // Parse JSON string into object
        projectData = JSON.parse(response)
        loadCoverImages()
     });
    
    window.addEventListener('scroll', updateCamera)
    window.addEventListener('mousemove', onMouseMove, false )
    window.addEventListener('resize', resizeHandler, false)
    window.addEventListener('click', onMouseClick, false)
}

function loadCoverImages() {
    //https://threejsfundamentals.org/threejs/lessons/threejs-textures.html#easy
    loadManager = new THREE.LoadingManager();
    loader = new THREE.TextureLoader(loadManager);
    coverMaterials = []

    var imageOffsets = [
        {x: 0., y: 0.5 },
        {x: 0.333, y: 0.5 },
        {x: 0.666, y: 0.5},
        {x: 0., y: 0. },
        {x: 0.333, y: 0. },
        {x: 0.666, y: 0. },
    ]

    for (var i=0; i < projectData.projects.length; i++) {
        for (var j=0; j<6; j++) {
            var coverImage = loader.load( projectData.projects[i].imageUrl );
            coverImage.repeat.set( 0.333, 0.5 );
            coverImage.offset.set( imageOffsets[j].x, imageOffsets[j].y );
            coverImage.anisotropy = renderer.capabilities.getMaxAnisotropy();
            var coverMaterial = new THREE.MeshStandardMaterial({map: coverImage})
            coverMaterial.transparent = true
            coverMaterials.push(coverMaterial)
        }
    }
     
    loadManager.onLoad = () => {
        setupCamera(0, CAMERA_START, 640)
        setupCubes(group, projectData) // Rotating cards
        setupLights(group)
        group.position.y = 50
        group.rotation.set(0, 0, 0)
        scene.add(group)
        setupRenderer(document.body)
    };
}

function animate() {
    stats.begin()
    render()
    stats.end()
    requestAnimationFrame( animate )
}

/* -- LOADER -- */
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

/* -- CAMERA -- */
function setupCamera(x, y, z) {
    camera.position.set(x, y, z)
}

/* -- CUBES --*/
function setupCubes(parent, projectData) {
    var geometry = new THREE.BoxBufferGeometry(CUBE_SIZE, CUBE_SIZE, 0.03)
    for (var i=0; i < projectData.projects.length; i++) {
        setupSingleProjectCubes(parent, projectData.projects[i], geometry, i)
    }
}

function setupSingleProjectCubes(parent, project, geometry, projectIndex) {
    var rowMaxProjects = 3
    var rowMaxCubes = 3
    var colMaxCubes = 2
    var projectPosition = project.position
    var half_wall = (GRID * CUBE_SIZE) / 2
    var xOrigin =  (projectPosition % rowMaxProjects) * CUBE_SIZE * rowMaxCubes - half_wall + (CUBE_SIZE/2)
    var yOrigin =  - Math.floor(projectPosition/rowMaxProjects) * CUBE_SIZE * colMaxCubes + (CUBE_SIZE) * 4
    

    for (i = 0; i < 6; i++) {
        var horizontalFlip = Math.random() >= 0.5;
        var index = i + projectIndex*6
        var xStart = (projectPosition % rowMaxProjects) * rowMaxCubes
        var yStart = Math.floor(projectPosition/rowMaxProjects) * colMaxCubes
        var transitionPosX = xStart + i % rowMaxCubes
        var transitionPosY = yStart + Math.floor(i/rowMaxCubes)
        var cubeMaterial = [
            new THREE.MeshStandardMaterial({
                color: MAIN_COLOR //left
            }),
            new THREE.MeshStandardMaterial({
                color: MAIN_COLOR //right
            }),
            new THREE.MeshStandardMaterial({
                color: MAIN_COLOR // top
            }),
            new THREE.MeshStandardMaterial({
                color: MAIN_COLOR // bottom
            }),
            coverMaterials[index],
            new THREE.MeshStandardMaterial({
                // color: MAIN_COLOR // back
                map: drawTextAsTexture(
                    project.blocks[i].text.split(','),
                    //transitionPosX.toString()+transitionPosY.toString(),
                    project.themeColor,
                    project.blocks[i].weight,
                    horizontalFlip) //back
            })
        ]

        var cube = new THREE.Mesh(geometry, cubeMaterial )
        var x = xOrigin + (i % rowMaxCubes) * CUBE_SIZE
        var y = yOrigin - Math.floor(i/rowMaxCubes) * CUBE_SIZE

        cube.position.set(x, y, 0)
        cube.name = 'cube'
        cube.transitionPos = {
            x: transitionPosX, 
            y: transitionPosY
        }
        
        cube.direction = (Math.random() < 0.5 ? -PI : PI)
        cube.attr = horizontalFlip ? 'y' : 'x'
        addFlipping(cube)
        parent.add(cube)
    }
}

function drawTextAsTexture(textArray, color, fontWeight, horizontalFlip) {
    var canvas = document.createElement("canvas");
    var magnitude = 2.0
    canvas.width = 128 * magnitude;
    canvas.height = 128 * magnitude;
    var context = canvas.getContext("2d");
    context.font = fontWeight + " 26pt Helvetica"
    context.textAlign = "left";
    context.fillStyle = color;
    var flip = 1;
    if (!horizontalFlip) {
        context.rotate(PI);
        flip = -1;
    }
    var x = flip * canvas.width / 2 - 55 * magnitude;
    var y = flip * canvas.height / 2 - 35 * magnitude;
    context.fillRect(0,0,flip * canvas.width,flip * canvas.height);
    context.fillStyle = "black";
    for (var i=0; i<textArray.length; i++) {
        context.fillText(textArray[i], x, y);
        y += 25 * magnitude;
    }
    var texture = new THREE.Texture( canvas );
    texture.minFilter = THREE.LinearFilter;
    texture.needsUpdate = true;

    return texture
}

function addFlipping(cube) {
    var duration = 2

    var config = {
        ease : Elastic.easeOut,
        duration: duration,
    }
    config[cube.attr] = cube.direction

    var config_reverse = {
        ease : Elastic.easeOut,
        duration: duration,
    }
    config_reverse[cube.attr] = 0

    cube.flip = gsap.timeline({paused: true});
    cube.flip.to(
        cube.rotation,
        duration,
        config
    )
    cube.flip.to(
        cube.rotation,
        duration,
        config_reverse
    )
}

/* -- LIGHTS -- */
function setupLights(parent) {
    var light, soft_light

    light = new THREE.DirectionalLight(LIGHT_COLOR, 2.0)
    soft_light = new THREE.DirectionalLight(LIGHT_COLOR, 1.)

    light.position.set(-WALL_SIZE, -WALL_SIZE, CUBE_SIZE * GRID)

    soft_light.position.set(WALL_SIZE, WALL_SIZE, CUBE_SIZE * GRID)
    light.name = 'light'
    soft_light.name = 'soft_light'
    parent.add(light).add(soft_light)
}

/* -- LISTENER -- */
function resizeHandler() {
    _width = window.innerWidth
    _height = window.innerHeight
    renderer.setSize(_width, _height)
    camera.aspect = _width / _height
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

    if ( intersects.length > 0 && intersects[ 0 ].object.name == 'cube' ) {
        cubesTransition(intersects[ 0 ].object)
    }
}

function cubesTransition(cube) {
    for (var i=0; i<group.children.length; i++) {
        if (group.children[i].name == 'cube') {
            var config_ripple = {
                ease : Elastic.easeOut,
                duration: 2,
                z: 100
            }

            var config_flip = {
                ease : Power4.easeOut,
                duration: 0.5,
            }

            var config_fade = {
                ease : Power4.easeOut,
                duration: 1,
                opacity: 0.
            }

            config_ripple['delay'] = calcDelay(group.children[i].transitionPos, cube.transitionPos)
            config_fade['delay'] = config_ripple['delay'] + config_ripple['duration'] - 1
            config_flip[group.children[i].attr] = 0


            gsap.to(
                group.children[i].position,
                config_ripple
            )

            group.children[i].flip.pause()

            gsap.to(
                group.children[i].rotation,
                config_flip
            )

            gsap.to(
                group.children[i].material[4],
                config_fade
            )

            gsap.to(
                group.children[i].material[5],
                config_fade
            )
        }
    }
}

function calcDelay(targetPos, originPos) {
    var delayGap = 0.2;
    var a = targetPos.x - originPos.x
    var b = targetPos.y - originPos.y
    var distance =  Math.sqrt( a*a + b*b );
    return distance*delayGap
}

function updateCamera() {
    camera.position.y = CAMERA_START - window.scrollY * SCROLL_SPEED / 50.0
}

/* -- RENDER -- */
function setupRenderer(parent) {
    renderer.setSize(_width, _height)
    renderer.setClearColor(BACKGROUND_COLOR, 1.0)
    parent.appendChild(renderer.domElement)
}

function render() {
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera )
    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects( group.children );

    if ( intersects.length > 0 ) {
        if ( INTERSECTED != intersects[ 0 ].object ) {
            INTERSECTED = intersects[ 0 ].object
            if ( INTERSECTED.name == 'cube' ) {
                INTERSECTED.flip.restart()
            }
        }
        else if ( INTERSECTED && INTERSECTED.name == 'cube') {
            if ( INTERSECTED.flip.progress() >= 0.5 ) {
                INTERSECTED.flip.progress(0.5)
            }
        }

    } else {
        // INTERSECTED = null
    }

    renderer.render(scene, camera)
}

