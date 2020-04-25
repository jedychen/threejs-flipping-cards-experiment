/*
 * Noel Delgado - @pixelia_me
 * Inspiration: https://dingundding.tumblr.com/post/99836716906
 */

/* https://threejs.org/examples/js/Detector.js */
var Detector={canvas:!!window.CanvasRenderingContext2D,webgl:function(){try{var e=document.createElement("canvas");return!!window.WebGLRenderingContext&&(e.getContext("webgl")||e.getContext("experimental-webgl"))}catch(t){return false}}(),workers:!!window.Worker,fileapi:window.File&&window.FileReader&&window.FileList&&window.Blob,getWebGLErrorMessage:function(){var e=document.createElement("div");e.id="webgl-error-message";e.style.fontFamily="monospace";e.style.fontSize="13px";e.style.fontWeight="normal";e.style.textAlign="center";e.style.background="#fff";e.style.color="#000";e.style.padding="1.5em";e.style.width="400px";e.style.margin="5em auto 0";if(!this.webgl){e.innerHTML=window.WebGLRenderingContext?['Your graphics card does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br />','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n"):['Your browser does not seem to support <a href="http://khronos.org/webgl/wiki/Getting_a_WebGL_Implementation" style="color:#000">WebGL</a>.<br/>','Find out how to get it <a href="http://get.webgl.org/" style="color:#000">here</a>.'].join("\n")}return e},addGetWebGLMessage:function(e){var t,n,r;e=e||{};t=e.parent!==undefined?e.parent:document.body;n=e.id!==undefined?e.id:"oldie";r=Detector.getWebGLErrorMessage();r.id=n;t.appendChild(r)}};

if (!Detector.webgl) Detector.addGetWebGLMessage()

/* - Main Declarations - */
var debug, _width, _height, PI, Utils, CUBE_SIZE, GRID, TOTAL_CUBES, WALL_SIZE, HALF_WALL_SIZE,
    MAIN_COLOR, SECONDARY_COLOR, cubes, renderer, camera, scene, group, texture

/* - Ray Caster Selection- */
var raycaster, mouse, INTERSECTED

var projectData

init()
animate()

/* - Main Functions - */

function init() {
    debug = false
    _width = window.innerWidth
    _height = window.innerHeight
    PI = Math.PI

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
    FLOOR_COLOR = 0x000000
    cubes = []

    renderer = new THREE.WebGLRenderer({
        antialias: false,
        canvas: document.getElementById("viewport"),
    })

    camera = new THREE.PerspectiveCamera(45, (_width / _height), 0.1, 10000)
    scene = new THREE.Scene()
    group = new THREE.Object3D()

    mouse = new THREE.Vector2()
    raycaster = new THREE.Raycaster()

    Utils = {
        randomInRange : function(min, max) {
            return Math.floor(Math.random() * (max- min + 1)) + min;
        }
    }



    /* -- -- */
    loadJSON(function(response) {
      // Parse JSON string into object
        projectData = JSON.parse(response)

        setupCamera(0, CAMERA_START, 700)
        setupBox(group) // Sandbox
        setupFloor(group)
        setupCubes(group, projectData) // Rotating cards
        setupLights(group)
        group.position.y = 50
        group.rotation.set(0, 0, 0)
        scene.add(group)
        setupRenderer(document.body)
     });
    

    /* -- -- */
    // if (debug) render()
    // else TweenLite.ticker.addEventListener("tick", render)
    window.addEventListener('scroll', updateCamera)
    window.addEventListener('mousemove', onMouseMove, false )
    window.addEventListener('resize', resizeHandler, false)
}

function animate() {
    requestAnimationFrame( animate )
    render()
}

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
    // scene.add(camera)
}

/* -- BOX -- */
function setupBox(parent) {
    var i, boxesArray, geometry, material

    boxesArray = []
    geometry = new THREE.BoxGeometry(WALL_SIZE, WALL_SIZE, 0.05)
    geometry.faces[8].color.setHex(SECONDARY_COLOR)
    geometry.faces[9].color.setHex(SECONDARY_COLOR)
    geometry.colorsNeedUpdate = true
    material = new THREE.MeshBasicMaterial({
        color : SECONDARY_COLOR,
        vertexColors : THREE.FaceColors
    })

    for (i = 0; i < 5; i++) {
        boxesArray.push(new THREE.Mesh(geometry, material))
    }

    // back
    boxesArray[0].position.set(0, HALF_WALL_SIZE, -HALF_WALL_SIZE)
    boxesArray[0].rotation.x = 90 * (PI/180)

    // right
    boxesArray[1].position.set(HALF_WALL_SIZE, 0, -HALF_WALL_SIZE)
    boxesArray[1].rotation.y = -90 * (PI/180)

    // front
    boxesArray[2].position.set(0, -HALF_WALL_SIZE, -HALF_WALL_SIZE)
    boxesArray[2].rotation.x = -90 * (PI/180)

    // left
    boxesArray[3].position.set(-HALF_WALL_SIZE, 0, -HALF_WALL_SIZE)
    boxesArray[3].rotation.y = 90 * (PI/180)

    // bottom
    boxesArray[4].position.set(0, 0, -WALL_SIZE)

    boxesArray.forEach(function(box) {
        box.name = 'box'
        parent.add(box)
    });
}

/* -- FLOOR -- */
function setupFloor(parent) {
    var i, tilesArray, geometry, material

    tilesArray = []
    geometry = new THREE.PlaneBufferGeometry(WALL_SIZE, WALL_SIZE)
    material = new THREE.MeshLambertMaterial({
        color : FLOOR_COLOR
    })

    for (i = 0; i < 8; i++) {
        tilesArray.push(new THREE.Mesh(geometry, material))
    }

    tilesArray[0].position.set(-WALL_SIZE, WALL_SIZE, 0)
    tilesArray[1].position.set(0, WALL_SIZE, 0)
    tilesArray[2].position.set(WALL_SIZE, WALL_SIZE, 0)
    tilesArray[3].position.set(-WALL_SIZE, 0, 0)
    tilesArray[4].position.set(WALL_SIZE, 0, 0)
    tilesArray[5].position.set(-WALL_SIZE, -WALL_SIZE, 0)
    tilesArray[6].position.set(0, -WALL_SIZE, 0)
    tilesArray[7].position.set(WALL_SIZE, -WALL_SIZE, 0)

    tilesArray.forEach(function(tile) {
        tile.receiveShadow = true
        tile.name = 'tile'
        parent.add(tile)
    })
}

/* -- CUBES --*/
function setupCubes(parent, projectData) {
    var geometry = new THREE.BoxBufferGeometry(CUBE_SIZE, CUBE_SIZE, 0.03)
    for (var i=0; i < projectData.projects.length; i++) {
        setupSingleProjectCubes(parent, projectData.projects[i], geometry)
    }
}

function setupSingleProjectCubes(parent, project, geometry) {
    

    var rowMaxProjects = 3
    var rowMaxCubes = 3
    var projectPosition = project.position
    var half_wall = (GRID * CUBE_SIZE) / 2
    var xOrigin =  (projectPosition % rowMaxProjects) * CUBE_SIZE * 3 - half_wall + (CUBE_SIZE/2)
    var yOrigin =  Math.floor(projectPosition/rowMaxProjects) * CUBE_SIZE * 2 + (CUBE_SIZE) * 4
    var offsetLookup = [
        {x: 0., y: 0.5 },
        {x: 0.333, y: 0.5 },
        {x: 0.666, y: 0.5},
        {x: 0., y: 0. },
        {x: 0.333, y: 0. },
        {x: 0.666, y: 0. },
    ]

    for (i = 0; i < 6; i++) {
        var texture_temp = new THREE.TextureLoader().load( project.imageUrl );
        texture_temp.repeat.set( 0.333, 0.5 );
        texture_temp.offset.set( offsetLookup[i].x, offsetLookup[i].y );
        

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
            new THREE.MeshStandardMaterial({
                map: texture_temp  // front
            }),
            new THREE.MeshStandardMaterial({
                // color: MAIN_COLOR // back
                map: drawTextAsTexture(project.blocks[i].text, project.blocks[i].horizontalFlip) //back
            })
        ]

        var cube = new THREE.Mesh(geometry, cubeMaterial )
        var x = xOrigin + (i % rowMaxCubes) * CUBE_SIZE
        var y = yOrigin - Math.floor(i/rowMaxCubes) * CUBE_SIZE
        cube.position.set(x, y, 0)
        cube.name = 'cube'
        // cube.castShadow = true;
        // cube.receiveShadow = true;
        
        if (debug) {
            cube.rotation.x = (Math.random() * 10)
        } else {
            cube.direction = (Math.random() < 0.5 ? -PI : PI)
            cube.attr = (project.blocks[i].horizontalFlip) ? 'y' : 'x'
        } 

        parent.add(cube)
    }
}

function drawTextAsTexture(text, horizontalFlip) {
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var x = canvas.width / 2;
    var y = canvas.height / 2;
    context.font = "40pt Calibri";
    context.textAlign = "center";
    context.fillStyle = "white";
    context.fillRect(0,0,512,512);
    context.fillStyle = "black";
    context.fillText(text, x, y);
    var texture = new THREE.Texture( canvas );
    texture.needsUpdate = true;

    return texture
}

function setupCubesOriginal(parent) {
    var i, geometry, material, x, y, row, col, attrOptions

    geometry = new THREE.BoxBufferGeometry(CUBE_SIZE, CUBE_SIZE, 0.03)
    x = 0
    y = 0
    row = 0
    col = 0
    attrOptions = ['x', 'y']

    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    var x = canvas.width / 2;
    var y = canvas.height / 2;
    context.font = "40pt Calibri";
    context.textAlign = "center";
    context.fillStyle = "white";
    context.fillRect(0,0,512,512);
    context.fillStyle = "black";
    context.fillText("Installation", x, y);
    var texture = new THREE.Texture( canvas );
    texture.needsUpdate = true;


    for (i = 0; i < TOTAL_CUBES; i++) {
        var texture_temp = new THREE.TextureLoader().load( 'https://images.squarespace-cdn.com/content/v1/54ca8eafe4b0c29072c27bec/1506672051343-K3IERQ5ISCOS4BXJRA23/ke17ZwdGBToddI8pDm48kAJsswp0EXV6qc0SOJ8DOsUUqsxRUqqbr1mOJYKfIPR7LoDQ9mXPOjoJoqy81S2I8N_N4V1vUb5AoIIIbLZhVYxCRW4BPu10St3TBAUQYVKc_E7dXkCi7l7eF32s1E_vQW45WD95yMX6bcbEP6L1pnbQgytvpF9JKWwbDEjqe30p/Equilibrium_Cover1000.jpg' );
        texture_temp.repeat.set( 0.333, 0.5 );
        texture_temp.offset.set( Math.random(), Math.random() );

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
            new THREE.MeshStandardMaterial({
                map: texture_temp  // front
            }),
            new THREE.MeshStandardMaterial({
                map: texture //back
            })
        ]

        cubes.push(new THREE.Mesh(geometry, cubeMaterial ))

        if ((i % GRID) === 0) {
            col = 1
            row++
        } else col++

        x = -(((GRID * CUBE_SIZE) / 2) - ((CUBE_SIZE) * col) + (CUBE_SIZE/2))
        y = -(((GRID * CUBE_SIZE) / 2) - ((CUBE_SIZE) * row) + (CUBE_SIZE/2))

        cubes[i].position.set(x, y, 0)
    }

    cubes.forEach(function(cube) {
        cube.castShadow = true
        cube.receiveShadow = true
        
        if (debug) {
            cube.rotation.x = (Math.random() * 10)
        } else {
            cube.direction = (Math.random() < 0.5 ? -PI : PI)
            cube.attr = attrOptions[~~(Math.random() * attrOptions.length)]
        } 
        cube.name = 'cube'
        // cube.castShadow = true;
        // cube.receiveShadow = true;
        parent.add(cube)
        
    })
}

function flipCube(cube) {
    var duration = 2
    var delay = duration

    var config = {
        ease : Elastic.easeOut,
        delay : 0,
        repeat : 0,
    }
    config[cube.attr] = cube.direction

    cube.flip = TweenMax.to(
        cube.rotation,
        duration,
        config
    )

    var config_reverse = {
        ease : Elastic.easeOut,
        delay : delay,
        repeat : 0,
    }
    config_reverse[cube.attr] = 0

    cube.flip_back = TweenMax.to(
        cube.rotation,
        duration,
        config_reverse
    )
}

/* -- LIGHTS -- */
function setupLights(parent) {
    var light, soft_light

    light = new THREE.DirectionalLight(LIGHT_COLOR, 1.5)
    soft_light = new THREE.DirectionalLight(LIGHT_COLOR, 1.)

    light.position.set(-WALL_SIZE, -WALL_SIZE, CUBE_SIZE * GRID)
    // light.castShadow = true

    
    soft_light.position.set(WALL_SIZE, WALL_SIZE, CUBE_SIZE * GRID)
    light.name = 'light'
    soft_light.name = 'soft_light'
    parent.add(light).add(soft_light)

    // const d = 1000;
    // light.shadow.mapSize.width = WALL_SIZE * 10  // default
    // light.shadow.mapSize.height = WALL_SIZE  * 10 // default
    // light.shadow.camera.near = 0.1    // default
    // light.shadow.camera.far = 2000    // default
    // light.shadow.camera.top = d;
    // light.shadow.camera.right = d;
    // light.shadow.camera.left = - d;
    // light.shadow.camera.bottom = - d;

    //Create a helper for the shadow camera (optional)
    // var helper = new THREE.CameraHelper( light.shadow.camera );
    // parent.add( helper );
}

/* -- RENDERER and Listener -- */

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

function setupRenderer(parent) {
    renderer.setSize(_width, _height)
    renderer.setClearColor(0xFFFFFF, 1.0)
    // renderer.shadowMap.enabled = true
    // renderer.shadowMap.type = THREE.PCFSoftShadowMap // default THREE.PCFShadowMap
    parent.appendChild(renderer.domElement)
}

function render() {
    // update the picking ray with the camera and mouse position
    raycaster.setFromCamera( mouse, camera )
    // calculate objects intersecting the picking ray
    var intersects = raycaster.intersectObjects( group.children );

    if ( intersects.length > 0 ) {

        if ( INTERSECTED != intersects[ 0 ].object ) {

            if ( INTERSECTED && INTERSECTED.name == 'cube') {
                INTERSECTED.flip_back.play()
                // INTERSECTED.material.color.set( INTERSECTED.currentHex )
            }
            // INTERSECTED.currentHex = INTERSECTED.material.color.getHex()
            // INTERSECTED.material.color.set( 0xff0000 )
            INTERSECTED = intersects[ 0 ].object
            if ( INTERSECTED.name == 'cube' ) {
                flipCube(INTERSECTED)
            }
        }
        else if ( INTERSECTED && INTERSECTED.name == 'cube') {
            if ( INTERSECTED.flip.progress() >= 1. ) INTERSECTED.flip_back.progress(0).pause
        }

    } else {
        INTERSECTED = null
        // if ( INTERSECTED ) INTERSECTED.material.color.set( INTERSECTED_COLOR );
    }

    renderer.render(scene, camera)
}

function updateCamera() {
    camera.position.y = CAMERA_START - window.scrollY * SCROLL_SPEED / 50.0
}



