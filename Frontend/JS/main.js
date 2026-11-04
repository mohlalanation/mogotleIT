const API = 'http://localhost:3000/api';
let allProviders = [];

// Load categories
async function loadCategories() {
    const res = await fetch(`${API}/providers/meta/categories`);
    const categories = await res.json();
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = '';
    categories.forEach(cat => {
        grid.innerHTML += `
            <div class="cat-card" onclick="filterByCategory(${cat.id})">
                <div class="cat-icon"><i class="fas ${cat.icon}"></i></div>
                <div>${cat.name}</div>
            </div>
        `;
    });
}

// Load approved providers
async function loadProviders() {
    const grid = document.getElementById('providersGrid');
    try {
        const res = await fetch(`${API}/providers`);
        allProviders = await res.json();
        renderProviders(allProviders);
    } catch (err) {
        grid.innerHTML = '<p style="color:red;">❌ Could not load providers. Is the server running?</p>';
    }
}

// Render providers
function renderProviders(providers) {
    const grid = document.getElementById('providersGrid');
    grid.innerHTML = '';

    if (providers.length === 0) {
        grid.innerHTML = '<p>No providers found in this area yet.</p>';
        return;
    }

    providers.forEach(p => {
        const initial = p.business_name.charAt(0).toUpperCase();
        grid.innerHTML += `
            <div class="provider-card">
                <div style="position:relative;">
                    <div class="p-img">
                        ${p.image_url ? `<img src="${p.image_url}" style="width:100%;height:100%;object-fit:cover;">` : initial}
                    </div>
                    ${p.is_verified ? '<span class="badge-verified">VERIFIED</span>' : ''}
                </div>
                <div class="p-info">
                    <div class="p-title">${p.business_name}</div>
                    <div class="p-cat">${p.category_name}</div>
                    <div class="p-rating">
                        <i class="fas fa-star"></i> ${p.rating} 
                        <span style="color:#888;">(${p.review_count} reviews)</span>
                    </div>
                    <div style="font-size:0.85rem;color:#777;">
                        <i class="fas fa-map-marker-alt"></i> ${p.location}
                    </div>
                    <div class="p-actions">
                        <a href="https://wa.me/27${p.whatsapp_number.replace(/^0/, '')}?text=Hi%20${encodeURIComponent(p.business_name)},%20I%20found%20you%20on%20MogotelT%20and%20I%20need%20help." 
                           target="_blank" class="btn-sm btn-wa">
                            <i class="fab fa-whatsapp"></i> WhatsApp
                        </a>
                        <a href="request-service.html?provider_id=${p.id}" class="btn-sm btn-view">
                            Request Service
                        </a>
                    </div>
                </div>
            </div>
        `;
    });
}

// Search filter
function filterProviders() {
    const query = document.getElementById('searchInput').value.toLowerCase();
    const loc = document.getElementById('locationInput').value.toLowerCase();

    const filtered = allProviders.filter(p =>
        (p.business_name.toLowerCase().includes(query) ||
         p.category_name.toLowerCase().includes(query)) &&
        p.location.toLowerCase().includes(loc)
    );
    renderProviders(filtered);
}

// Category filter
function filterByCategory(categoryId) {
    const filtered = allProviders.filter(p => p.category_id === categoryId);
    renderProviders(filtered);
    document.getElementById('providers').scrollIntoView({ behavior: 'smooth' });
}

// Initialize
loadCategories();
loadProviders();