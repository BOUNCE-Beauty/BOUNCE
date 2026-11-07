
/* =====================================
   BOUNCE CART PAGE
   SECURE SUPABASE ORDER SUBMISSION
   SERVER-SIDE PRICE & SHIPPING
   ===================================== */

document.addEventListener("DOMContentLoaded", function () {

    /* PAGE ELEMENTS */

    const itemsContainer = document.getElementById("cart-page-items");
    const emptyCart = document.getElementById("empty-cart");
    const summary = document.getElementById("cart-summary");

    const subtotalElement = document.getElementById("cart-subtotal");
    const totalElement = document.getElementById("cart-grand-total");
    const itemsCountElement = document.getElementById("cart-items-count");
    const cartCountElement = document.getElementById("cart-count");

    const checkoutLink = document.getElementById("checkout-link");
    const checkoutForm = document.getElementById("checkout-form");
    const checkoutMessage = document.getElementById("checkout-message");

    /* CHECK MAIN SCRIPT */

    if (
        typeof cart === "undefined" ||
        typeof products === "undefined" ||
        typeof saveCart !== "function" ||
        typeof formatPrice !== "function"
    ) {
        console.error("BOUNCE: Main store script is not loaded correctly.");

        if (itemsContainer) {
            itemsContainer.innerHTML = `
                <p class="cart-error">
                    Something went wrong loading your cart.
                    Please refresh the page.
                </p>
            `;
        }

        return;
    }

    /* SUPABASE CONNECTION */

    let db = window.bounceSupabase || window.supabaseClient || null;

    if (!db && window.supabase?.createClient) {
        db = window.supabase.createClient(
            "https://rfiwxtthtsqxjkhxgsmg.supabase.co",
            "sb_publishable_RBHi1S08zZ7zV5d94wXJSQ_7LUWK1p3"
        );

        window.bounceSupabase = db;
    }

    /* SHIPPING SETTINGS - DISPLAY ONLY */

    const lowShippingGovernorates = [
        "الغربية",
        "الغربيه",
        "الإسكندرية",
        "الاسكندرية",
        "اسكندرية",
        "القاهرة",
        "القاهره",
        "الجيزة",
        "الجيزه",
        "كفر الشيخ",
        "kafr el sheikh",
        "kafr al sheikh",
        "gharbia",
        "alexandria",
        "cairo",
        "giza"
    ];

    let shippingFee = 0;
    let governorateSelected = false;

    /* HELPERS */

    function escapeHTML(value) {
        return String(value ?? "").replace(/[&<>"']/g, character => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[character]);
    }

    function normalizeText(value) {
        return String(value || "")
            .trim()
            .toLowerCase()
            .replace(/[أإآ]/g, "ا")
            .replace(/ة/g, "ه")
            .replace(/ى/g, "ي")
            .replace(/\s+/g, " ");
    }

    function findField(pattern) {
        if (!checkoutForm) return null;

        const fields = checkoutForm.querySelectorAll(
            "input, select, textarea"
        );

        for (const field of fields) {
            const identifier = [
                field.name,
                field.id,
                field.placeholder,
                field.getAttribute("aria-label")
            ].join(" ").toLowerCase();

            if (pattern.test(identifier)) {
                return field;
            }
        }

        return null;
    }

    const customerNameField = findField(
        /customer.?name|full.?name|name|الاسم/
    );

    const phoneField = findField(
        /phone|mobile|telephone|رقم.?التليفون|رقم.?الموبايل|الهاتف/
    );

    const governorateField = findField(
        /governorate|محافظة|المحافظة/
    );

    const cityField = findField(
        /city|المدينة|مدينة/
    );

    const addressField = findField(
        /address|العنوان/
    );

    const notesField = findField(
        /notes|note|ملاحظات/
    );

    /* SHIPPING CALCULATION - DISPLAY ONLY */

    function calculateShipping() {
        const governorate = normalizeText(
            governorateField?.value
        );

        if (!governorate) {
            shippingFee = 0;
            governorateSelected = false;
            return;
        }

        governorateSelected = true;

        const isLowShipping = lowShippingGovernorates.some(name =>
            normalizeText(name) === governorate
        );

        shippingFee = isLowShipping ? 50 : 100;
    }

    /* SHIPPING ROW */

    let shippingElement = document.getElementById("cart-shipping");

    if (!shippingElement && totalElement?.parentElement) {
        const shippingRow = document.createElement("div");

        shippingRow.className = "cart-shipping-row";
        shippingRow.innerHTML = `
            <span>Shipping</span>
            <strong id="cart-shipping">Select governorate</strong>
        `;

        totalElement.parentElement.parentElement.insertBefore(
            shippingRow,
            totalElement.parentElement
        );

        shippingElement = document.getElementById("cart-shipping");
    }

    /* CART TOTAL - DISPLAY ONLY */

    function calculateSubtotal() {
        return cart.reduce((sum, item) => {
            const product = products.find(
                product => String(product.id) === String(item.id)
            );

            if (!product) return sum;

            const quantity = Math.max(
                1,
                Math.floor(Number(item.quantity) || 1)
            );

            return sum + Number(product.price) * quantity;
        }, 0);
    }

    /* RENDER CART */

    function renderCartPage() {
        if (!itemsContainer) return;

        let subtotal = 0;
        let totalItems = 0;

        cart = cart.filter(item =>
            products.some(product =>
                String(product.id) === String(item.id)
            )
        );

        itemsContainer.innerHTML = "";

        cart.forEach(item => {
            const product = products.find(
                product => String(product.id) === String(item.id)
            );

            if (!product) return;

            const quantity = Math.max(
                1,
                Math.floor(Number(item.quantity) || 1)
            );

            item.quantity = quantity;

            const itemTotal = Number(product.price) * quantity;

            subtotal += itemTotal;
            totalItems += quantity;

            const imageContent = product.image
                ? `
                    <img
                        src="${escapeHTML(product.image)}"
                        alt="${escapeHTML(product.name)}"
                    >
                `
                : `
                    <div class="cart-product-placeholder">
                        <strong>BOUNCE</strong>
                        <span>${escapeHTML(product.line)}</span>
                    </div>
                `;

            itemsContainer.innerHTML += `
                <article class="cart-product">

                    <div class="cart-product-image">
                        ${imageContent}
                    </div>

                    <div class="cart-product-info">

                        <h3>${escapeHTML(product.name)}</h3>

                        <p>${escapeHTML(product.line)}</p>

                        <div class="cart-product-price">
                            ${formatPrice(product.price)}
                        </div>

                        <div class="cart-quantity-control">

                            <button
                                type="button"
                                data-cart-page-quantity="${escapeHTML(item.id)}"
                                data-amount="-1"
                                aria-label="Decrease quantity">
                                −
                            </button>

                            <span>${quantity}</span>

                            <button
                                type="button"
                                data-cart-page-quantity="${escapeHTML(item.id)}"
                                data-amount="1"
                                aria-label="Increase quantity">
                                +
                            </button>

                        </div>

                    </div>

                    <div class="cart-product-actions">

                        <div class="cart-product-subtotal">
                            ${formatPrice(itemTotal)}
                        </div>

                        <button
                            type="button"
                            class="cart-remove-button"
                            data-cart-page-remove="${escapeHTML(item.id)}">

                            <i class="fa-regular fa-trash-can"></i>
                            Remove

                        </button>

                    </div>

                </article>
            `;
        });

        const isEmpty = cart.length === 0;

        if (emptyCart) {
            emptyCart.hidden = !isEmpty;
        }

        itemsContainer.hidden = isEmpty;

        if (summary) {
            summary.classList.toggle("is-empty", isEmpty);
        }

        calculateShipping();

        const grandTotal = subtotal + shippingFee;

        if (subtotalElement) {
            subtotalElement.textContent = formatPrice(subtotal);
        }

        if (shippingElement) {
            shippingElement.textContent = governorateSelected
                ? formatPrice(shippingFee)
                : "Select governorate";
        }

        if (totalElement) {
            totalElement.textContent = formatPrice(grandTotal);
        }

        if (itemsCountElement) {
            itemsCountElement.textContent =
                `${totalItems} ${totalItems === 1 ? "ITEM" : "ITEMS"}`;
        }

        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }

        saveCart();
    }

    /* SHIPPING FIELD EVENTS */

    if (governorateField) {
        governorateField.addEventListener("input", renderCartPage);
        governorateField.addEventListener("change", renderCartPage);
    }

    /* CHANGE QUANTITY */

    itemsContainer?.addEventListener("click", function (event) {
        const button = event.target.closest(
            "[data-cart-page-quantity]"
        );

        if (!button) return;

        const productId = button.dataset.cartPageQuantity;
        const amount = Number(button.dataset.amount);

        if (typeof changeQuantity === "function") {
            changeQuantity(productId, amount);
        }

        renderCartPage();
    });

    /* REMOVE PRODUCT */

    itemsContainer?.addEventListener("click", function (event) {
        const button = event.target.closest(
            "[data-cart-page-remove]"
        );

        if (!button) return;

        const productId = button.dataset.cartPageRemove;

        if (typeof removeFromCart === "function") {
            removeFromCart(productId);
        }

        renderCartPage();
    });

    /* CHECKOUT LINK */

    if (checkoutLink) {
        checkoutLink.addEventListener("click", function (event) {
            if (cart.length === 0) {
                event.preventDefault();
            }
        });
    }

    /* CHECKOUT MESSAGE */

    function showMessage(message, isError = false) {
        if (!checkoutMessage) return;

        checkoutMessage.hidden = false;
        checkoutMessage.textContent = message;

        checkoutMessage.classList.toggle("error", isError);

        checkoutMessage.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }

    /* SECURE ORDER SUBMISSION */

    async function submitOrder(event) {
        event.preventDefault();

        if (cart.length === 0) {
            showMessage(
                "Your cart is empty. Add a product before checkout.",
                true
            );
            return;
        }

        if (!db) {
            showMessage(
                "The order system is not connected. Please try again later.",
                true
            );
            return;
        }

        calculateShipping();

        if (!governorateSelected) {
            showMessage("Please select your governorate.", true);
            governorateField?.focus();
            return;
        }

        const customerName = customerNameField?.value.trim() || "";
        const phone = phoneField?.value.trim() || "";
        const governorate = governorateField?.value.trim() || "";
        const city = cityField?.value.trim() || "";
        const address = addressField?.value.trim() || "";
        const notes = notesField?.value.trim() || "";

        if (!customerName || !phone || !city || !address) {
            showMessage(
                "Please complete your name, phone, city and address.",
                true
            );
            return;
        }

        const orderItems = cart.map(item => ({
            id: String(item.id),
            quantity: Math.floor(Number(item.quantity))
        }));

        if (orderItems.some(item =>
            !/^[0-9]+$/.test(item.id) ||
            !Number.isInteger(item.quantity) ||
            item.quantity < 1 ||
            item.quantity > 99
        )) {
            showMessage(
                "Your cart contains invalid product information. Please refresh the page.",
                true
            );
            return;
        }

        const orderButton = checkoutForm.querySelector(
            '[type="submit"]'
        );

        if (orderButton) {
            orderButton.disabled = true;
            orderButton.dataset.originalText =
                orderButton.textContent;
            orderButton.textContent = "Placing Order...";
        }

        try {
            const { data, error } = await db.rpc(
                "place_bounce_order",
                {
                    p_customer_name: customerName,
                    p_phone: phone,
                    p_governorate: governorate,
                    p_city: city,
                    p_address: address,
                    p_notes: notes,
                    p_items: orderItems
                }
            );

            if (error) {
                throw error;
            }

            if (
                !data ||
                !data.order_id ||
                data.total === undefined
            ) {
                throw new Error(
                    "The server returned an invalid order confirmation. Please contact support before trying again."
                );
            }

            /* CLEAR CART ONLY AFTER SERVER CONFIRMATION */

            cart.splice(0, cart.length);
            saveCart();

            document.dispatchEvent(
                new Event("bounceCartUpdated")
            );

            renderCartPage();

            checkoutForm.reset();

            showMessage(
                `Thank you for your order! Your order number is #${data.order_id}. Total: ${formatPrice(data.total)} (including ${formatPrice(data.shipping)} shipping). We will contact you to confirm your order.`
            );

        } catch (error) {
            console.error("BOUNCE secure order error:", error);

            showMessage(
                error.message ||
                "Something went wrong while placing your order. Please try again.",
                true
            );

        } finally {
            if (orderButton) {
                orderButton.disabled = false;
                orderButton.textContent =
                    orderButton.dataset.originalText || "Place Order";
            }
        }
    }

    if (checkoutForm) {
        checkoutForm.addEventListener("submit", submitOrder);
    }

    /* SYNC CART CHANGES */

    document.addEventListener("bounceCartUpdated", function () {
        renderCartPage();
    });

    /* INITIAL RENDER */

    renderCartPage();

    console.log("BOUNCE secure cart page initialized.");

});
