const logo = document.querySelector(".logo");
const counters = document.querySelectorAll(".count");
const carouselTrack = document.querySelector(".carousel-track");
const heroValues = document.querySelectorAll(".metric .value");

const setCSSVar = (name, value) => {
  document.documentElement.style.setProperty(name, value);
};

const getLuminance = ([r, g, b]) => {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
};

const mix = (c1, c2, ratio = 0.5) =>
  c1.map((v, i) => Math.round(v * (1 - ratio) + c2[i] * ratio));

const rgbToHex = ([r, g, b]) =>
  `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;

const kMeans = (pixels, k = 3) => {
  const centroids = pixels.slice(0, k).map((p) => [...p]);
  for (let iter = 0; iter < 6; iter++) {
    const clusters = Array.from({ length: k }, () => []);
    pixels.forEach((p) => {
      let best = 0;
      let bestDist = Infinity;
      centroids.forEach((c, i) => {
        const dist = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2 + (p[2] - c[2]) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      });
      clusters[best].push(p);
    });
    clusters.forEach((cluster, i) => {
      if (!cluster.length) return;
      const avg = cluster.reduce(
        (acc, cur) => [acc[0] + cur[0], acc[1] + cur[1], acc[2] + cur[2]],
        [0, 0, 0]
      );
      centroids[i] = avg.map((v) => Math.round(v / cluster.length));
    });
  }
  return centroids;
};

const applyPaletteFromLogo = async () => {
  if (!logo) return;

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = logo.getAttribute("src");

  await img.decode();

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const size = 120;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  const pixels = [];
  for (let i = 0; i < data.length; i += 16) {
    const alpha = data[i + 3];
    if (alpha < 200) continue;
    pixels.push([data[i], data[i + 1], data[i + 2]]);
  }

  if (!pixels.length) return;

  const palette = kMeans(pixels, 3).sort((a, b) => getLuminance(b) - getLuminance(a));
  const [primary, secondary, accent] = palette;
  const darkBase = [10, 13, 22];
  let bg = mix(primary, darkBase, 0.7);
  if (getLuminance(bg) > 0.4) {
    bg = mix(primary, darkBase, 0.85);
  }
  const text = [247, 247, 251];

  setCSSVar("--primary", rgbToHex(primary));
  setCSSVar("--secondary", rgbToHex(secondary));
  setCSSVar("--accent", rgbToHex(accent || secondary));
  setCSSVar("--bg", rgbToHex(bg));
  setCSSVar("--text", rgbToHex(text));
};

applyPaletteFromLogo();

const animateCounters = (elements) => {
  elements.forEach((el) => {
    const target = Number(el.dataset.count || 0);
    let current = 0;
    const step = Math.max(1, Math.floor(target / 50));
    const tick = () => {
      current += step;
      if (current >= target) {
        el.textContent = target.toString();
        return;
      }
      el.textContent = current.toString();
      requestAnimationFrame(tick);
    };
    tick();
  });
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounters([entry.target]);
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.6 }
);

counters.forEach((counter) => observer.observe(counter));

heroValues.forEach((value) => animateCounters([value]));

let currentSlide = 0;
const testimonials = carouselTrack ? Array.from(carouselTrack.children) : [];

const updateCarousel = () => {
  if (!testimonials.length) return;
  currentSlide = (currentSlide + 1) % testimonials.length;
  testimonials.forEach((slide, index) => {
    slide.classList.toggle("is-active", index === currentSlide);
  });
};

setInterval(updateCarousel, 6000);
