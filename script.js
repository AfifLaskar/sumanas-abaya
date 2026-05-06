const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");
const CART_STORAGE_KEY = "sumanas_abaya_cart_v2";
const EMAILJS_PUBLIC_KEY = "aNn3bf0fTi3TYSn2r";
const EMAILJS_SERVICE_ID = "service_1mch35h";
const EMAILJS_TEMPLATE_ID = "template_60mr9uj";
const STORE_EMAIL = "sumonasabaya@gmail.com";
const DEFAULT_SHIPPING_COST = 70;

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

function formatMoney(value) {
    const amount = Number.isFinite(value) ? value : 0;
    return `Tk ${Math.round(amount).toLocaleString("en-US")}`;
}

function parseMoney(value) {
    if (typeof value === "number") return value;
    const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : 0;
}

function getCart() {
    try {
        const raw = window.localStorage.getItem(CART_STORAGE_KEY);
        const cart = raw ? JSON.parse(raw) : [];
        return Array.isArray(cart) ? cart : [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartCount();
}

function getCartCount(cart = getCart()) {
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
}

function getCartSubtotal(cart = getCart()) {
    return cart.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const quantity = Number(item.quantity) || 0;
        return sum + price * quantity;
    }, 0);
}

function getSelectedShippingCost() {
    const selected = document.querySelector('input[name="delivery_area"]:checked');
    const cost = selected ? Number(selected.getAttribute("data-shipping-cost")) : DEFAULT_SHIPPING_COST;
    return Number.isFinite(cost) ? cost : DEFAULT_SHIPPING_COST;
}

function getSelectedShippingArea() {
    return document.querySelector('input[name="delivery_area"]:checked')?.value || "Inside Dhaka";
}

function updateCartCount() {
    const count = getCartCount();
    document.querySelectorAll("[data-cart-count]").forEach((el) => {
        el.textContent = String(count);
    });
}

function makeCartItemKey(item) {
    return `${String(item.id)}::${String(item.size || "M")}`;
}

function addItemToCart(item) {
    const cart = getCart();
    const key = makeCartItemKey(item);
    const existing = cart.find((entry) => makeCartItemKey(entry) === key);

    if (existing) {
        existing.quantity += item.quantity;
    } else {
        cart.push(item);
    }

    saveCart(cart);
}

function removeCartItem(itemKey) {
    const cart = getCart().filter((item) => makeCartItemKey(item) !== itemKey);
    saveCart(cart);
    renderCheckoutPage();
}

function setCartItemQuantity(itemKey, quantity) {
    const cart = getCart();
    const item = cart.find((entry) => makeCartItemKey(entry) === itemKey);
    if (!item) return;

    item.quantity = Math.max(1, quantity);
    saveCart(cart);
    renderCheckoutPage();
}

function buildCartItemsText(cart) {
    if (!cart.length) return "No items in cart.";

    return cart
        .map((item, index) => {
            const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
            const sizeText = item.size ? ` (${item.size})` : "";
            return `${index + 1}. ${item.name} x${item.quantity}${sizeText} - ${formatMoney(lineTotal)}`;
        })
        .join("\n");
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
    window.currentProduct = product;

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
                priceCurrency: "BDT",
                price: product.price.replace(/[^0-9.]/g, ""),
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

const addToCartBtn = document.querySelector(".add-to-cart");
if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
        const qtyEl = document.getElementById("qtyValue");
        const selectedSize = document.querySelector(".size-btn.active")?.textContent?.trim() || "M";
        const qty = qtyEl ? parseInt(qtyEl.textContent, 10) : 1;
        const product = window.currentProduct || {};
        const productTitle = document.querySelector(".product-info h1")?.textContent?.trim() || product.name || "Selected item";
        const productPrice = parseMoney(document.querySelector(".price-large")?.textContent || product.price);
        const productImage = document.querySelector(".main-image img")?.src || product.image || "";
        const productId = String(product.id || new URLSearchParams(window.location.search).get("p") || productTitle);

        addItemToCart({
            id: productId,
            name: productTitle,
            price: productPrice,
            image: productImage,
            size: selectedSize,
            quantity: qty
        });

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

function renderCheckoutPage() {
    const itemsRoot = document.getElementById("checkoutItems");
    const emptyState = document.getElementById("checkoutEmptyState");
    const form = document.getElementById("checkoutForm");
    const subtotalEl = document.getElementById("checkoutSubtotal");
    const shippingEl = document.getElementById("checkoutShipping");
    const totalEl = document.getElementById("checkoutTotal");
    const countEl = document.getElementById("checkoutCount");
    const submitBtn = document.getElementById("checkoutSubmit");
    const clearBtn = document.getElementById("clearCartBtn");

    if (!itemsRoot && !form) return;

    const cart = getCart();
    const count = getCartCount(cart);
    const subtotal = getCartSubtotal(cart);
    const shipping = cart.length ? getSelectedShippingCost() : 0;
    const total = subtotal + shipping;

    updateCartCount();

    if (countEl) countEl.textContent = String(count);
    if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
    if (shippingEl) shippingEl.textContent = formatMoney(shipping);
    if (totalEl) totalEl.textContent = formatMoney(total);

    if (itemsRoot) {
        itemsRoot.innerHTML = "";

        if (!cart.length) {
            if (emptyState) emptyState.hidden = false;
            if (form) form.querySelectorAll("input, textarea, button").forEach((field) => {
                if (field.id !== "continueShoppingBtn") {
                    field.disabled = true;
                }
            });
            return;
        }

        if (emptyState) emptyState.hidden = true;
        if (form) form.querySelectorAll("input, textarea, button").forEach((field) => {
            field.disabled = false;
        });

        cart.forEach((item) => {
            const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
            const row = document.createElement("div");
            row.className = "checkout-item";
            row.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div class="checkout-item-body">
                    <div class="checkout-item-top">
                        <div>
                            <h3>${item.name}</h3>
                            <p>${item.size ? `Size ${item.size}` : "One size"} • ${formatMoney(item.price)} each</p>
                        </div>
                        <button class="checkout-remove" type="button" data-remove-item="${makeCartItemKey(item)}">Remove</button>
                    </div>
                    <div class="checkout-item-bottom">
                        <div class="qty-stepper" data-qty-stepper="${makeCartItemKey(item)}">
                            <button type="button" data-qty-change="-1">−</button>
                            <span>${item.quantity}</span>
                            <button type="button" data-qty-change="1">+</button>
                        </div>
                        <strong>${formatMoney(lineTotal)}</strong>
                    </div>
                </div>
            `;
            itemsRoot.appendChild(row);
        });
    }

    if (clearBtn) {
        clearBtn.disabled = !cart.length;
    }
    if (submitBtn) {
        submitBtn.disabled = !cart.length;
    }
}

function initEmailJs() {
    if (!window.emailjs || typeof window.emailjs.init !== "function") return false;
    if (window.__emailJsInit) return true;
    window.emailjs.init(EMAILJS_PUBLIC_KEY);
    window.__emailJsInit = true;
    return true;
}

function bindCheckoutPage() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;
    let hasShownValidationAlert = false;

    initEmailJs();
    renderCheckoutPage();

    const itemsRoot = document.getElementById("checkoutItems");
    if (itemsRoot) {
        itemsRoot.addEventListener("click", (event) => {
            const removeBtn = event.target.closest("[data-remove-item]");
            const qtyBtn = event.target.closest("[data-qty-change]");
            const stepper = event.target.closest("[data-qty-stepper]");

            if (removeBtn) {
                removeCartItem(removeBtn.getAttribute("data-remove-item"));
                return;
            }

            if (qtyBtn && stepper) {
                const itemKey = stepper.getAttribute("data-qty-stepper");
                const delta = parseInt(qtyBtn.getAttribute("data-qty-change"), 10) || 0;
                const cart = getCart();
                const item = cart.find((entry) => makeCartItemKey(entry) === itemKey);
                if (!item) return;
                const nextQty = Math.max(1, (Number(item.quantity) || 1) + delta);
                setCartItemQuantity(itemKey, nextQty);
            }
        });
    }

    const clearBtn = document.getElementById("clearCartBtn");
    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            saveCart([]);
            renderCheckoutPage();
            showToast("Cart cleared.");
        });
    }

    form.querySelectorAll('input[name="delivery_area"]').forEach((input) => {
        input.addEventListener("change", renderCheckoutPage);
    });

    form.querySelectorAll("[required]").forEach((field) => {
        field.addEventListener("invalid", () => {
            if (hasShownValidationAlert) return;
            hasShownValidationAlert = true;
            window.alert("Please fill in all mandatory fields before placing your order.");
            window.setTimeout(() => {
                hasShownValidationAlert = false;
            }, 200);
        });
    });

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (!form.checkValidity()) {
            window.alert("Please fill in all mandatory fields before placing your order.");
            form.reportValidity();
            return;
        }

        const cart = getCart();
        if (!cart.length) {
            showToast("Your cart is empty.");
            return;
        }

        if (!initEmailJs()) {
            showToast("Checkout is not configured yet.");
            return;
        }

        const submitBtn = document.getElementById("checkoutSubmit");
        const originalLabel = submitBtn ? submitBtn.textContent : "";
        const payload = Object.fromEntries(new FormData(form).entries());
        const subtotal = getCartSubtotal(cart);
        const shipping = getSelectedShippingCost();
        const total = subtotal + shipping;
        const transactionId = `SA-${Date.now().toString().slice(-8)}`;

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = "Sending...";
        }

        try {
            await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
                name: payload.name || "",
                email: STORE_EMAIL,
                to_email: STORE_EMAIL,
                customer_email: payload.email || "",
                reply_to: payload.email || "",
                phone: payload.phone || "",
                address: payload.address || "",
                city: payload.city || "",
                postcode: payload.postcode || "",
                notes: payload.notes || "",
                delivery_area: payload.delivery_area || getSelectedShippingArea(),
                shipping_cost: formatMoney(shipping),
                transaction_id: transactionId,
                cart_items: buildCartItemsText(cart),
                subtotal: formatMoney(subtotal),
                total: formatMoney(total),
                order_date: new Date().toLocaleString("en-US", {
                    dateStyle: "medium",
                    timeStyle: "short"
                })
            });

            saveCart([]);
            form.reset();
            renderCheckoutPage();
            showToast("Order sent successfully.");
        } catch (error) {
            console.error("EmailJS checkout failed:", error);
            showToast("Checkout failed. Try again.");
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = originalLabel || "Place Order";
            }
        }
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
    updateCartCount();
    bindCheckoutPage();
});
