
/* =====================================
   BOUNCE COLLECTIONS
   Supabase Connected
   ===================================== */

document.addEventListener("DOMContentLoaded", async function () {

    const SUPABASE_URL = "https://rfiwxtthtsqxjkhxgsmg.supabase.co";
    const SUPABASE_KEY = "sb_publishable_RBHi1S08zZ7zV5d94wXJSQ_7LUWK1p3";

    const params = new URLSearchParams(window.location.search);
    const selectedLine = (params.get("line") || "collagen").toLowerCase();

    const collections = {
        collagen: {
            title: "COLLAGEN COLLECTION",
            heading: "The Collagen Collection",
            description: "A dedicated hair care routine for weak and fragile-looking hair that needs extra care and attention.",
            subtitle: "Explore the Collagen Collection",
            className: "collagen-product",
            ids: ["1"]
        },

        caviar: {
            title: "CAVIAR COLLECTION",
            heading: "The Caviar Collection",
            description: "A nourishing hair care routine created for dry and damaged-looking hair.",
            subtitle: "Explore the Caviar Collection",
            className: "caviar-product",
            ids: ["2"]
        },

        argan: {
            title: "ARGAN COLLECTION",
            heading: "The Argan Collection",
            description: "A moisture-focused hair care routine for hair that needs softness, nourishment and shine.",
            subtitle: "Explore the Argan Collection",
            className: "argan-product",
            ids: ["3"]
        }
    };

    const collection = collections[selectedLine];

    const hero = document.getElementById("collection-hero");
    const title = document.getElementById("collection-title");
    const description = document.getElementById("collection-description");
    const productsHeading = document.getElementById("products-heading");
    const productsSubheading = document.getElementById("products-subheading");
    const productsGrid = document.getElementById("collection-products-grid");
    const emptyMessage = document.getElementById("collection-empty");
    const productsSectionHeading = document.querySelector(".collection-products-heading");

    /* =====================================
       HELPERS
       ===================================== */

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function formatCollectionPrice(value) {
        return `${Number(value || 0).toLocaleString("en-US")} EGP`;
    }

    function getCollectionDiscount(product) {
        const price = Number(product.price || 0);
        const oldPrice = Number(product.oldPrice ?? product.old_price ?? 0);

        if (!oldPrice || oldPrice <= price) return 0;

        return Math.round(((oldPrice - price) / oldPrice) * 100);
    }

    function showEmptyMessage(message = null) {
        if (productsGrid) {
            productsGrid.hidden = true;
            productsGrid.innerHTML = "";
        }

        if (emptyMessage) {
            emptyMessage.hidden = false;

            if (message) {
                const heading = emptyMessage.querySelector("h3");
                const paragraph = emptyMessage.querySelector("p");

                if (heading) heading.textContent = message.heading;
                if (paragraph) paragraph.textContent = message.description;
            }
        }
    }

    /* =====================================
       INVALID COLLECTION
       ===================================== */

    if (!collection) {
        if (hero) hero.hidden = true;
        if (productsSectionHeading) productsSectionHeading.hidden = true;

        showEmptyMessage({
            heading: "Collection Not Found",
            description: "Explore all our available hair care collections."
        });

        document.title = "Collection Not Found | BOUNCE";
        return;
    }

    /* =====================================
       COLLECTION CONTENT
       ===================================== */

    if (title) title.textContent = collection.title;
    if (description) description.textContent = collection.description;
    if (productsHeading) productsHeading.textContent = collection.heading;
    if (productsSubheading) productsSubheading.textContent = collection.subtitle;

    document.title = `${collection.title} | BOUNCE`;

    if (hero) {
        hero.classList.add(collection.className);
    }

    /* Highlight selected collection */

    document.querySelectorAll(".collection-switch-card").forEach(card => {
        const link = new URL(card.href, window.location.origin);
        const cardLine = link.searchParams.get("line");

        if (cardLine === selectedLine) {
            card.classList.add("selected-collection");
            card.setAttribute("aria-current", "page");
        }
    });

    /* =====================================
       LOADING STATE
       ===================================== */

    if (productsGrid) {
        productsGrid.hidden = false;
        productsGrid.innerHTML = `
            <div class="collection-loading">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <p>Loading collection...</p>
            </div>
        `;
    }

    if (emptyMessage) {
        emptyMessage.hidden = true;
    }

    /* =====================================
       SUPABASE CLIENT
       ===================================== */

    function getSupabaseClient() {

        if (
            window.bounceSupabase &&
            typeof window.bounceSupabase.from === "function"
        ) {
            return window.bounceSupabase;
        }

        if (
            window.supabaseClient &&
            typeof window.supabaseClient.from === "function"
        ) {
            return window.supabaseClient;
        }

        if (
            window.supabase &&
            typeof window.supabase.createClient === "function"
        ) {
            return window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );
        }

        return null;
    }

    /* =====================================
       GET COLLECTION PRODUCTS
       ===================================== */

    async function loadCollectionProducts() {

        try {
            const supabaseClient = getSupabaseClient();

            if (!supabaseClient) {
                throw new Error("Supabase is not available.");
            }

            const { data, error } = await supabaseClient
                .from("products")
                .select("*")
                .eq("is_active", true)
                .order("id", { ascending: true });

            if (error) throw error;

            const allProducts = (data || []).map(product => ({
                ...product,
                oldPrice: product.old_price,
                isNew: product.is_new
            }));

            const collectionProducts = allProducts.filter(product => {

                const productLine = String(product.line || "").toLowerCase();
                const productId = String(product.id);

                return (
                    collection.ids.includes(productId) ||
                    productLine.includes(selectedLine)
                );
            });

            renderProducts(collectionProducts);

        } catch (error) {

            console.error("BOUNCE Collection Error:", error);

            showEmptyMessage({
                heading: "Unable to Load Collection",
                description: "Please refresh the page or explore our shop."
            });
        }
    }

    /* =====================================
       PRODUCT CARD
       ===================================== */

    function createCollectionCard(product) {

        const discount = getCollectionDiscount(product);

        const productName = escapeHTML(product.name);
        const productLine = escapeHTML(product.line || collection.title);
        const productId = encodeURIComponent(product.id);

        const imageContent = product.image
            ? `
                <img
                    src="${escapeHTML(product.image)}"
                    alt="${productName}"
                    loading="lazy"
                >
            `
            : `
                <div class="collection-product-placeholder">
                    <strong>BOUNCE</strong>
                    <span>${productLine}</span>
                </div>
            `;

        return `
            <article class="collection-product-card">

                <a
                    href="product.html?id=${productId}"
                    class="collection-product-image"
                    aria-label="View ${productName}">

                    ${imageContent}

                    ${product.is_new || product.isNew
                        ? `<span class="product-new-badge">NEW</span>`
                        : ""}

                    ${discount > 0
                        ? `<span class="product-discount-badge">${discount}% OFF</span>`
                        : ""}

                </a>

                <div class="collection-product-info">

                    <span>${productLine}</span>

                    <h3>${productName}</h3>

                    <div class="collection-product-price">

                        ${formatCollectionPrice(product.price)}

                        ${discount > 0
                            ? `<del>${formatCollectionPrice(product.oldPrice)}</del>`
                            : ""}

                    </div>

                    <div class="collection-product-actions">

                        <a href="product.html?id=${productId}">
                            VIEW DETAILS
                        </a>

                        <button
                            type="button"
                            data-add-to-cart="${escapeHTML(product.id)}">
                            ADD TO CART
                        </button>

                    </div>

                </div>

            </article>
        `;
    }

    /* =====================================
       DISPLAY PRODUCTS
       ===================================== */

    function renderProducts(collectionProducts) {

        if (!productsGrid) return;

        if (!collectionProducts.length) {
            showEmptyMessage({
                heading: "No Products Available",
                description: "Explore all our available hair care collections."
            });

            return;
        }

        productsGrid.innerHTML = collectionProducts
            .map(createCollectionCard)
            .join("");

        productsGrid.hidden = false;

        if (emptyMessage) {
            emptyMessage.hidden = true;
        }

        /* Refresh cart counter */

        if (typeof updateCart === "function") {
            updateCart();
        }
    }

    /* =====================================
       INITIALIZE
       ===================================== */

    await loadCollectionProducts();

});
