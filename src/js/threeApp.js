import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, currentModel;
let mixer, animations;
let clock = new THREE.Clock();
let colorTransitionActive = false;
let colorTransitionDuration = 3.0;
let colorTransitionProgress = 0;
let colorTransitionMeshes = [];

export function initThreeJS() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth * 0.7 / (window.innerHeight - 120), 0.1, 1000);
    camera.position.z = 5;

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth * 0.7, window.innerHeight - 120);
    document.getElementById('model-container').appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Handle window resize
    window.addEventListener('resize', onWindowResize);

    // Load the lung model automatically
    loadModel('/src/assets/1.glb');

    // Start animation loop
    animate();
}

export function loadModel(modelPath) {
    if (currentModel) {
        scene.remove(currentModel);
    }

    if (mixer) {
        mixer = null;
    }

    const loader = new GLTFLoader();
    loader.load(
        modelPath,
        (gltf) => {
            currentModel = gltf.scene;
            scene.add(currentModel);

            // Center and scale model
            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            currentModel.position.x = -center.x;
            currentModel.position.y = -center.y - 1.5;
            currentModel.position.z = -center.z;

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 6.0 / maxDim;
            currentModel.scale.set(scale, scale, scale);

            // Store all meshes and their original materials
            prepareMeshesForTransition();

            // Set up animation mixer
            if (gltf.animations && gltf.animations.length > 0) {
                animations = gltf.animations;
                mixer = new THREE.AnimationMixer(currentModel);

                // Play the first animation by default
                const action = mixer.clipAction(animations[0]);
                action.play();
                mixer.timeScale = 1.0;
            }
        },
        undefined,
        (error) => {
            console.error('Error loading model:', error);
        }
    );
}

function prepareMeshesForTransition() {
    colorTransitionMeshes = [];

    if (!currentModel) return;

    currentModel.traverse(function(child) {
        if (child.isMesh && child.material) {
            // Clone the material
            if (Array.isArray(child.material)) {
                child.material = child.material.map(mat => mat.clone());
            } else {
                child.material = child.material.clone();
            }

            // Store original color with transition properties
            if (!child.userData.originalMaterial) {
                child.userData.originalMaterial = {
                    color: child.material.color ? child.material.color.clone() : new THREE.Color(1, 1, 1),
                    transitionDelay: Math.random() * 0.8,
                    transitionSpeed: 0.3 + Math.random() * 0.7
                };
            }

            colorTransitionMeshes.push(child);
        }
    });
}

export function loadDrugModel(drugName) {
    loadModel('/src/assets/1.glb');

    setTimeout(() => {
        applyDrugEffect(drugName);
    }, 500);
}

function applyDrugEffect(drugName) {
    if (!currentModel) return;

    resetDrugEffects();

    switch(drugName) {
        case 'albuterol':
            startColorTransition(new THREE.Color(1.0, 0.1, 0.6), 5.0);
            setBreathingSpeed(1.2);
            break;
        case 'budesonide':
            startColorTransition(new THREE.Color(0.9, 0.5, 0.5), 8.0);
            setBreathingSpeed(1.0);
            break;
        case 'prednisone':
            startColorTransition(new THREE.Color(0.9, 0.6, 0.6), 6.0);
            setBreathingSpeed(0.95);
            break;
        case 'epinephrine':
            startColorTransition(new THREE.Color(0.8, 0.8, 0.9), 3.0);
            setBreathingSpeed(1.5);
            break;
        case 'morphine':
            startColorTransition(new THREE.Color(0.4, 0.6, 0.8), 7.0);
            setBreathingSpeed(0.5);
            break;
        case 'cisplatin':
            startPatchyColorTransition([
                new THREE.Color(0.7, 0.7, 0.7),
                new THREE.Color(0.8, 0.6, 0.6)
            ], 10.0);
            setBreathingSpeed(0.8);
            break;
        case 'isoniazid':
            startPatchyColorTransition([
                new THREE.Color(0.5, 0.3, 0.3),
                new THREE.Color(0.7, 0.5, 0.5)
            ], 8.0);
            setBreathingSpeed(0.9);
            break;
        case 'saline':
            startColorTransition(new THREE.Color(1.0, 0.7, 0.8), 4.0);
            setBreathingSpeed(1.0);
            break;
        case 'nicotine':
            startColorTransition(new THREE.Color(0.9, 0.4, 0.4), 6.0);
            setBreathingSpeed(1.3);
            setTimeout(() => setBreathingSpeed(0.7), 6000);
            break;
        case 'antihistamines':
            startColorTransition(new THREE.Color(0.9, 0.85, 0.8), 9.0);
            setBreathingSpeed(0.9);
            break;
        default:
            break;
    }
}

function startColorTransition(targetColor, duration = 5.0) {
    colorTransitionActive = false;

    if (colorTransitionMeshes.length === 0) {
        prepareMeshesForTransition();
    }

    colorTransitionMeshes.forEach(mesh => {
        if (mesh.material) {
            const variedTarget = targetColor.clone();
            variedTarget.r += (Math.random() - 0.5) * 0.1;
            variedTarget.g += (Math.random() - 0.5) * 0.1;
            variedTarget.b += (Math.random() - 0.5) * 0.1;

            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                    if (mat.color) {
                        mat.userData = mat.userData || {};
                        mat.userData.transitionStartColor = mat.color.clone();
                        mat.userData.transitionEndColor = variedTarget.clone();
                        mat.userData.transitionProgress = 0;
                    }
                });
            } else if (mesh.material.color) {
                mesh.userData.transitionStartColor = mesh.material.color.clone();
                mesh.userData.transitionEndColor = variedTarget.clone();
                mesh.userData.transitionProgress = 0;
            }
        }
    });

    colorTransitionActive = true;
    colorTransitionDuration = duration;
}

function startPatchyColorTransition(targetColors, duration = 5.0) {
    colorTransitionActive = false;

    if (colorTransitionMeshes.length === 0) {
        prepareMeshesForTransition();
    }

    colorTransitionMeshes.forEach(mesh => {
        if (mesh.material) {
            const baseColor = targetColors[Math.floor(Math.random() * targetColors.length)];
            const variedColor = baseColor.clone();
            variedColor.r += (Math.random() - 0.5) * 0.15;
            variedColor.g += (Math.random() - 0.5) * 0.15;
            variedColor.b += (Math.random() - 0.5) * 0.15;

            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                    if (mat.color) {
                        mat.userData = mat.userData || {};
                        mat.userData.transitionStartColor = mat.color.clone();
                        mat.userData.transitionEndColor = variedColor.clone();
                        mat.userData.transitionProgress = 0;
                    }
                });
            } else if (mesh.material.color) {
                mesh.userData.transitionStartColor = mesh.material.color.clone();
                mesh.userData.transitionEndColor = variedColor.clone();
                mesh.userData.transitionProgress = 0;
            }
        }
    });

    colorTransitionActive = true;
    colorTransitionDuration = duration;
}

function updateColorTransition(deltaTime) {
    if (!colorTransitionActive) return;

    let allComplete = true;

    colorTransitionMeshes.forEach(mesh => {
        if (mesh.material) {
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                    if (mat.userData && mat.userData.transitionStartColor && mat.userData.transitionEndColor) {
                        if (mat.userData.transitionDelay > 0) {
                            mat.userData.transitionDelay -= deltaTime;
                            allComplete = false;
                        } else {
                            const speedFactor = mesh.userData.originalMaterial?.transitionSpeed || 1.0;
                            mat.userData.transitionProgress += (deltaTime / colorTransitionDuration) * speedFactor;

                            if (mat.userData.transitionProgress < 1.0) {
                                allComplete = false;
                                applyInterpolatedColor(mat.color, mat.userData.transitionStartColor, mat.userData.transitionEndColor, mat.userData.transitionProgress);
                            }
                        }
                    }
                });
            } else if (mesh.userData.transitionStartColor && mesh.userData.transitionEndColor && mesh.material.color) {
                if (mesh.userData.originalMaterial?.transitionDelay > 0) {
                    mesh.userData.originalMaterial.transitionDelay -= deltaTime;
                    allComplete = false;
                } else {
                    const speedFactor = mesh.userData.originalMaterial?.transitionSpeed || 1.0;
                    mesh.userData.transitionProgress += (deltaTime / colorTransitionDuration) * speedFactor;

                    if (mesh.userData.transitionProgress < 1.0) {
                        allComplete = false;
                        applyInterpolatedColor(mesh.material.color, mesh.userData.transitionStartColor, mesh.userData.transitionEndColor, mesh.userData.transitionProgress);
                    }
                }
            }
        }
    });

    if (allComplete) {
        colorTransitionActive = false;
    }
}

function applyInterpolatedColor(targetColorObj, startColor, endColor, progress) {
    const smoothProgress = progress * progress * (3 - 2 * progress);
    targetColorObj.r = startColor.r + (endColor.r - startColor.r) * smoothProgress;
    targetColorObj.g = startColor.g + (endColor.g - startColor.g) * smoothProgress;
    targetColorObj.b = startColor.b + (endColor.b - startColor.b) * smoothProgress;
}

function setBreathingSpeed(multiplier) {
    if (mixer) {
        mixer.timeScale = multiplier;
    }
}

function resetDrugEffects() {
    colorTransitionActive = false;

    if (!currentModel) return;

    currentModel.traverse(function(child) {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                child.material.forEach((mat, index) => {
                    if (child.userData.originalMaterial && child.userData.originalMaterial.color) {
                        mat.color.copy(child.userData.originalMaterial.color);
                    }
                });
            } else if (child.userData.originalMaterial && child.userData.originalMaterial.color) {
                child.material.color.copy(child.userData.originalMaterial.color);
            }
        }
    });

    if (mixer) {
        mixer.timeScale = 1.0;
    }
}

function onWindowResize() {
    camera.aspect = (window.innerWidth * 0.7) / (window.innerHeight - 120);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth * 0.7, window.innerHeight - 120);
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();

    if (mixer) {
        mixer.update(delta);
    }

    if (colorTransitionActive) {
        updateColorTransition(delta);
    }

    renderer.render(scene, camera);
}