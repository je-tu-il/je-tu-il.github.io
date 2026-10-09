const revealItems = document.querySelectorAll('.reveal');
const parallaxItems = document.querySelectorAll('[data-parallax]');
const sceneShell = document.querySelector('.scene-shell');

const revealObserver = new IntersectionObserver(
  function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  },
  { threshold: 0.12 }
);

revealItems.forEach(function (element) {
  revealObserver.observe(element);
});

const onScroll = function () {
  const scrollY = window.scrollY || window.pageYOffset;

  parallaxItems.forEach(function (element) {
    const rect = element.getBoundingClientRect();
    const center = rect.top + rect.height / 2;
    const offset = (window.innerHeight / 2 - center) * 0.08;
    const tilt = Math.min(10, Math.max(-10, offset * 0.6));
    element.style.transform = 'rotateX(8deg) rotateY(' + (tilt * -0.6) + 'deg) translateY(' + offset + 'px) scale(1.02)';
  });

  if (sceneShell) {
    const rect = sceneShell.getBoundingClientRect();
    const depth = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * 0.06;
    sceneShell.style.transform = 'rotateX(8deg) rotateY(' + (depth * -0.18) + 'deg) translateY(' + (depth * 0.2) + 'px) scale(1.02)';
  }

  const hero = document.querySelector('.hero');
  if (hero) {
    const heroBox = hero.getBoundingClientRect();
    const t = Math.max(-1, Math.min(1, heroBox.top / window.innerHeight));
    hero.style.filter = 'saturate(' + (1 + Math.abs(t) * 0.4) + ')';
  }
};

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

const container = document.getElementById('viewer');
const sceneStage = document.querySelector('.scene-shell');

if (sceneStage) {
  sceneStage.addEventListener('pointermove', function (event) {
    const rect = sceneStage.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const rotateY = (x - 0.5) * 18;
    const rotateX = (0.5 - y) * 16;
    sceneStage.style.transform = 'rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) translateY(0) scale(1.04)';
  });

  sceneStage.addEventListener('pointerleave', function () {
    sceneStage.style.transform = 'rotateX(8deg) rotateY(-8deg) translateY(0) scale(1.02)';
  });
}

if (container && window.THREE && window.THREE.STLLoader && window.THREE.OrbitControls) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c0f13);

  const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.set(0, 22, 78);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  container.appendChild(renderer.domElement);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 1.8;
  controls.enableZoom = true;
  controls.minDistance = 30;
  controls.maxDistance = 120;

  const hemi = new THREE.HemisphereLight(0xf6e4b7, 0x0c1117, 1.3);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(18, 28, 16);
  scene.add(key);

  const rim = new THREE.PointLight(0xf0d792, 2.2, 220);
  rim.position.set(0, 34, 28);
  scene.add(rim);

  const loader = new THREE.STLLoader();

  loader.load(
    './assets/lanterne.stl',
    function (geometry) {
      geometry.center();
      geometry.computeVertexNormals();

      const material = new THREE.MeshStandardMaterial({
        color: 0x1a1d21,
        metalness: 0.82,
        roughness: 0.24,
        envMapIntensity: 0.8
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.rotation.z = Math.PI * 0.12;
      mesh.position.y = 4;
      mesh.scale.set(1.22, 1.22, 1.22);
      scene.add(mesh);

      const halo = new THREE.Mesh(
        new THREE.TorusGeometry(30, 0.18, 16, 180),
        new THREE.MeshBasicMaterial({ color: 0xd4b36a, transparent: true, opacity: 0.5 })
      );
      halo.rotation.x = Math.PI / 2;
      halo.position.y = -12;
      scene.add(halo);
    },
    undefined,
    function () {
      const fallback = new THREE.Mesh(
        new THREE.CylinderGeometry(8, 10, 38, 28, 1, false),
        new THREE.MeshStandardMaterial({ color: 0x101214, metalness: 0.42, roughness: 0.5 })
      );
      fallback.position.y = 0;
      scene.add(fallback);
    }
  );

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(72, 64),
    new THREE.MeshStandardMaterial({ color: 0x13191d, metalness: 0.2, roughness: 0.9 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -18;
  scene.add(floor);

  function renderFrame() {
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(renderFrame);
  }

  renderFrame();

  window.addEventListener('resize', function () {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  });
}

const funnelState = {
  visits: 128,
  views: 84,
  interest: 31,
  orders: 12,
};

const bars = {
  visits: document.querySelector('.bar-1'),
  views: document.querySelector('.bar-2'),
  interest: document.querySelector('.bar-3'),
  orders: document.querySelector('.bar-4'),
};

const trackInteraction = function (key) {
  try {
    const state = JSON.parse(localStorage.getItem('stan-funnel') || '{}');
    state[key] = (state[key] || 0) + 1;
    localStorage.setItem('stan-funnel', JSON.stringify(state));
  } catch (error) {
    console.warn('Local tracking unavailable:', error);
  }
};

document.querySelectorAll('.button, a[href="#contact"]').forEach(function (button) {
  button.addEventListener('click', function () {
    trackInteraction('cta');
  });
});

if (bars.visits) {
  const updates = JSON.parse(localStorage.getItem('stan-funnel') || '{}');
  const multiplier = Math.max(1, (updates.cta || 0) + 1);
  bars.visits.style.width = Math.min(100, funnelState.visits / 1.28) + '%';
  bars.views.style.width = Math.min(100, funnelState.views / 1.28) + '%';
  bars.interest.style.width = Math.min(100, funnelState.interest / 1.28) + '%';
  bars.orders.style.width = Math.min(100, funnelState.orders / 1.28) + '%';
  bars.orders.style.filter = 'brightness(' + (1 + multiplier * 0.08) + ')';
}
