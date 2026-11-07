
/* =====================================
   BOUNCE PRODUCT DETAILS
   SUPABASE CONNECTED
   ===================================== */

document.addEventListener("DOMContentLoaded", async function () {

    /* =====================================
       SUPABASE
       ===================================== */

    const client = window.bounceSupabase;

    /* =====================================
       PAGE ELEMENTS
       ===================================== */

    const elements = {
        name: document.getElementById("product-name"),
        line: document.getElementById("product-line"),
        description: document.getElementById("product-description"),
        price: document.getElementById("product-price"),
        breadcrumb: document.getElementById("breadcrumb-product"),
        imageName: document.getElementById("image-collection-name"),
        image: document.getElementById("product-image"),
        features: document.getElementById("feature-description"),
        quantity: document.getElementById("quantity-value"),
        minus: document.getElementById("quantity-minus"),
        plus: document.getElementById("quantity-plus"),
        addButton: document.getElementById("product-add-cart")
    };

    /* =====================================
       GET PRODUCT ID
       ===================================== */

    const params = new URLSearchParams(window.location.search);
    const productId = params.get("id");

    const MAX_QUANTITY = 99;

    /* =====================================
       COLLECTION INFORMATION
       ===================================== */

    const collections = {

        "1": {
            className: "collagen-product",
            tagline: "STRENGTH & SOFTNESS",

            description:
                "The Collagen Collection is specially designed for weak, fine and fragile-looking hair. It provides a caring routine that helps improve hair softness, flexibility and manageability.",

            features: [
                "Helps improve the appearance of weak and fragile hair.",
                "Helps hair feel softer and more flexible.",
                "Supports smoother and more manageable hair.",
                "Helps reduce the appearance of dryness and roughness.",
                "Ideal for fine hair that is prone to breakage."
            ]
        },

        "2": {
            className: "caviar-product",
            tagline: "NOURISHMENT & CARE",

            description:
                "The Caviar Collection is designed for dry, damaged and dull-looking hair. Its nourishing routine helps improve the feel and appearance of hair that needs extra care.",

            features: [
                "Provides nourishing care for dry and damaged-looking hair.",
                "Helps improve hair softness and smoothness.",
                "Helps hair look healthier and less dull.",
                "Improves manageability and helps reduce roughness.",
                "Ideal for hair that needs extra nourishment and care."
            ]
        },

        "3": {
            className: "argan-product",
            tagline: "MOISTURE & SHINE",

            description:
                "The Argan Collection is designed for dry, coarse and frizzy hair. It focuses on moisture and nourishment to help hair feel softer and look smoother and shinier.",

            features: [
                "Helps moisturize dry hair.",
                "Helps soften coarse and rough hair.",
                "Improves the appearance of frizz.",
                "Helps hair look smoother and shinier.",
                "Makes hair easier to manage and style."
            ]
        }
    };

    /* =====================================
       HELPERS
       ===================================== */

    function formatPrice(value) {
        return Number(value || 0).toLocaleString("en-US") + " EGP";
    }

    function getDiscount(price, oldPrice) {

        price = Number(price || 0);
        oldPrice = Number(oldPrice || 0);

        if (oldPrice <= price || oldPrice === 0) {
            return 0;
        }

        return Math.round((1 - price / oldPrice) * 100);
    }

    function showProductError(message) {

        if (elements.name) {
            elements.name.textContent = "Product Not Found";
        }

        if (elements.description) {
            elements.description.textContent = message;
        }

        if (elements.addButton) {
            elements.addButton.disabled = true;
            elements.addButton.textContent = "UNAVAILABLE";
        }

        document.title = "Product Not Found | BOUNCE";
    }

    function createImageFallback(product) {

        const placeholder = document.createElement("div");
        placeholder.className = "product-image-placeholder";

        const name = document.createElement("span");
        name.textContent = "BOUNCE";

        const collection = document.createElement("strong");
        collection.textContent = (
            product.line || "HAIR CARE"
        ).replace(" COLLECTION", "");

        const tagline = document.createElement("small");
        tagline.textContent = "YOUR HAIR. YOUR BOUNCE.";

        placeholder.append(name, collection, tagline);

        return placeholder;
    }

    function displayProductImage(product, details) {

        if (!elements.image) return;

        if (details.className) {
            elements.image.classList.add(details.className);
        }

        if (!product.image) {
            elements.image.replaceChildren(
                createImageFallback(product)
            );
            return;
        }

        const image = document.createElement("img");

        image.src = product.image;
        image.alt = product.name;
        image.className = "product-detail-photo";
        image.loading = "eager";
        image.decoding = "async";

        image.style.width = "100%";
        image.style.height = "100%";
        image.style.maxHeight = "550px";
        image.style.objectFit = "contain";
        image.style.display = "block";

        image.addEventListener("error", function () {

            elements.image.replaceChildren(
                createImageFallback(product)
            );

        }, { once: true });

        elements.image.replaceChildren(image);
    }

    function displayPrice(price, oldPrice, discount) {

        if (!elements.price) return;

        elements.price.replaceChildren();

        const currentPrice = document.createElement("strong");
        currentPrice.textContent = formatPrice(price);

        elements.price.appendChild(currentPrice);

        if (discount > 0) {

            const previousPrice = document.createElement("del");
            previousPrice.textContent = formatPrice(oldPrice);

            const discountBadge = document.createElement("span");
            discountBadge.className = "product-discount";
            discountBadge.textContent = `${discount}% OFF`;

            elements.price.append(
                previousPrice,
                discountBadge
            );
        }
    }

    function displayFeatures(features) {

        if (!elements.features) return;

        const list = document.createElement("ul");
        list.className = "collection-feature-list";

        features.forEach(function (feature) {

            const item = document.createElement("li");

            const icon = document.createElement("i");
            icon.className = "fa-solid fa-check";
            icon.setAttribute("aria-hidden", "true");

            const text = document.createElement("span");
            text.textContent = feature;

            item.append(icon, text);
            list.appendChild(item);
        });

        const container = document.createElement("div");
        container.id = "feature-description";

        container.appendChild(list);

        elements.features.replaceWith(container);
    }

    /* =====================================
       VALIDATE PRODUCT ID
       ===================================== */

    if (!productId) {

        showProductError(
            "Please select a collection from our shop."
        );

        return;
    }

    if (!client) {

        showProductError(
            "Unable to connect to the store right now."
        );

        console.error("BOUNCE Supabase client is missing.");

        return;
    }

    /* =====================================
       LOAD PRODUCT FROM SUPABASE
       ===================================== */

    try {

        const { data: product, error } = await client
            .from("products")
            .select(`
                id,
                name,
                line,
                description,
                category,
                price,
                old_price,
                image,
                is_active
            `)
            .eq("id", productId)
            .eq("is_active", true)
            .single();

        if (error || !product) {
            throw error || new Error("Product not found.");
        }

        /* =====================================
           PRODUCT DATA
           ===================================== */

        const details = collections[String(product.id)] || {

            className: "",

            tagline: product.line || "BOUNCE COLLECTION",

            description: product.description ||
                "Discover your perfect hair care routine with BOUNCE.",

            features: [
                "Discover your perfect hair care routine.",
                "Find the care that matches your hair needs.",
                "Make your hair care moments part of your routine."
            ]
        };

        const price = Number(product.price || 0);
        const oldPrice = Number(product.old_price || 0);

        const discount = getDiscount(price, oldPrice);

        /* =====================================
           DISPLAY PRODUCT INFORMATION
           ===================================== */

        if (elements.name) {
            elements.name.textContent = product.name;
        }

        if (elements.line) {
            elements.line.textContent = details.tagline;
        }

        if (elements.description) {
            elements.description.textContent = details.description;
        }

        if (elements.breadcrumb) {
            elements.breadcrumb.textContent = product.name;
        }

        if (elements.imageName) {
            elements.imageName.textContent =
                (product.line || "BOUNCE COLLECTION")
                    .replace(" COLLECTION", "");
        }

        document.title = `${product.name} | BOUNCE`;

        /* =====================================
           DISPLAY PRODUCT IMAGE
           ===================================== */

        displayProductImage(product, details);

        /* =====================================
           DISPLAY PRICE
           ===================================== */

        displayPrice(price, oldPrice, discount);

        /* =====================================
           DISPLAY FEATURES
           ===================================== */

        displayFeatures(details.features);

        /* =====================================
           COLLECTION CONTENTS
           ===================================== */

        const contents = [
            "Shampoo – 500 ml",
            "Conditioner – 500 ml",
            "Hair Mask – 500 ml",
            "Hair Serum – 100 ml",
            "Anti-Hair-Fall Oil – 60 ml",
            "Body Mukhamariya – 100 g"
        ];

        const contentsList = document.querySelector(
            ".product-contents ul"
        );

        if (contentsList) {

            contentsList.replaceChildren();

            contents.forEach(function (content) {

                const item = document.createElement("li");

                const icon = document.createElement("i");
                icon.className = "fa-solid fa-check";
                icon.setAttribute("aria-hidden", "true");

                const text = document.createElement("span");
                text.textContent = content;

                item.append(icon, text);

                contentsList.appendChild(item);
            });
        }

        /* =====================================
           QUANTITY
           ===================================== */

        let quantity = 1;

        function updateQuantity() {

            if (elements.quantity) {
                elements.quantity.textContent = quantity;
            }

            if (elements.minus) {
                elements.minus.disabled = quantity <= 1;
            }

            if (elements.plus) {
                elements.plus.disabled = quantity >= MAX_QUANTITY;
            }
        }

        updateQuantity();

        if (elements.plus) {

            elements.plus.addEventListener("click", function () {

                if (quantity < MAX_QUANTITY) {
                    quantity++;
                    updateQuantity();
                }
            });
        }

        if (elements.minus) {

            elements.minus.addEventListener("click", function () {

                if (quantity > 1) {
                    quantity--;
                    updateQuantity();
                }
            });
        }

        /* =====================================
           CURRENT PRODUCT
           ===================================== */

        window.currentBounceProduct = {
            id: product.id,
            name: product.name,
            line: product.line,
            price: price,
            oldPrice: oldPrice,
            image: product.image
        };

        /* =====================================
           ADD TO CART
           ===================================== */

        if (elements.addButton) {

            elements.addButton.disabled = false;

            elements.addButton.addEventListener(
                "click",
                function () {

                    if (
                        typeof window.addToCart !== "function"
                    ) {
                        console.error(
                            "BOUNCE addToCart function is unavailable."
                        );

                        return;
                    }

                    elements.addButton.disabled = true;

                    try {

                        window.addToCart(product.id, quantity);

                        elements.addButton.innerHTML = `
                            <i class="fa-solid fa-check"></i>
                            ADDED TO CART
                        `;

                        setTimeout(function () {

                            elements.addButton.innerHTML = `
                                <i class="fa-solid fa-bag-shopping"></i>
                                ADD TO CART
                            `;

                            elements.addButton.disabled = false;

                        }, 1500);

                    } catch (error) {

                        console.error(
                            "BOUNCE add to cart error:",
                            error
                        );

                        elements.addButton.textContent =
                            "PLEASE TRY AGAIN";

                        setTimeout(function () {

                            elements.addButton.innerHTML = `
                                <i class="fa-solid fa-bag-shopping"></i>
                                ADD TO CART
                            `;

                            elements.addButton.disabled = false;

                        }, 1500);
                    }
                }
            );
        }

        console.log("BOUNCE product loaded:", product.name);

    } catch (error) {

        console.error("BOUNCE product loading error:", error);

        showProductError(
            "Sorry, this collection could not be loaded right now."
        );
    }

});
