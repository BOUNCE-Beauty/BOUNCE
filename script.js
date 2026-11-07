
/* =====================================
   BOUNCE STORE
   MAIN STORE SCRIPT - SUPABASE
   ===================================== */

/* =====================================
   SUPABASE CONNECTION
   ===================================== */

const SUPABASE_URL = "https://rfiwxtthtsqxjkhxgsmg.supabase.co";
const SUPABASE_KEY = "sb_publishable_RBHi1S08zZ7zV5d94wXJSQ_7LUWK1p3";

if (!window.supabase) {
    console.error("BOUNCE: Supabase library is not loaded.");
}

const bounceSupabase =
    window.bounceSupabase ||
    window.supabaseClient ||
    (window.supabase
        ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
        : null);

if (bounceSupabase) {
    window.bounceSupabase = bounceSupabase;
    window.supabaseClient = bounceSupabase;
}

/* =====================================
   PRODUCTS & CART
   ===================================== */

let products = [];
let cart = [];

/* =====================================
   LOAD PRODUCTS FROM SUPABASE
   ===================================== */

async function loadProducts() {
    if (!bounceSupabase) {
        console.error("BOUNCE: Supabase connection is unavailable.");
        return false;
    }

    try {
        const { data, error } = await bounceSupabase
            .from("products")
            .select("*")
            .eq("is_active", true)
            .order("id", { ascending: true });

        if (error) throw error;

        products = (data || []).map(product => ({
            id: String(product.id),
            name: product.name || "",
            line: product.line || "",
            description: product.description || "",
            category: product.category || "hair",
            price: Number(product.price) || 0,
            oldPrice: Number(product.old_price) || 0,
            image: product.image || "",
            isNew: Boolean(product.is_new)
        }));

        return true;

    } catch (error) {
        console.error("BOUNCE: Could not load products:", error);
        return false;
    }
}

/* =====================================
   CART STORAGE
   ===================================== */

function loadCart() {
    try {
        const savedCart = JSON.parse(
            localStorage.getItem("bounceCart") || "[]"
        );

        if (!Array.isArray(savedCart)) return [];

        return savedCart
            .filter(item =>
                item &&
                products.some(product =>
                    String(product.id) === String(item.id)
                )
            )
            .map(item => ({
                id: String(item.id),
                quantity: Math.max(
                    1,
                    Math.floor(Number(item.quantity) || 1)
                )
            }));

    } catch (error) {
        console.error("BOUNCE cart loading error:", error);
        return [];
    }
}

function saveCart() {
    try {
        localStorage.setItem(
            "bounceCart",
            JSON.stringify(cart)
        );
    } catch (error) {
        console.error("BOUNCE cart saving error:", error);
    }
}

/* =====================================
   HTML SAFETY
   ===================================== */

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

/* =====================================
   PRICE
   ===================================== */

function formatPrice(price) {
    return `${Number(price || 0).toLocaleString("en-US")} EGP`;
}

function getDiscount(product) {
    if (
        !product ||
        !product.oldPrice ||
        product.oldPrice <= product.price ||
        product.oldPrice <= 0
    ) {
        return 0;
    }

    return Math.round(
        (1 - product.price / product.oldPrice) * 100
    );
}

/* =====================================
   PRODUCT IMAGE
   ===================================== */

function createProductImage(product) {
    const placeholder = `
        <div class="product-placeholder"
             style="
                display:none;
                width:100%;
                height:100%;
                flex-direction:column;
                align-items:center;
                justify-content:center;
                gap:10px;
                background:linear-gradient(135deg,#FFF0F7,#FFF4E9,#F2F9E9);
                color:#C51F70;
             ">
            <strong style="font-size:32px;">BOUNCE</strong>
            <span style="font-size:11px;letter-spacing:2px;">
                ${escapeHTML(product.line)}
            </span>
        </div>
    `;

    if (!product.image) {
        return `
            <div class="product-placeholder"
                 style="
                    display:flex;
                    width:100%;
                    height:100%;
                    flex-direction:column;
                    align-items:center;
                    justify-content:center;
                    gap:10px;
                    background:linear-gradient(135deg,#FFF0F7,#FFF4E9,#F2F9E9);
                    color:#C51F70;
                 ">
                <strong style="font-size:32px;">BOUNCE</strong>
                <span style="font-size:11px;letter-spacing:2px;">
                    ${escapeHTML(product.line)}
                </span>
            </div>
        `;
    }

    return `
        <img
            src="${escapeHTML(product.image)}"
            alt="${escapeHTML(product.name)}"
            loading="lazy"
            onerror="
                this.style.display='none';
                this.nextElementSibling.style.display='flex';
            "
        >
        ${placeholder}
    `;
}

/* =====================================
   PRODUCT CARD
   ===================================== */

function createProductCard(product) {
    const discount = getDiscount(product);

    return `
        <div class="product-card">

            <div class="product-card-image">

                ${product.isNew
                    ? `<span class="product-badge new-badge">NEW</span>`
                    : ""}

                ${discount > 0
                    ? `<span class="product-badge offer-badge">${discount}% OFF</span>`
                    : ""}

                ${createProductImage(product)}

            </div>

            <h3>${escapeHTML(product.name)}</h3>

            <p>${escapeHTML(product.line)}</p>

            <div class="price">
                ${formatPrice(product.price)}

                ${discount > 0
                    ? `<del>${formatPrice(product.oldPrice)}</del>`
                    : ""}
            </div>

            <button
                type="button"
                data-add-to-cart="${escapeHTML(product.id)}">
                ADD TO CART
            </button>

        </div>
    `;
}

/* =====================================
   DISPLAY HOMEPAGE PRODUCTS
   ===================================== */

function displayProducts() {
    const homeContainer = document.getElementById("home-products");
    const newContainer = document.getElementById("new-arrivals");

    if (homeContainer) {
        homeContainer.innerHTML = products
            .map(product => createProductCard(product))
            .join("");
    }

    if (newContainer) {
        const newProducts = products.filter(
            product => product.isNew
        );

        newContainer.innerHTML = newProducts.length
            ? newProducts.map(product => createProductCard(product)).join("")
            : "<p class='products-loading'>No new arrivals right now.</p>";
    }

    displayOffers();
}

/* =====================================
   OFFERS SECTION
   ===================================== */

function displayOffers() {
    const offersContainer = document.getElementById("offer-products");

    if (!offersContainer) return;

    const offerProducts = products.filter(
        product => getDiscount(product) > 0
    );

    offersContainer.innerHTML = offerProducts.length
        ? offerProducts.map(product => createProductCard(product)).join("")
        : "<p class='products-loading'>No special offers available right now.</p>";
}

/* =====================================
   ADD TO CART
   ===================================== */

function addToCart(productId, quantity = 1) {
    const product = products.find(
        item => String(item.id) === String(productId)
    );

    if (!product) {
        console.error("BOUNCE: Product not found:", productId);
        return false;
    }

    const amount = Math.max(
        1,
        Math.floor(Number(quantity) || 1)
    );

    const existingItem = cart.find(
        item => String(item.id) === String(productId)
    );

    if (existingItem) {
        existingItem.quantity += amount;
    } else {
        cart.push({
            id: String(productId),
            quantity: amount
        });
    }

    saveCart();
    updateCart();

    document.dispatchEvent(
        new CustomEvent("bounceCartUpdated", {
            detail: { cart: [...cart] }
        })
    );

    return true;
}

/* =====================================
   UPDATE CART
   ===================================== */

function updateCart() {
    const cartItems = document.getElementById("cart-items");
    const cartCount = document.getElementById("cart-count");
    const cartTotal = document.getElementById("cart-total");

    let total = 0;
    let count = 0;

    cart = cart
        .filter(item =>
            item &&
            products.some(product =>
                String(product.id) === String(item.id)
            )
        )
        .map(item => ({
            id: String(item.id),
            quantity: Math.max(
                1,
                Math.floor(Number(item.quantity) || 1)
            )
        }));

    if (cartItems) {
        cartItems.innerHTML = "";
    }

    cart.forEach(item => {
        const product = products.find(
            product => String(product.id) === String(item.id)
        );

        if (!product) return;

        const quantity = item.quantity;
        const subtotal = product.price * quantity;

        total += subtotal;
        count += quantity;

        if (cartItems) {
            cartItems.innerHTML += `
                <div class="cart-item">

                    <h3>${escapeHTML(product.name)}</h3>

                    <p>${formatPrice(product.price)}</p>

                    <div class="cart-quantity">

                        <button
                            type="button"
                            data-change-quantity="${escapeHTML(item.id)}"
                            data-amount="-1"
                            aria-label="Decrease quantity">
                            −
                        </button>

                        <span>${quantity}</span>

                        <button
                            type="button"
                            data-change-quantity="${escapeHTML(item.id)}"
                            data-amount="1"
                            aria-label="Increase quantity">
                            +
                        </button>

                    </div>

                    <p>${formatPrice(subtotal)}</p>

                    <button
                        type="button"
                        data-remove-cart="${escapeHTML(item.id)}">
                        Remove
                    </button>

                </div>
            `;
        }
    });

    if (cartItems && cart.length === 0) {
        cartItems.innerHTML = "<p>Your cart is empty.</p>";
    }

    if (cartCount) {
        cartCount.textContent = count;
    }

    if (cartTotal) {
        cartTotal.textContent = total.toLocaleString("en-US");
    }

    saveCart();
}

/* =====================================
   CHANGE QUANTITY
   ===================================== */

function changeQuantity(productId, amount) {
    const item = cart.find(
        item => String(item.id) === String(productId)
    );

    if (!item) return;

    item.quantity += Number(amount);

    if (item.quantity <= 0) {
        cart = cart.filter(
            item => String(item.id) !== String(productId)
        );
    }

    saveCart();
    updateCart();

    document.dispatchEvent(
        new CustomEvent("bounceCartUpdated", {
            detail: { cart: [...cart] }
        })
    );
}

/* =====================================
   REMOVE FROM CART
   ===================================== */

function removeFromCart(productId) {
    cart = cart.filter(
        item => String(item.id) !== String(productId)
    );

    saveCart();
    updateCart();

    document.dispatchEvent(
        new CustomEvent("bounceCartUpdated", {
            detail: { cart: [...cart] }
        })
    );
}

/* =====================================
   OPEN / CLOSE MINI CART
   ===================================== */

function toggleCart() {
    const cartBox = document.getElementById("cart-box");

    if (!cartBox) return;

    const isOpen =
        window.getComputedStyle(cartBox).display !== "none";

    cartBox.style.display = isOpen ? "none" : "block";
}

/* =====================================
   GLOBAL FUNCTIONS
   ===================================== */

window.addToCart = addToCart;
window.updateCart = updateCart;
window.toggleCart = toggleCart;
window.changeQuantity = changeQuantity;
window.removeFromCart = removeFromCart;

/* =====================================
   GLOBAL CLICK HANDLING
   ===================================== */

document.addEventListener("click", function(event) {

    if (!(event.target instanceof Element)) return;

    const addButton = event.target.closest("[data-add-to-cart]");

    if (addButton) {
        event.preventDefault();

        const productId = addButton.getAttribute("data-add-to-cart");

        addToCart(productId);
        return;
    }

    const quantityButton = event.target.closest(
        "[data-change-quantity]"
    );

    if (quantityButton) {
        changeQuantity(
            quantityButton.dataset.changeQuantity,
            quantityButton.dataset.amount
        );
        return;
    }

    const removeButton = event.target.closest(
        "[data-remove-cart]"
    );

    if (removeButton) {
        removeFromCart(removeButton.dataset.removeCart);
    }

});

/* =====================================
   START BOUNCE
   ===================================== */

async function initializeBounce() {
    const loaded = await loadProducts();

    if (!loaded) {
        console.error(
            "BOUNCE: Products could not be loaded from Supabase."
        );

        const containers = [
            "home-products",
            "new-arrivals",
            "offer-products"
        ];

        containers.forEach(id => {
            const container = document.getElementById(id);

            if (container) {
                container.innerHTML =
                    "<p class='products-loading'>Products are temporarily unavailable. Please try again later.</p>";
            }
        });

        // Keep the saved cart intact if the product request fails.
        const cartCount = document.getElementById("cart-count");

        if (cartCount) {
            try {
                const savedCart = JSON.parse(
                    localStorage.getItem("bounceCart") || "[]"
                );

                const count = Array.isArray(savedCart)
                    ? savedCart.reduce(
                        (sum, item) => sum + Math.max(
                            0,
                            Math.floor(Number(item?.quantity) || 0)
                        ),
                        0
                    )
                    : 0;

                cartCount.textContent = count;

            } catch {
                cartCount.textContent = "0";
            }
        }

        return;
    }

    cart = loadCart();

    displayProducts();
    updateCart();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initializeBounce,
        { once: true }
    );
} else {
    initializeBounce();
}
