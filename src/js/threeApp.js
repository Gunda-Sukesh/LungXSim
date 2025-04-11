import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, currentModel;
let mixer, animations;
let clock = new THREE.Clock();
let colorTransitionActive = false;
let colorTransitionDuration = 8.0; // Base duration for initial transition
let colorTransitionMeshes = [];

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

    loadModel('/src/assets/1.glb');

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

            colorTransitionMeshes.push(child);
        }
    });
}

export function loadDrugModel(drugName, dosageValue = 1.0) {
    loadModel('/src/assets/1.glb');

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
            low: [0.5, 0.6, 0.9],    // Light blue
            medium: [0.3, 0.4, 0.8], // Deep blue
            high: [0.2, 0.3, 0.7]    // Darker blue
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
            low: [0.9, 0.5, 0.5],    // Light red
            medium: [0.8, 0.3, 0.3], // Dark red
            high: [0.7, 0.2, 0.2]    // Intense red
        },
        antihistamines: {
            low: [1.0, 0.9, 0.9],    // Very pale pink
            medium: [1.0, 0.8, 0.8], // Pale pink
            high: [1.0, 0.7, 0.7]    // Soft pink
        }
    };

    let transitionDuration;
    switch(drugName) {
        case 'albuterol':
            startSpottedColorTransition(getDosageAdjustedColor(drugColors.albuterol, dosageValue), 8.0);
            setBreathingSpeed(1.2 + dosageValue * 0.4);
            transitionDuration = 8.0;
            break;
        case 'budesonide':
            startSpottedColorTransition(getDosageAdjustedColor(drugColors.budesonide, dosageValue), 10.0);
            setBreathingSpeed(1.0 + dosageValue * 0.1);
            transitionDuration = 10.0;
            break;
        case 'prednisone':
            startSpottedColorTransition(getDosageAdjustedColor(drugColors.prednisone, dosageValue), 9.0);
            setBreathingSpeed(1.0);
            transitionDuration = 9.0;
            break;
        case 'epinephrine':
            startSpottedColorTransition(getDosageAdjustedColor(drugColors.epinephrine, dosageValue), 7.0);
            setBreathingSpeed(1.3 + dosageValue * 0.5);
            transitionDuration = 7.0;
            break;
        case 'morphine':
            startSpottedColorTransition(getDosageAdjustedColor(drugColors.morphine, dosageValue), 12.0);
            setBreathingSpeed(0.7 - dosageValue * 0.3);
            transitionDuration = 12.0;
            break;
        case 'cisplatin':
            startSpottedPatchyColorTransition(
                drugColors.cisplatin[dosageValue <= 0.7 ? 'low' : dosageValue <= 1.0 ? 'medium' : 'high'],
                14.0
            );
            setBreathingSpeed(0.9 - dosageValue * 0.2);
            transitionDuration = 14.0;
            break;
        case 'isoniazid':
            startSpottedPatchyColorTransition(
                drugColors.isoniazid[dosageValue <= 0.7 ? 'low' : dosageValue <= 1.0 ? 'medium' : 'high'],
                13.0
            );
            setBreathingSpeed(1.0 + dosageValue * 0.05);
            transitionDuration = 13.0;
            break;
        case 'saline':
            startSpottedColorTransition(getDosageAdjustedColor(drugColors.saline, dosageValue), 8.0);
            setBreathingSpeed(1.0);
            transitionDuration = 8.0;
            break;
        case 'nicotine':
            startSpottedColorTransition(getDosageAdjustedColor(drugColors.nicotine, dosageValue), 10.0);
            setBreathingSpeed(1.1 + dosageValue * 0.3);
            setTimeout(() => setBreathingSpeed(0.8 - dosageValue * 0.2), 7000);
            transitionDuration = 10.0;
            break;
        case 'antihistamines':
            startSpottedColorTransition(getDosageAdjustedColor(drugColors.antihistamines, dosageValue), 11.0);
            setBreathingSpeed(0.9 - dosageValue * 0.1);
            transitionDuration = 11.0;
            break;
        default:
            return;
    }

    // Revert color after 15 seconds
    setTimeout(() => {
        revertColorTransition(5.0); // 5-second fade back
        setBreathingSpeed(1.0); // Reset breathing speed
    }, 15000);
}

function startSpottedColorTransition(targetColor, duration) {
    colorTransitionActive = false;

    if (colorTransitionMeshes.length === 0) {
        prepareMeshesForTransition();
    }

    colorTransitionMeshes.forEach(mesh => {
        if (mesh.material) {
            const variedTarget = targetColor.clone();
            variedTarget.r = Math.min(1.0, variedTarget.r + (Math.random() - 0.5) * 0.05);
            variedTarget.g = Math.min(1.0, variedTarget.g + (Math.random() - 0.5) * 0.05);
            variedTarget.b = Math.min(1.0, variedTarget.b + (Math.random() - 0.5) * 0.05);

            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                    if (mat.color) {
                        mat.userData = mat.userData || {};
                        mat.userData.transitionStartColor = mat.color.clone();
                        mat.userData.transitionEndColor = variedTarget.clone();
                        mat.userData.transitionProgress = 0;
                        mat.userData.transitionDelay = mesh.userData.originalMaterial.transitionDelay;
                    }
                });
            } else if (mesh.material.color) {
                mesh.userData.transitionStartColor = mesh.material.color.clone();
                mesh.userData.transitionEndColor = variedTarget.clone();
                mesh.userData.transitionProgress = 0;
                mesh.userData.transitionDelay = mesh.userData.originalMaterial.transitionDelay;
            }
        }
    });

    colorTransitionActive = true;
    colorTransitionDuration = duration;
}

function startSpottedPatchyColorTransition(targetColors, duration) {
    colorTransitionActive = false;

    if (colorTransitionMeshes.length === 0) {
        prepareMeshesForTransition();
    }

    colorTransitionMeshes.forEach(mesh => {
        if (mesh.material) {
            const baseColor = targetColors[Math.floor(Math.random() * targetColors.length)];
            const variedColor = new THREE.Color(...baseColor);
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
                        mat.userData.transitionDelay = mesh.userData.originalMaterial.transitionDelay;
                    }
                });
            } else if (mesh.material.color) {
                mesh.userData.transitionStartColor = mesh.material.color.clone();
                mesh.userData.transitionEndColor = variedColor.clone();
                mesh.userData.transitionProgress = 0;
                mesh.userData.transitionDelay = mesh.userData.originalMaterial.transitionDelay;
            }
        }
    });

    colorTransitionActive = true;
    colorTransitionDuration = duration;
}

function revertColorTransition(duration) {
    colorTransitionActive = false;

    if (colorTransitionMeshes.length === 0) {
        prepareMeshesForTransition();
    }

    colorTransitionMeshes.forEach(mesh => {
        if (mesh.material) {
            const originalColor = mesh.userData.originalMaterial.color.clone();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(mat => {
                    if (mat.color) {
                        mat.userData = mat.userData || {};
                        mat.userData.transitionStartColor = mat.color.clone();
                        mat.userData.transitionEndColor = originalColor.clone();
                        mat.userData.transitionProgress = 0;
                        mat.userData.transitionDelay = mesh.userData.originalMaterial.transitionDelay;
                    }
                });
            } else if (mesh.material.color) {
                mesh.userData.transitionStartColor = mesh.material.color.clone();
                mesh.userData.transitionEndColor = originalColor.clone();
                mesh.userData.transitionProgress = 0;
                mesh.userData.transitionDelay = mesh.userData.originalMaterial.transitionDelay;
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
                if (mesh.userData.transitionDelay > 0) {
                    mesh.userData.transitionDelay -= deltaTime;
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