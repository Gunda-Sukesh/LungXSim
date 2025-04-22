import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, currentModel;
let mixer, animations;
let clock = new THREE.Clock();
let colorTransitionActive = false;
let colorTransitionDuration = 8.0; // Base duration for initial transition
let colorTransitionMeshes = [];
let spreadingInProgress = false;
let spreadingQueue = []; // Queue to track meshes that will spread next

export function initThreeJS() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth * 0.7 / (window.innerHeight - 120), 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth * 0.7, window.innerHeight - 120);
    document.getElementById('model-container').appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    window.addEventListener('resize', onWindowResize);

    loadModel('/public/assets/1.glb');

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

            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            currentModel.position.x = -center.x;
            currentModel.position.y = -center.y - 1.5;
            currentModel.position.z = -center.z;

            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 6.0 / maxDim;
            currentModel.scale.set(scale, scale, scale);

            prepareMeshesForTransition();
            buildMeshConnectivityGraph();

            if (gltf.animations && gltf.animations.length > 0) {
                animations = gltf.animations;
                mixer = new THREE.AnimationMixer(currentModel);
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

// Build a graph of mesh connectivity based on proximity
function buildMeshConnectivityGraph() {
    if (!currentModel) return;

    // First collect all meshes with their positions
    const meshPositions = [];

    currentModel.traverse(function(child) {
        if (child.isMesh) {
            // Get world position of the mesh
            const position = new THREE.Vector3();
            child.getWorldPosition(position);

            // Store mesh and its position
            meshPositions.push({
                mesh: child,
                position: position
            });

            // Initialize neighbors array
            child.userData.neighbors = [];
        }
    });

    // Calculate connections based on proximity
    const proximityThreshold = 1.0; // Adjust based on your model scale

    for (let i = 0; i < meshPositions.length; i++) {
        const meshA = meshPositions[i];

        for (let j = 0; j < meshPositions.length; j++) {
            if (i === j) continue;

            const meshB = meshPositions[j];
            const distance = meshA.position.distanceTo(meshB.position);

            if (distance < proximityThreshold) {
                meshA.mesh.userData.neighbors.push(meshB.mesh);
            }
        }
    }
}

function prepareMeshesForTransition() {
    colorTransitionMeshes = [];

    if (!currentModel) return;

    currentModel.traverse(function(child) {
        if (child.isMesh && child.material) {
            if (Array.isArray(child.material)) {
                child.material = child.material.map(mat => mat.clone());
            } else {
                child.material = child.material.clone();
            }

            if (!child.userData.originalMaterial) {
                child.userData.originalMaterial = {
                    color: child.material.color ? child.material.color.clone() : new THREE.Color(1, 1, 1),
                    transitionDelay: Math.random() * 4.0,
                    transitionSpeed: 0.6 + Math.random() * 0.3
                };
            }

            // Initialize infection state
            child.userData.infected = false;
            child.userData.infectionProgress = 0;
            child.userData.infectionComplete = false;

            colorTransitionMeshes.push(child);
        }
    });
}

export function loadDrugModel(drugName, dosageValue = 1.0) {
    loadModel('/public/assets/1.glb');

    setTimeout(() => {
        applyDrugEffect(drugName, dosageValue);
    }, 500);
}

function applyDrugEffect(drugName, dosageValue) {
    if (!currentModel) return;

    resetDrugEffects();

    const getDosageAdjustedColor = (baseColors, dosageValue) => {
        let color;
        if (dosageValue <= 0.7) {
            color = new THREE.Color(...baseColors.low);
        } else if (dosageValue <= 1.0) {
            color = new THREE.Color(...baseColors.medium);
        } else {
            color = new THREE.Color(...baseColors.high);
        }

        // Convert to HSL to ensure brightness
        const hsl = { h: 0, s: 0, l: 0 };
        color.getHSL(hsl);
        hsl.l = Math.max(0.5, hsl.l); // Prevent darkness
        color.setHSL(hsl.h, hsl.s, hsl.l);

        return color;
    };

    const drugColors = {
        albuterol: {
            low: [1.0, 0.6, 0.7],    // Light pink
            medium: [1.0, 0.5, 0.6], // Bright pink
            high: [1.0, 0.4, 0.5]    // Intense pink
        },
        budesonide: {
            low: [1.0, 0.8, 0.7],    // Pale peach
            medium: [1.0, 0.7, 0.6], // Soft peach
            high: [1.0, 0.6, 0.5]    // Warm peach
        },
        prednisone: {
            low: [1.0, 0.7, 0.7],    // Pale coral
            medium: [1.0, 0.6, 0.6], // Light coral
            high: [1.0, 0.5, 0.5]    // Rich coral
        },
        epinephrine: {
            low: [0.8, 0.6, 1.0],    // Soft purple
            medium: [0.6, 0.4, 1.0], // Vibrant purple
            high: [0.5, 0.3, 0.9]    // Deep purple
        },
        morphine: {
            low: [0.7, 0.75, 0.9],    // Soft pale blue
            medium: [0.5, 0.6, 0.8],  // Muted blue
            high: [0.4, 0.5, 0.7]     // Dusky blue-gray
        },
        cisplatin: {
            low: [[0.7, 0.7, 0.7], [0.9, 0.5, 0.5]],    // Gray/light red
            medium: [[0.6, 0.6, 0.6], [0.8, 0.4, 0.4]], // Gray/red
            high: [[0.5, 0.5, 0.5], [0.7, 0.3, 0.3]]    // Darker gray/red
        },
        isoniazid: {
            low: [[0.6, 0.5, 0.4], [0.8, 0.7, 0.6]],    // Light brown
            medium: [[0.5, 0.4, 0.3], [0.7, 0.6, 0.5]], // Brown
            high: [[0.4, 0.3, 0.2], [0.6, 0.5, 0.4]]    // Darker brown
        },
        saline: {
            low: [0.8, 0.9, 1.0],    // Very light blue
            medium: [0.7, 0.8, 1.0], // Light blue
            high: [0.6, 0.7, 0.9]    // Slightly deeper blue
        },
        nicotine: {
            low: [0.95, 0.75, 0.75],    // Pale pinkish
            medium: [0.85, 0.55, 0.55], // Muted rose
            high: [0.75, 0.4, 0.4]      // Dusky red
        },
        antihistamines: {
            low: [1.0, 0.9, 0.9],    // Very pale pink
            medium: [1.0, 0.8, 0.8], // Pale pink
            high: [1.0, 0.7, 0.7]    // Soft pink
        }
    };

    let transitionDuration;
    let targetColor;

    switch(drugName) {
        case 'albuterol':
            targetColor = getDosageAdjustedColor(drugColors.albuterol, dosageValue);
            setBreathingSpeed(1.2 + dosageValue * 0.4);
            transitionDuration = 8.0;
            break;
        case 'budesonide':
            targetColor = getDosageAdjustedColor(drugColors.budesonide, dosageValue);
            setBreathingSpeed(1.0 + dosageValue * 0.1);
            transitionDuration = 10.0;
            break;
        case 'prednisone':
            targetColor = getDosageAdjustedColor(drugColors.prednisone, dosageValue);
            setBreathingSpeed(1.0);
            transitionDuration = 9.0;
            break;
        case 'epinephrine':
            targetColor = getDosageAdjustedColor(drugColors.epinephrine, dosageValue);
            setBreathingSpeed(1.3 + dosageValue * 0.5);
            transitionDuration = 7.0;
            break;
        case 'morphine':
            targetColor = getDosageAdjustedColor(drugColors.morphine, dosageValue);
            setBreathingSpeed(0.7 - dosageValue * 0.3);
            transitionDuration = 12.0;
            break;
        case 'cisplatin':
            targetColor = new THREE.Color(...drugColors.cisplatin[dosageValue <= 0.7 ? 'low' : dosageValue <= 1.0 ? 'medium' : 'high'][0]);
            setBreathingSpeed(0.9 - dosageValue * 0.2);
            transitionDuration = 14.0;
            break;
        case 'isoniazid':
            targetColor = new THREE.Color(...drugColors.isoniazid[dosageValue <= 0.7 ? 'low' : dosageValue <= 1.0 ? 'medium' : 'high'][0]);
            setBreathingSpeed(1.0 + dosageValue * 0.05);
            transitionDuration = 13.0;
            break;
        case 'saline':
            targetColor = getDosageAdjustedColor(drugColors.saline, dosageValue);
            setBreathingSpeed(1.0);
            transitionDuration = 8.0;
            break;
        case 'nicotine':
            targetColor = getDosageAdjustedColor(drugColors.nicotine, dosageValue);
            setBreathingSpeed(1.1 + dosageValue * 0.3);
            setTimeout(() => setBreathingSpeed(0.8 - dosageValue * 0.2), 7000);
            transitionDuration = 10.0;
            break;
        case 'antihistamines':
            targetColor = getDosageAdjustedColor(drugColors.antihistamines, dosageValue);
            setBreathingSpeed(0.9 - dosageValue * 0.1);
            transitionDuration = 11.0;
            break;
        default:
            return;
    }

    startBacterialSpreadColorTransition(targetColor, transitionDuration);

    // We're no longer reverting color after a timeout
    // The color will spread throughout the model and stay
}

function startBacterialSpreadColorTransition(targetColor, duration) {
    colorTransitionActive = true;
    colorTransitionDuration = duration;
    spreadingInProgress = true;

    if (colorTransitionMeshes.length === 0) {
        prepareMeshesForTransition();
        buildMeshConnectivityGraph();
    }

    // Reset all meshes' infection state
    colorTransitionMeshes.forEach(mesh => {
        mesh.userData.infected = false;
        mesh.userData.infectionProgress = 0;
        mesh.userData.infectionComplete = false;
    });

    // Choose random initial infection points (1-3 points)
    const initialInfectionCount = Math.floor(Math.random() * 3) + 1;
    const initialInfectionPoints = [];

    // Select random meshes for initial infection
    while (initialInfectionPoints.length < initialInfectionCount && initialInfectionPoints.length < colorTransitionMeshes.length) {
        const randomIndex = Math.floor(Math.random() * colorTransitionMeshes.length);
        const selectedMesh = colorTransitionMeshes[randomIndex];

        // Ensure we don't select the same mesh twice
        if (!initialInfectionPoints.includes(selectedMesh)) {
            initialInfectionPoints.push(selectedMesh);
        }
    }

    // Mark initial infection points
    initialInfectionPoints.forEach(mesh => {
        mesh.userData.infected = true;
        spreadingQueue.push(mesh);

        // Set up target color for this mesh with slight variation
        const variedColor = targetColor.clone();
        variedColor.r = Math.min(1.0, variedColor.r + (Math.random() - 0.5) * 0.08);
        variedColor.g = Math.min(1.0, variedColor.g + (Math.random() - 0.5) * 0.08);
        variedColor.b = Math.min(1.0, variedColor.b + (Math.random() - 0.5) * 0.08);

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
    });
}

function updateBacterialSpread(deltaTime) {
    if (!spreadingInProgress) return;

    const newlyInfectedMeshes = [];

    // Process currently infected meshes
    colorTransitionMeshes.forEach(mesh => {
        if (mesh.userData.infected && !mesh.userData.infectionComplete) {
            // Update infection progress
            const speedFactor = mesh.userData.originalMaterial?.transitionSpeed || 1.0;
            mesh.userData.infectionProgress += (deltaTime / colorTransitionDuration) * speedFactor * 2;

            // Update color based on infection progress
            if (mesh.material) {
                if (Array.isArray(mesh.material)) {
                    mesh.material.forEach(mat => {
                        if (mat.color && mat.userData?.transitionStartColor && mat.userData?.transitionEndColor) {
                            applyInterpolatedColor(
                                mat.color,
                                mat.userData.transitionStartColor,
                                mat.userData.transitionEndColor,
                                mesh.userData.infectionProgress
                            );
                        }
                    });
                } else if (mesh.material.color && mesh.userData.transitionStartColor && mesh.userData.transitionEndColor) {
                    applyInterpolatedColor(
                        mesh.material.color,
                        mesh.userData.transitionStartColor,
                        mesh.userData.transitionEndColor,
                        mesh.userData.infectionProgress
                    );
                }
            }

            // Check if infection is complete for this mesh
            if (mesh.userData.infectionProgress >= 1.0) {
                mesh.userData.infectionComplete = true;

                // Spread to neighbors
                if (mesh.userData.neighbors && mesh.userData.neighbors.length > 0) {
                    mesh.userData.neighbors.forEach(neighborMesh => {
                        // Check if neighbor is not already infected
                        if (!neighborMesh.userData.infected) {
                            // Random chance to infect (70-90% chance)
                            if (Math.random() < 0.8) {
                                neighborMesh.userData.infected = true;
                                newlyInfectedMeshes.push(neighborMesh);
                            }
                        }
                    });
                }
            }
        }
    });

    // Set up newly infected meshes with target colors
    newlyInfectedMeshes.forEach(mesh => {
        // Find a parent that infected this mesh (random selection if multiple)
        const infectedNeighbors = mesh.userData.neighbors.filter(n => n.userData.infectionComplete);

        if (infectedNeighbors.length > 0) {
            const parentMesh = infectedNeighbors[Math.floor(Math.random() * infectedNeighbors.length)];
            let targetColor;

            // Get parent's target color
            if (Array.isArray(parentMesh.material)) {
                const mat = parentMesh.material[0];
                targetColor = mat.userData?.transitionEndColor || new THREE.Color(1, 1, 1);
            } else {
                targetColor = parentMesh.userData.transitionEndColor || new THREE.Color(1, 1, 1);
            }

            // Apply slight variation to the color
            const variedColor = targetColor.clone();
            variedColor.r = Math.min(1.0, Math.max(0, variedColor.r + (Math.random() - 0.5) * 0.1));
            variedColor.g = Math.min(1.0, Math.max(0, variedColor.g + (Math.random() - 0.5) * 0.1));
            variedColor.b = Math.min(1.0, Math.max(0, variedColor.b + (Math.random() - 0.5) * 0.1));

            // Set up transition colors
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

    // Check if spreading is complete
    const allComplete = colorTransitionMeshes.every(mesh =>
        !mesh.userData.infected || mesh.userData.infectionComplete
    );

    if (allComplete && newlyInfectedMeshes.length === 0) {
        spreadingInProgress = false;
    }
}

function applyInterpolatedColor(targetColorObj, startColor, endColor, progress) {
    // Use sigmoid function for smooth transition
    const smoothProgress = 1 / (1 + Math.exp(-12 * (progress - 0.5)));
    targetColorObj.r = startColor.r + (endColor.r - startColor.r) * smoothProgress;
    targetColorObj.g = startColor.g + (endColor.g - startColor.g) * smoothProgress;
    targetColorObj.b = startColor.b + (endColor.b - startColor.b) * smoothProgress;
}

function setBreathingSpeed(multiplier) {
    if (mixer) {
        mixer.timeScale = Math.max(0.2, Math.min(2.0, multiplier));
    }
}

function resetDrugEffects() {
    colorTransitionActive = false;
    spreadingInProgress = false;
    spreadingQueue = [];

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

            // Reset infection state
            child.userData.infected = false;
            child.userData.infectionProgress = 0;
            child.userData.infectionComplete = false;
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

    if (spreadingInProgress) {
        updateBacterialSpread(delta);
    }

    renderer.render(scene, camera);
}