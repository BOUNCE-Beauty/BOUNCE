
/* =========================================
   BOUNCE ADMIN DASHBOARD
   SUPABASE AUTH + ADMIN MANAGEMENT
   WHATSAPP CUSTOMER CONTACT
   ========================================= */

document.addEventListener("DOMContentLoaded", async () => {

    const SUPABASE_URL =
        "https://rfiwxtthtsqxjkhxgsmg.supabase.co";

    const SUPABASE_KEY =
        "sb_publishable_RBHi1S08zZ7zV5d94wXJSQ_7LUWK1p3";

    let db = window.bounceSupabase || null;
    let currentUserId = null;
    let dashboardInitialized = false;

    const $ = selector => document.querySelector(selector);

    const money = value =>
        `${Number(value || 0).toLocaleString("en-US")} EGP`;

    const escapeHTML = value =>
        String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);

    /* -------------------------------------
       WHATSAPP PHONE HELPER
    ------------------------------------- */

    function getWhatsAppLink(phone) {

        let number = String(phone || "")
            .trim()
            .replace(/\D/g, "");

        // Egyptian local mobile number: 01XXXXXXXXX
        if (/^01[0125]\d{8}$/.test(number)) {
            number = "2" + number;
        }

        // Egyptian international mobile number
        if (/^201[0125]\d{8}$/.test(number)) {
            return `https://wa.me/${number}`;
        }

        // Other international numbers
        if (number.length >= 10 && number.length <= 15) {
            return `https://wa.me/${number}`;
        }

        return null;
    }

    function whatsappButton(phone) {

        const link = getWhatsAppLink(phone);

        if (!link) return "";

        return `
            <a
                href="${escapeHTML(link)}"
                target="_blank"
                rel="noopener noreferrer"
                class="order-whatsapp"
                title="Chat on WhatsApp"
                aria-label="Chat with customer on WhatsApp">

                <i class="fa-brands fa-whatsapp"></i>

            </a>
        `;
    }

    /* -------------------------------------
       GLOBAL ADMIN STYLES
    ------------------------------------- */

    function addAdminStyles() {

        if ($("#bounce-admin-extra-styles")) return;

        const style = document.createElement("style");

        style.id = "bounce-admin-extra-styles";

        style.textContent = `

            .order-phone-row {
                display: flex;
                align-items: center;
                gap: 9px;
                margin-top: 5px;
                flex-wrap: wrap;
            }

            .order-whatsapp {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 29px;
                height: 29px;
                min-width: 29px;
                border-radius: 50%;
                background: #25D366;
                color: white !important;
                text-decoration: none !important;
                font-size: 17px;
                transition: transform .2s ease, background .2s ease;
            }

            .order-whatsapp:hover {
                background: #128C7E;
                transform: scale(1.1);
            }

            .admin-management-card {
                background: #fff;
                border: 1px solid #eadfe6;
                border-radius: 12px;
                padding: 22px;
                margin-bottom: 22px;
            }

            .admin-management-card h3 {
                color: #29232A;
                margin: 0 0 8px;
            }

            .admin-management-card p {
                color: #514852;
                line-height: 1.6;
            }

            .admin-add-row {
                display: flex;
                gap: 10px;
                margin-top: 10px;
            }

            .admin-add-row input {
                flex: 1;
                min-width: 0;
                padding: 12px;
                border: 1px solid #d8cbd3;
                border-radius: 7px;
                font: inherit;
                color: #29232A;
            }

            .admin-add-row button {
                border: 0;
                border-radius: 7px;
                padding: 12px 18px;
                background: #C51F70;
                color: white;
                font-weight: 600;
                cursor: pointer;
            }

            .admin-add-row button:disabled {
                opacity: .6;
                cursor: wait;
            }

            .admin-management-note {
                margin: 12px 0 0;
                font-size: 13px;
            }

            .admin-remove-btn {
                border: 0;
                border-radius: 6px;
                padding: 8px 12px;
                background: #fce8e8;
                color: #a52828;
                cursor: pointer;
                font-weight: 600;
            }

            .admin-current-label {
                color: #3F7625;
                font-size: 12px;
                font-weight: 700;
            }

            .admin-product-actions {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }

            .admin-product-actions button {
                border: 0;
                padding: 8px 10px;
                border-radius: 6px;
                cursor: pointer;
                background: #f5eaf0;
                color: #333;
            }

            .inactive-status {
                background: #eee;
                color: #514852;
            }

            @media(max-width:600px) {
                .admin-add-row {
                    flex-direction: column;
                }

                .admin-add-row button {
                    width: 100%;
                }
            }

            @media(max-width:500px) {
                .product-modal-grid {
                    grid-template-columns: 1fr !important;
                }
            }
        `;

        document.head.appendChild(style);
    }

    /* -------------------------------------
       SUPABASE CONNECTION
    ------------------------------------- */

    async function connectSupabase() {

        if (!window.supabase?.createClient && !db) {

            await new Promise((resolve, reject) => {

                const script = document.createElement("script");

                script.src =
                    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

                script.onload = resolve;
                script.onerror = reject;

                document.head.appendChild(script);
            });
        }

        if (!db) {

            db = window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY
            );

            window.bounceSupabase = db;
        }
    }

    /* -------------------------------------
       ADMIN AUTHORIZATION
    ------------------------------------- */

    async function verifyAdmin() {

        const { data: userData, error: userError } =
            await db.auth.getUser();

        if (userError || !userData?.user) {
            currentUserId = null;
            return false;
        }

        currentUserId = userData.user.id;

        const { data, error } = await db.rpc("is_admin");

        if (error) {

            console.error("Admin verification failed:", error);

            throw new Error(
                "Could not verify admin permissions. Please try again."
            );
        }

        return data === true;
    }

    /* -------------------------------------
       NOTIFICATIONS
    ------------------------------------- */

    function notify(message, type = "success") {

        let notification = $("#admin-notification");

        if (!notification) {

            notification = document.createElement("div");
            notification.id = "admin-notification";

            Object.assign(notification.style, {
                position: "fixed",
                top: "20px",
                right: "20px",
                zIndex: "99999",
                padding: "14px 20px",
                borderRadius: "8px",
                color: "#fff",
                maxWidth: "90%",
                boxShadow: "0 5px 20px rgba(0,0,0,.15)"
            });

            document.body.appendChild(notification);
        }

        notification.style.background =
            type === "error" ? "#c0392b" : "#3F7625";

        notification.textContent = message;
        notification.style.display = "block";

        clearTimeout(notification._timer);

        notification._timer = setTimeout(() => {
            notification.style.display = "none";
        }, 4000);
    }

    /* -------------------------------------
       LOGIN SCREEN
    ------------------------------------- */

    function showLogin(message = "") {

        let overlay = $("#admin-login-overlay");

        if (!overlay) {

            overlay = document.createElement("div");
            overlay.id = "admin-login-overlay";

            overlay.innerHTML = `
                <div class="admin-login-card">

                    <img src="images/bounce-logo.jpeg"
                         alt="BOUNCE">

                    <h2>Welcome Back</h2>

                    <p>Login to manage your BOUNCE store.</p>

                    <form id="admin-login-form">

                        <label>Email</label>

                        <input
                            type="email"
                            id="login-email"
                            placeholder="Admin email"
                            autocomplete="username"
                            required
                        >

                        <label>Password</label>

                        <input
                            type="password"
                            id="login-password"
                            placeholder="Password"
                            autocomplete="current-password"
                            required
                        >

                        <button type="submit" id="login-submit">
                            LOGIN
                        </button>

                    </form>

                    <p id="login-error" role="alert"></p>

                </div>
            `;

            document.body.appendChild(overlay);

            const style = document.createElement("style");

            style.textContent = `
                #admin-login-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 99999;
                    background: #fff8fb;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }

                .admin-login-card {
                    width: 100%;
                    max-width: 420px;
                    background: white;
                    padding: 35px;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0,0,0,.08);
                }

                .admin-login-card img {
                    width: 100px;
                    height: 100px;
                    object-fit: contain;
                    display: block;
                    margin: 0 auto 15px;
                }

                .admin-login-card h2 {
                    text-align: center;
                    color: #C51F70;
                    margin-bottom: 8px;
                }

                .admin-login-card p {
                    text-align: center;
                    color: #514852;
                    margin-bottom: 25px;
                }

                .admin-login-card label {
                    display: block;
                    margin: 14px 0 7px;
                    font-weight: 600;
                    color: #29232A;
                }

                .admin-login-card input {
                    width: 100%;
                    padding: 13px;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    font: inherit;
                }

                .admin-login-card button {
                    width: 100%;
                    padding: 14px;
                    margin-top: 22px;
                    border: 0;
                    border-radius: 8px;
                    background: #C51F70;
                    color: white;
                    font-weight: bold;
                    cursor: pointer;
                }

                .admin-login-card button:disabled {
                    opacity: .6;
                    cursor: wait;
                }

                #login-error {
                    color: #c0392b;
                    margin: 15px 0 0;
                    font-size: 13px;
                }
            `;

            document.head.appendChild(style);

            $("#admin-login-form").addEventListener(
                "submit",
                async event => {

                    event.preventDefault();

                    const button = $("#login-submit");
                    const errorBox = $("#login-error");

                    button.disabled = true;
                    button.textContent = "PLEASE WAIT...";
                    errorBox.textContent = "";

                    try {

                        const { error } =
                            await db.auth.signInWithPassword({
                                email: $("#login-email").value.trim(),
                                password: $("#login-password").value
                            });

                        if (error) throw error;

                        const authorized = await verifyAdmin();

                        if (!authorized) {

                            await db.auth.signOut();

                            errorBox.textContent =
                                "This account does not have admin access.";

                            button.disabled = false;
                            button.textContent = "LOGIN";

                            return;
                        }

                        overlay.remove();

                        await initializeDashboard();

                    } catch (error) {

                        errorBox.textContent =
                            error.message || "Login failed.";

                        button.disabled = false;
                        button.textContent = "LOGIN";
                    }
                }
            );
        }

        const errorBox = $("#login-error");

        if (errorBox) {
            errorBox.textContent = message;
        }

        overlay.style.display = "flex";
    }

    /* -------------------------------------
       LOGOUT
    ------------------------------------- */

    async function logout() {

        const { error } = await db.auth.signOut();

        if (error) {
            notify(error.message, "error");
            return;
        }

        currentUserId = null;
        dashboardInitialized = false;

        showLogin();
    }

    /* -------------------------------------
       DASHBOARD INITIALIZATION
    ------------------------------------- */

    async function initializeDashboard() {

        if (dashboardInitialized) return;

        dashboardInitialized = true;

        addAdminStyles();

        const header = $(".admin-header");

        if (header && !$("#admin-logout")) {

            const logoutButton = document.createElement("button");

            logoutButton.type = "button";
            logoutButton.id = "admin-logout";
            logoutButton.className = "view-store-btn";

            logoutButton.innerHTML =
                '<i class="fa-solid fa-right-from-bracket"></i> Logout';

            logoutButton.addEventListener("click", logout);

            header.appendChild(logoutButton);
        }

        setupNavigation();
        setupProductButton();
        setupAdminManagement();

        await Promise.all([
            loadOverview(),
            loadProducts(),
            loadOrders(),
            loadAdmins()
        ]);
    }

    /* -------------------------------------
       NAVIGATION
    ------------------------------------- */

    function setupNavigation() {

        document.querySelectorAll(".menu-link[href^='#']")
            .forEach(link => {

                link.addEventListener("click", () => {

                    document.querySelectorAll(".menu-link")
                        .forEach(item =>
                            item.classList.remove("active")
                        );

                    link.classList.add("active");
                });
            });
    }

    /* -------------------------------------
       OVERVIEW STATISTICS
    ------------------------------------- */

    async function loadOverview() {

        const [
            productsResult,
            ordersResult
        ] = await Promise.all([

            db.from("products")
                .select("id, is_active", { count: "exact" }),

            db.from("orders")
                .select("id, total, status")
        ]);

        if (productsResult.error || ordersResult.error) {

            notify(
                productsResult.error?.message ||
                ordersResult.error?.message,
                "error"
            );

            return;
        }

        const products = productsResult.data || [];
        const orders = ordersResult.data || [];

        const revenue = orders
            .filter(order => order.status !== "cancelled")
            .reduce(
                (sum, order) => sum + Number(order.total || 0),
                0
            );

        $("#total-products").textContent = products.length;
        $("#total-orders").textContent = orders.length;
        $("#total-revenue").textContent = money(revenue);

        $("#active-offers").textContent = "0";
    }

    /* -------------------------------------
       PRODUCTS
    ------------------------------------- */

    function setupProductButton() {

        const button = $("#add-product-btn");

        if (button) {
            button.addEventListener("click", () => {
                openProductModal();
            });
        }
    }

    async function loadProducts() {

        const tbody = $("#admin-products-list");

        if (!tbody) return;

        const { data, error } = await db
            .from("products")
            .select("*")
            .order("id", { ascending: true });

        if (error) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        ${escapeHTML(error.message)}
                    </td>
                </tr>
            `;

            return;
        }

        if (!data?.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-table">
                        No products found.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = data.map(product => `
            <tr>

                <td>
                    <strong>${escapeHTML(product.name)}</strong>
                    <br>
                    <small>${escapeHTML(product.line || "")}</small>
                </td>

                <td>Hair Care</td>

                <td>${money(product.price)}</td>

                <td>${money(product.old_price)}</td>

                <td>
                    <span class="status ${
                        product.is_active
                            ? "active-status"
                            : "inactive-status"
                    }">
                        ${product.is_active ? "Active" : "Hidden"}
                    </span>
                </td>

                <td>
                    <div class="admin-product-actions">

                        <button
                            type="button"
                            class="edit-product-action"
                            data-id="${escapeHTML(product.id)}">
                            <i class="fa-solid fa-pen"></i> Edit
                        </button>

                        <button
                            type="button"
                            class="toggle-product-action"
                            data-id="${escapeHTML(product.id)}"
                            data-active="${product.is_active}">
                            ${product.is_active ? "Hide" : "Show"}
                        </button>

                    </div>
                </td>

            </tr>
        `).join("");

        tbody.querySelectorAll(".edit-product-action")
            .forEach(button => {

                button.addEventListener("click", () => {

                    const product = data.find(
                        item => String(item.id) === button.dataset.id
                    );

                    if (product) openProductModal(product);
                });
            });

        tbody.querySelectorAll(".toggle-product-action")
            .forEach(button => {

                button.addEventListener("click", async () => {

                    const id = button.dataset.id;
                    const isActive = button.dataset.active === "true";

                    const { error } = await db
                        .from("products")
                        .update({ is_active: !isActive })
                        .eq("id", id);

                    if (error) {
                        notify(error.message, "error");
                        return;
                    }

                    notify("Product availability updated.");

                    await loadProducts();
                    await loadOverview();
                });
            });
    }

    /* -------------------------------------
       ADD / EDIT PRODUCT MODAL
    ------------------------------------- */

    function openProductModal(product = null) {

        let modal = $("#product-modal");

        if (!modal) {

            modal = document.createElement("div");
            modal.id = "product-modal";

            document.body.appendChild(modal);

            const style = document.createElement("style");

            style.textContent = `
                #product-modal {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,.5);
                    z-index: 9998;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                    overflow-y: auto;
                }

                .product-modal-card {
                    background: white;
                    width: 100%;
                    max-width: 600px;
                    padding: 25px;
                    border-radius: 14px;
                }

                .product-modal-card h2 {
                    color: #C51F70;
                    margin-top: 0;
                }

                .product-modal-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }

                .product-modal-field {
                    display: flex;
                    flex-direction: column;
                    gap: 7px;
                }

                .product-modal-field.full {
                    grid-column: 1 / -1;
                }

                .product-modal-field input,
                .product-modal-field textarea {
                    padding: 11px;
                    border: 1px solid #ddd;
                    border-radius: 7px;
                    font: inherit;
                    width: 100%;
                }

                .product-modal-field textarea {
                    min-height: 90px;
                }

                .product-modal-actions {
                    display: flex;
                    gap: 10px;
                    margin-top: 20px;
                }

                .product-modal-actions button {
                    padding: 12px 18px;
                    border: 0;
                    border-radius: 7px;
                    cursor: pointer;
                }

                .product-save {
                    background: #C51F70;
                    color: white;
                }

                .product-cancel {
                    background: #eee;
                    color: #29232A;
                }
            `;

            document.head.appendChild(style);
        }

        modal.innerHTML = `
            <div class="product-modal-card">

                <h2>${product ? "Edit Product" : "Add New Product"}</h2>

                <form id="product-modal-form">

                    <div class="product-modal-grid">

                        <div class="product-modal-field">
                            <label>Product Name</label>
                            <input name="name"
                                value="${escapeHTML(product?.name || "")}"
                                required>
                        </div>

                        <div class="product-modal-field">
                            <label>Collection</label>
                            <input name="line"
                                value="${escapeHTML(product?.line || "")}">
                        </div>

                        <div class="product-modal-field">
                            <label>Price (EGP)</label>
                            <input name="price" type="number"
                                min="0" step="0.01"
                                value="${product?.price ?? ""}" required>
                        </div>

                        <div class="product-modal-field">
                            <label>Old Price (EGP)</label>
                            <input name="old_price" type="number"
                                min="0" step="0.01"
                                value="${product?.old_price ?? ""}">
                        </div>

                        <div class="product-modal-field full">
                            <label>Image URL</label>
                            <input name="image" type="url"
                                value="${escapeHTML(product?.image || "")}">
                        </div>

                        <div class="product-modal-field full">
                            <label>Description</label>
                            <textarea name="description">${escapeHTML(product?.description || "")}</textarea>
                        </div>

                        <div class="product-modal-field full">
                            <label>
                                <input type="checkbox" name="is_new"
                                    ${product?.is_new ? "checked" : ""}>
                                New Product
                            </label>
                        </div>

                    </div>

                    <div class="product-modal-actions">

                        <button class="product-save" type="submit">
                            ${product ? "Save Changes" : "Add Product"}
                        </button>

                        <button class="product-cancel" type="button"
                            id="close-product-modal">
                            Cancel
                        </button>

                    </div>

                </form>

            </div>
        `;

        $("#close-product-modal").addEventListener("click", () => {
            modal.remove();
        });

        $("#product-modal-form").addEventListener(
            "submit",
            async event => {

                event.preventDefault();

                const form = event.currentTarget;
                const button = form.querySelector('[type="submit"]');
                const formData = new FormData(form);

                const name = String(formData.get("name") || "").trim();
                const price = Number(formData.get("price"));

                if (!name || !Number.isFinite(price) || price < 0) {

                    notify(
                        "Please enter a valid product name and price.",
                        "error"
                    );

                    return;
                }

                const oldPriceValue = formData.get("old_price");

                const oldPrice = oldPriceValue
                    ? Number(oldPriceValue)
                    : null;

                if (
                    oldPrice !== null &&
                    (!Number.isFinite(oldPrice) || oldPrice < 0)
                ) {
                    notify("Please enter a valid old price.", "error");
                    return;
                }

                const payload = {
                    name,
                    line: String(formData.get("line") || "").trim(),
                    price,
                    old_price: oldPrice,
                    image: String(formData.get("image") || "").trim() || null,
                    description: String(formData.get("description") || "").trim(),
                    category: "hair",
                    is_new: formData.has("is_new")
                };

                button.disabled = true;
                button.textContent = "Saving...";

                try {

                    let result;

                    if (product) {

                        result = await db
                            .from("products")
                            .update(payload)
                            .eq("id", product.id);

                    } else {

                        payload.is_active = true;

                        result = await db
                            .from("products")
                            .insert(payload);
                    }

                    if (result.error) throw result.error;

                    modal.remove();

                    notify(
                        product
                            ? "Product updated successfully."
                            : "Product added successfully."
                    );

                    await loadProducts();
                    await loadOverview();

                } catch (error) {

                    notify(
                        error.message || "Could not save product.",
                        "error"
                    );

                    button.disabled = false;

                    button.textContent =
                        product ? "Save Changes" : "Add Product";
                }
            }
        );
    }

    /* -------------------------------------
       ORDERS
    ------------------------------------- */

    async function loadOrders() {

        const tbody = $("#admin-orders-list");

        if (!tbody) return;

        const { data, error } = await db
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6">
                        ${escapeHTML(error.message)}
                    </td>
                </tr>
            `;

            return;
        }

        if (!data?.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-table">
                        No orders available yet.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = data.map(order => `
            <tr>

                <td>#${escapeHTML(order.id)}</td>

                <td>
                    <strong>${escapeHTML(order.customer_name)}</strong>

                    <div class="order-phone-row">

                        <small>${escapeHTML(order.phone)}</small>

                        ${whatsappButton(order.phone)}

                    </div>
                </td>

                <td>
                    ${new Date(order.created_at).toLocaleDateString()}
                </td>

                <td>${money(order.total)}</td>

                <td>
                    <select class="order-status-select"
                        data-order-id="${escapeHTML(order.id)}">

                        ${[
                            "pending",
                            "confirmed",
                            "processing",
                            "shipped",
                            "delivered",
                            "cancelled"
                        ].map(status => `
                            <option value="${status}"
                                ${order.status === status ? "selected" : ""}>
                                ${status.charAt(0).toUpperCase() + status.slice(1)}
                            </option>
                        `).join("")}

                    </select>
                </td>

                <td>
                    <button
                        type="button"
                        class="view-order-btn"
                        data-order-id="${escapeHTML(order.id)}">
                        View Details
                    </button>
                </td>

            </tr>
        `).join("");

        tbody.querySelectorAll(".order-status-select")
            .forEach(select => {

                select.addEventListener("change", async () => {

                    const { error } = await db
                        .from("orders")
                        .update({ status: select.value })
                        .eq("id", select.dataset.orderId);

                    if (error) {

                        notify(error.message, "error");

                        await loadOrders();

                        return;
                    }

                    notify("Order status updated.");

                    await loadOverview();
                });
            });

        tbody.querySelectorAll(".view-order-btn")
            .forEach(button => {

                button.addEventListener("click", () => {

                    const order = data.find(
                        item => String(item.id) === button.dataset.orderId
                    );

                    if (order) showOrderDetails(order);
                });
            });
    }

    /* -------------------------------------
       ORDER DETAILS
    ------------------------------------- */

    async function showOrderDetails(order) {

        const { data: items, error } = await db
            .from("order_items")
            .select("*")
            .eq("order_id", order.id);

        if (error) {
            notify(error.message, "error");
            return;
        }

        let modal = $("#order-details-modal");

        if (!modal) {

            modal = document.createElement("div");
            modal.id = "order-details-modal";

            Object.assign(modal.style, {
                position: "fixed",
                inset: "0",
                background: "rgba(0,0,0,.5)",
                zIndex: "9998",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px"
            });

            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div style="
                background:white;
                padding:25px;
                border-radius:12px;
                width:100%;
                max-width:550px;
                max-height:85vh;
                overflow:auto;
                color:#29232A;
            ">

                <h2>Order #${escapeHTML(order.id)}</h2>

                <p>
                    <strong>Customer:</strong>
                    ${escapeHTML(order.customer_name)}
                </p>

                <div class="order-phone-row">

                    <strong>Phone:</strong>

                    <span>${escapeHTML(order.phone)}</span>

                    ${whatsappButton(order.phone)}

                </div>

                <p>
                    <strong>Governorate:</strong>
                    ${escapeHTML(order.governorate)}
                </p>

                <p>
                    <strong>City:</strong>
                    ${escapeHTML(order.city)}
                </p>

                <p>
                    <strong>Address:</strong>
                    ${escapeHTML(order.address)}
                </p>

                <p>
                    <strong>Notes:</strong>
                    ${escapeHTML(order.notes || "No notes")}
                </p>

                <hr>

                <h3>Products</h3>

                ${(items || []).map(item => `
                    <p>
                        ${escapeHTML(item.product_name)}
                        × ${Number(item.quantity)}
                        — ${money(
                            Number(item.unit_price) * Number(item.quantity)
                        )}
                    </p>
                `).join("")}

                <hr>

                <p>Subtotal: ${money(order.subtotal)}</p>

                <p>Shipping: ${money(order.shipping)}</p>

                <h3>Total: ${money(order.total)}</h3>

                <button id="close-order-details"
                    style="
                        background:#C51F70;
                        color:white;
                        border:0;
                        padding:12px 20px;
                        border-radius:7px;
                        cursor:pointer;
                        margin-top:10px;
                    ">
                    Close
                </button>

            </div>
        `;

        $("#close-order-details").addEventListener("click", () => {
            modal.remove();
        });
    }

    /* -------------------------------------
       ADMIN MANAGEMENT UI
    ------------------------------------- */

    function setupAdminManagement() {

        const sidebar = $(".sidebar-menu");
        const main = $(".admin-main");

        if (!sidebar || !main) return;

        if (!$("#admin-management-link")) {

            const link = document.createElement("a");

            link.href = "#admin-management";
            link.className = "menu-link";
            link.id = "admin-management-link";

            link.innerHTML = `
                <i class="fa-solid fa-user-shield"></i>
                <span>Admin Management</span>
            `;

            const storeLabel =
                sidebar.querySelector(".settings-label");

            if (storeLabel) {
                sidebar.insertBefore(link, storeLabel);
            } else {
                sidebar.appendChild(link);
            }

            link.addEventListener("click", () => {

                document.querySelectorAll(".menu-link")
                    .forEach(item => item.classList.remove("active"));

                link.classList.add("active");
            });
        }

        if (!$("#admin-management")) {

            const section = document.createElement("section");

            section.className = "dashboard-section";
            section.id = "admin-management";

            section.innerHTML = `
                <div class="section-title">
                    <div>
                        <h2>Admin Management</h2>
                        <p>Add or remove access to the BOUNCE dashboard.</p>
                    </div>
                </div>

                <div class="admin-management-card">

                    <h3>Add a New Admin</h3>

                    <p>
                        Enter the UID of an existing Supabase Auth user.
                        The user must already have an account.
                    </p>

                    <form id="add-admin-form">

                        <label for="new-admin-uid">User UID</label>

                        <div class="admin-add-row">

                            <input
                                type="text"
                                id="new-admin-uid"
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                required
                            >

                            <button type="submit" id="add-admin-submit">
                                <i class="fa-solid fa-plus"></i>
                                Add Admin
                            </button>

                        </div>

                    </form>

                    <p class="admin-management-note">
                        Create the user's account in Supabase Authentication
                        first, then add their UID here.
                    </p>

                </div>

                <div class="dashboard-table-wrapper">

                    <table class="dashboard-table">

                        <thead>
                            <tr>
                                <th>ADMIN USER ID</th>
                                <th>DATE ADDED</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>

                        <tbody id="admin-users-list">
                            <tr>
                                <td colspan="3" class="empty-table">
                                    Loading admins...
                                </td>
                            </tr>
                        </tbody>

                    </table>

                </div>
            `;

            const footer = $(".admin-footer");

            if (footer) {
                main.insertBefore(section, footer);
            } else {
                main.appendChild(section);
            }

            $("#add-admin-form").addEventListener(
                "submit",
                addAdmin
            );
        }
    }

    /* -------------------------------------
       LOAD ADMINS
    ------------------------------------- */

    async function loadAdmins() {

        const tbody = $("#admin-users-list");

        if (!tbody) return;

        const { data, error } = await db
            .from("admin_users")
            .select("user_id, created_at")
            .order("created_at", { ascending: true });

        if (error) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="3">
                        ${escapeHTML(error.message)}
                    </td>
                </tr>
            `;

            notify("Could not load admin accounts.", "error");

            return;
        }

        if (!data?.length) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="3" class="empty-table">
                        No admin accounts found.
                    </td>
                </tr>
            `;

            return;
        }

        tbody.innerHTML = data.map(admin => {

            const isCurrentAdmin =
                admin.user_id === currentUserId;

            const date = admin.created_at
                ? new Date(admin.created_at).toLocaleDateString()
                : "—";

            return `
                <tr>

                    <td>
                        <strong>${escapeHTML(admin.user_id)}</strong>

                        ${isCurrentAdmin
                            ? '<br><span class="admin-current-label">CURRENT ACCOUNT</span>'
                            : ""}
                    </td>

                    <td>${escapeHTML(date)}</td>

                    <td>
                        ${isCurrentAdmin
                            ? '<span class="admin-current-label">Protected</span>'
                            : `
                                <button
                                    type="button"
                                    class="admin-remove-btn"
                                    data-admin-id="${escapeHTML(admin.user_id)}">
                                    Remove Access
                                </button>
                            `
                        }
                    </td>

                </tr>
            `;
        }).join("");

        tbody.querySelectorAll(".admin-remove-btn")
            .forEach(button => {

                button.addEventListener("click", async () => {

                    const userId = button.dataset.adminId;

                    if (userId === currentUserId) {

                        notify(
                            "You cannot remove your own access here.",
                            "error"
                        );

                        return;
                    }

                    const confirmed = confirm(
                        "Are you sure you want to remove admin access from this account?"
                    );

                    if (!confirmed) return;

                    button.disabled = true;
                    button.textContent = "Removing...";

                    const { error } = await db
                        .from("admin_users")
                        .delete()
                        .eq("user_id", userId);

                    if (error) {

                        notify(error.message, "error");

                        button.disabled = false;
                        button.textContent = "Remove Access";

                        return;
                    }

                    notify("Admin access removed.");

                    await loadAdmins();
                });
            });
    }

    /* -------------------------------------
       ADD ADMIN
    ------------------------------------- */

    async function addAdmin(event) {

        event.preventDefault();

        const input = $("#new-admin-uid");
        const button = $("#add-admin-submit");

        const userId = input.value.trim();

        const uuidPattern =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        if (!uuidPattern.test(userId)) {

            notify("Please enter a valid User UID.", "error");

            return;
        }

        button.disabled = true;
        button.textContent = "Adding...";

        try {

            const { error } = await db
                .from("admin_users")
                .insert({ user_id: userId });

            if (error) throw error;

            input.value = "";

            notify("New admin added successfully.");

            await loadAdmins();

        } catch (error) {

            if (error.code === "23505") {

                notify(
                    "This user is already an admin.",
                    "error"
                );

            } else if (error.code === "23503") {

                notify(
                    "This UID does not belong to an existing Supabase Auth user.",
                    "error"
                );

            } else {

                notify(
                    error.message || "Could not add admin.",
                    "error"
                );
            }

        } finally {

            button.disabled = false;

            button.innerHTML =
                '<i class="fa-solid fa-plus"></i> Add Admin';
        }
    }

    /* -------------------------------------
       INITIAL START
    ------------------------------------- */

    try {

        await connectSupabase();

        const { data, error } = await db.auth.getSession();

        if (error) throw error;

        if (!data.session) {

            showLogin();

        } else {

            const authorized = await verifyAdmin();

            if (!authorized) {

                await db.auth.signOut();

                showLogin(
                    "This account does not have admin access."
                );

            } else {

                await initializeDashboard();
            }
        }

        db.auth.onAuthStateChange((event, session) => {

            if (event === "SIGNED_OUT" || !session) {

                currentUserId = null;
                dashboardInitialized = false;

                const section = $("#admin-management");

                if (section) section.remove();

                const link = $("#admin-management-link");

                if (link) link.remove();

                const logoutButton = $("#admin-logout");

                if (logoutButton) logoutButton.remove();

                showLogin();
            }
        });

    } catch (error) {

        console.error("BOUNCE Admin:", error);

        dashboardInitialized = false;

        showLogin(
            error.message ||
            "Could not connect to the admin dashboard."
        );
    }

});
