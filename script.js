const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

function showToast(message) {
    let toast = document.querySelector(".toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.className = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => {
        toast.classList.remove("show");
    }, 1800);
}

function setupScrollProgress() {
    const progress = document.createElement("div");
    progress.className = "scroll-progress";
    document.body.appendChild(progress);

    const updateProgress = () => {
        const scrollTop = window.scrollY;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? (scrollTop / max) * 100 : 0;
        progress.style.width = `${Math.min(100, ratio)}%`;
    };

    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
}

function setupRevealAnimations() {
    const targets = document.querySelectorAll(
        ".section-header, .product-card, .feature-item, .about-grid > *, .value-card, .contact-form, .contact-item"
    );
    targets.forEach((el) => el.classList.add("reveal"));

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.1, rootMargin: "0px 0px -30px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
}

function setupHeroParallax() {
    const hero = document.querySelector(".hero");
    const heroContent = document.querySelector(".hero-content");
    if (!hero || !heroContent) return;

    hero.addEventListener("pointermove", (event) => {
        const rect = hero.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width - 0.5) * 10;
        const y = ((event.clientY - rect.top) / rect.height - 0.5) * 10;
        heroContent.style.transform = `translate(${x}px, ${y}px)`;
    });

    hero.addEventListener("pointerleave", () => {
        heroContent.style.transform = "translate(0, 0)";
    });
}

function setupProductMagnifier() {
    const target = document.querySelector(".main-image.magnify-target");
    if (!target) return;
    const img = target.querySelector("img");
    if (!img) return;

    const lens = document.createElement("div");
    lens.className = "magnify-lens";
    target.appendChild(lens);

    const zoom = 2.4;

    const moveLens = (event) => {
        const rect = target.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;

        const lensRect = lens.getBoundingClientRect();
        const lensW = lensRect.width;
        const lensH = lensRect.height;

        const clampedX = Math.max(0, Math.min(rect.width, x));
        const clampedY = Math.max(0, Math.min(rect.height, y));

        const bgW = rect.width * zoom;
        const bgH = rect.height * zoom;
        const rawBgX = -(clampedX * zoom - lensW / 2);
        const rawBgY = -(clampedY * zoom - lensH / 2);
        const minBgX = -(bgW - lensW);
        const minBgY = -(bgH - lensH);
        const bgPosX = Math.max(minBgX, Math.min(0, rawBgX));
        const bgPosY = Math.max(minBgY, Math.min(0, rawBgY));

        lens.style.left = `${x - lensW / 2}px`;
        lens.style.top = `${y - lensH / 2}px`;
        lens.style.backgroundImage = `url("${img.src}")`;
        lens.style.backgroundSize = `${bgW}px ${bgH}px`;
        lens.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
    };

    target.addEventListener("mouseenter", () => {
        lens.style.display = "block";
    });

    target.addEventListener("mousemove", moveLens);

    target.addEventListener("mouseleave", () => {
        lens.style.display = "none";
    });
}

let productsPromise;
async function loadProducts() {
    if (productsPromise) return productsPromise;
    productsPromise = (async () => {
    try {
        const response = await fetch("products.json", { cache: "no-store" });
        if (!response.ok) return [];
        return await response.json();
    } catch {
        return [];
    }
    })();
    return productsPromise;
}

async function setupDynamicProductPage() {
    if (!window.location.pathname.toLowerCase().endsWith("product.html")) return;
    const productList = await loadProducts();
    if (!productList.length) return;

    const productId = new URLSearchParams(window.location.search).get("p") || "1";
    const product = productList.find((item) => String(item.id) === productId) || productList[0];

    const h1 = document.querySelector(".product-info h1");
    const price = document.querySelector(".price-large");
    const desc = document.querySelector(".product-desc");
    const mainImg = document.querySelector(".main-image img");
    const thumbImgs = document.querySelectorAll(".thumb img");

    if (h1) h1.textContent = product.name;
    if (price) price.textContent = product.price;
    if (desc) desc.textContent = product.description;
    if (mainImg) {
        mainImg.src = product.image;
        mainImg.alt = product.name;
    }

    thumbImgs.forEach((imgEl, index) => {
        const src = product.thumbs?.[index] || product.image;
        imgEl.src = src;
        imgEl.alt = `${product.name} view ${index + 1}`;
    });

    const detailsList = document.querySelector(".product-details ul");
    if (detailsList && Array.isArray(product.details)) {
        detailsList.innerHTML = product.details.map((item) => `<li>${item}</li>`).join("");
    }

    const schemaTag = document.getElementById("productSchema");
    if (schemaTag) {
        schemaTag.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            image: [product.image],
            description: product.description,
            brand: { "@type": "Brand", name: "Sumana's Abaya" },
            offers: {
                "@type": "Offer",
                priceCurrency: "USD",
                price: product.price.replace("$", ""),
                availability: "https://schema.org/InStock"
            }
        });
    }
}

function optimizeImages() {
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
        if (!img.closest(".logo") && !img.closest(".hero")) {
            img.loading = "lazy";
        }
        img.decoding = "async";
    });
}

async function hydrateProductCards() {
    const products = await loadProducts();
    if (!products.length) return;
    const byId = new Map(products.map((p) => [String(p.id), p]));

    document.querySelectorAll(".shop-grid .product-card").forEach((card) => {
        const link = card.querySelector('a[href*="product.html?p="]');
        if (!link) return;
        const id = new URL(link.href).searchParams.get("p");
        const product = id ? byId.get(id) : null;
        if (!product) return;

        const img = card.querySelector(".product-image img");
        const h3 = card.querySelector("h3");
        const price = card.querySelector(".product-price");
        if (img) {
            img.src = product.image;
            img.alt = product.name;
        }
        if (h3) h3.textContent = product.name;
        if (price) price.textContent = product.price;
    });

    document.querySelectorAll('.product-grid .product-card[data-product-id]').forEach((card) => {
        const id = card.getAttribute("data-product-id");
        const product = id ? byId.get(id) : null;
        if (!product) return;
        const img = card.querySelector(".product-image img");
        const h3 = card.querySelector("h3");
        const price = card.querySelector(".product-price");
        if (img) {
            img.src = product.image;
            img.alt = product.name;
        }
        if (h3) h3.textContent = product.name;
        if (price) price.textContent = product.price;
    });
}

function setupScrollShiftSections() {
    const sections = document.querySelectorAll(
        ".hero, .section, .about-preview, .features, .newsletter, .page-header, .contact-section, .product-detail, .values"
    );
    if (!sections.length) return;

    const isTouchLike = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    sections.forEach((section) => section.classList.add("scroll-shift"));

    let ticking = false;

    const update = () => {
        const viewportH = window.innerHeight;

        sections.forEach((section) => {
            const rect = section.getBoundingClientRect();
            const sectionCenter = rect.top + rect.height / 2;
            const viewportCenter = viewportH / 2;
            const distance = sectionCenter - viewportCenter;
            const normalized = Math.max(-1, Math.min(1, distance / viewportH));
            const intensity = 1 - Math.min(1, Math.abs(normalized));

            const shiftY = normalized * (isTouchLike ? -10 : -24);
            const scale = (isTouchLike ? 0.99 : 0.97) + intensity * (isTouchLike ? 0.01 : 0.03);
            const opacity = (isTouchLike ? 0.9 : 0.72) + intensity * (isTouchLike ? 0.1 : 0.28);

            section.style.setProperty("--shift-y", `${shiftY.toFixed(2)}px`);
            section.style.setProperty("--shift-scale", scale.toFixed(3));
            section.style.setProperty("--shift-opacity", opacity.toFixed(3));
            section.classList.toggle("in-focus", intensity > 0.62);
        });

        ticking = false;
    };

    const requestTick = () => {
        if (!ticking) {
            ticking = true;
            window.requestAnimationFrame(update);
        }
    };

    window.addEventListener("scroll", requestTick, { passive: true });
    window.addEventListener("resize", requestTick);
    requestTick();
}

if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
        navLinks.classList.toggle("active");
        menuToggle.classList.toggle("active");
        document.body.classList.toggle("nav-open", navLinks.classList.contains("active"));
    });

    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", () => {
            navLinks.classList.remove("active");
            menuToggle.classList.remove("active");
            document.body.classList.remove("nav-open");
        });
    });
}

const filterBtns = document.querySelectorAll(".filter-btn");
const productCards = document.querySelectorAll(".shop-grid .product-card");

filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const filter = btn.getAttribute("data-filter");
        productCards.forEach((card) => {
            const isMatch = filter === "all" || card.getAttribute("data-category") === filter;
            if (isMatch) {
                card.style.display = "block";
                requestAnimationFrame(() => {
                    card.classList.remove("is-hiding");
                });
            } else {
                card.classList.add("is-hiding");
                window.setTimeout(() => {
                    card.style.display = "none";
                }, 220);
            }
        });
    });
});

let cartCount = 0;
const cartCountEl = document.querySelector(".cart-count");
const addToCartBtn = document.querySelector(".add-to-cart");
if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
        const qtyEl = document.getElementById("qtyValue");
        const qty = qtyEl ? parseInt(qtyEl.textContent, 10) : 1;
        cartCount += qty;
        if (cartCountEl) cartCountEl.textContent = String(cartCount);

        const originalLabel = addToCartBtn.textContent;
        addToCartBtn.textContent = "Added to Cart";
        showToast(`Added ${qty} item${qty > 1 ? "s" : ""} to cart`);
        window.setTimeout(() => {
            addToCartBtn.textContent = originalLabel;
        }, 1500);
    });
}

const increaseBtn = document.getElementById("increase");
const decreaseBtn = document.getElementById("decrease");
const qtyValue = document.getElementById("qtyValue");

if (increaseBtn && qtyValue) {
    increaseBtn.addEventListener("click", () => {
        qtyValue.textContent = String(parseInt(qtyValue.textContent, 10) + 1);
    });
}

if (decreaseBtn && qtyValue) {
    decreaseBtn.addEventListener("click", () => {
        const current = parseInt(qtyValue.textContent, 10);
        if (current > 1) qtyValue.textContent = String(current - 1);
    });
}

const sizeBtns = document.querySelectorAll(".size-btn");
sizeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        sizeBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
    });
});

const thumbs = document.querySelectorAll(".thumb");
const mainImage = document.querySelector(".main-image");
thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
        thumbs.forEach((t) => t.classList.remove("active"));
        thumb.classList.add("active");
        if (mainImage) {
            const mainImgEl = mainImage.querySelector("img");
            const thumbImgEl = thumb.querySelector("img");
            if (mainImgEl && thumbImgEl) {
                mainImgEl.src = thumbImgEl.src;
                mainImgEl.alt = thumbImgEl.alt.replace("view", "main view");
            }
            mainImage.style.transform = "scale(0.985)";
            window.setTimeout(() => {
                mainImage.style.transform = "scale(1)";
            }, 160);
        }
    });
});

const contactForm = document.getElementById("contactForm");
if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        showToast("Thanks. Your message has been sent.");
        contactForm.reset();
    });
}

const newsletterForms = document.querySelectorAll(".newsletter-form");
newsletterForms.forEach((form) => {
    form.addEventListener("submit", (event) => {
        event.preventDefault();
        showToast("You are subscribed.");
        form.reset();
    });
});

window.addEventListener("load", async () => {
    document.body.style.opacity = "1";
    await hydrateProductCards();
    await setupDynamicProductPage();
    optimizeImages();
    setupScrollProgress();
    setupRevealAnimations();
    setupHeroParallax();
    setupScrollShiftSections();
    setupProductMagnifier();
});
