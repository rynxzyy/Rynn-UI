document.addEventListener('DOMContentLoaded', async () => {
    try {
        const settings = await fetch('/src/settings.json').then(res => res.json());
        
        const setContent = (id, property, value) => {
            const element = document.getElementById(id);
            if (element) element[property] = value;
        };

        const randomImageSrc =
            Array.isArray(settings.header.imageSrc) && settings.header.imageSrc.length > 0
                ? settings.header.imageSrc[Math.floor(Math.random() * settings.header.imageSrc.length)]
                : "";

        const dynamicImage = document.getElementById('dynamicImage');
        if (dynamicImage) {
            dynamicImage.src = randomImageSrc;

            const setImageSize = () => {
                const screenWidth = window.innerWidth;
                if (screenWidth < 768) {
                    dynamicImage.style.maxWidth = settings.header.imageSize.mobile || "80%";
                } else if (screenWidth < 1200) {
                    dynamicImage.style.maxWidth = settings.header.imageSize.tablet || "40%";
                } else {
                    dynamicImage.style.maxWidth = settings.header.imageSize.desktop || "40%";
                }
                dynamicImage.style.height = "auto";
            };
            
            setImageSize();
            window.addEventListener('resize', setImageSize);
        }
        
        setContent('page', 'textContent', settings.name || "Rynn UI");
        setContent('header', 'textContent', settings.name || "Rynn UI");
        setContent('name', 'textContent', settings.name || "Rynn UI");
        setContent('version', 'textContent', settings.version || "v1.0 Beta");
        setContent('versionHeader', 'textContent', settings.header.status || "Online!");
        setContent('description', 'textContent', settings.description || "Simple API's");

        const apiLinksContainer = document.getElementById('apiLinks');
        if (apiLinksContainer && settings.links?.length) {
            settings.links.forEach(({ url, name }) => {
                const link = Object.assign(document.createElement('a'), {
                    href: url,
                    textContent: name,
                    target: '_blank',
                    className: 'lead'
                });
                apiLinksContainer.appendChild(link);
            });
        }

        const apiContent = document.getElementById('apiContent');
        settings.categories.forEach((category) => {
            const sortedItems = category.items.sort((a, b) => a.name.localeCompare(b.name));
            const categoryContent = sortedItems.map((item, index, array) => {
                const isLastItem = index === array.length - 1;
                const itemClass = `col-md-6 col-lg-4 api-item ${isLastItem ? 'mb-4' : 'mb-2'}`;
                return `
                    <div class="${itemClass}" data-name="${item.name}" data-desc="${item.desc}">
                        <div class="hero-section d-flex align-items-center justify-content-between" style="height: 70px;">
                            <div>
                                <h5 class="mb-0" style="font-size: 18px;">${item.name}</h5>
                                <p class="text-muted mb-0" style="font-size: 0.8rem;">${item.desc}</p>
                            </div>
                            <button class="btn btn-dark btn-sm get-api-btn" data-api-path="${item.path}" data-api-name="${item.name}" data-api-desc="${item.desc}">
                                GET
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
            apiContent.insertAdjacentHTML('beforeend', `<h3 class="mb-3 category-header" style="font-size: 22px;">${category.name}</h3><div class="row">${categoryContent}</div>`);
        });
      
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            const apiItems = document.querySelectorAll('.api-item');
            const categoryHeaders = document.querySelectorAll('.category-header');

            apiItems.forEach(item => {
                const name = item.getAttribute('data-name').toLowerCase();
                const desc = item.getAttribute('data-desc').toLowerCase();
                item.style.display = (name.includes(searchTerm) || desc.includes(searchTerm)) ? '' : 'none';
            });

            categoryHeaders.forEach(header => {
                const categoryRow = header.nextElementSibling;
                const visibleItems = categoryRow.querySelectorAll('.api-item:not([style*="display: none"])');
                header.style.display = visibleItems.length ? '' : 'none';
            });
        });

        document.addEventListener('click', event => {
            if (!event.target.classList.contains('get-api-btn')) return;

            const { apiPath, apiName, apiDesc } = event.target.dataset;
            const modal = new bootstrap.Modal(document.getElementById('apiResponseModal'));
            const modalRefs = {
                label: document.getElementById('apiResponseModalLabel'),
                desc: document.getElementById('apiResponseModalDesc'),
                content: document.getElementById('apiResponseContent'),
                endpoint: document.getElementById('apiEndpoint'),
                spinner: document.getElementById('apiResponseLoading'),
                queryInputContainer: document.getElementById('apiQueryInputContainer'),
                submitBtn: document.getElementById('submitQueryBtn')
            };

            modalRefs.label.textContent = apiName;
            modalRefs.desc.textContent = apiDesc;
            modalRefs.content.textContent = '';
            modalRefs.endpoint.textContent = '';
            modalRefs.spinner.classList.add('d-none');
            modalRefs.content.classList.add('d-none');
            modalRefs.endpoint.classList.add('d-none');

            const queryPlaceholder = new URLSearchParams(apiPath.split('?')[1]).keys().next().value || 'query';
            const inputField = Object.assign(document.createElement('input'), {
                type: 'text',
                className: 'form-control',
                placeholder: `Enter ${queryPlaceholder}...`
            });

            modalRefs.queryInputContainer.replaceChildren(inputField);

            modalRefs.submitBtn.classList.remove('d-none');
            modalRefs.submitBtn.onclick = async () => {
                const query = inputField.value;
                if (!query) {
                    modalRefs.content.textContent = 'Please enter a query.';
                    modalRefs.content.classList.remove('d-none');
                    return;
                }

                modalRefs.spinner.classList.remove('d-none');
                modalRefs.content.classList.add('d-none');
                modalRefs.submitBtn.classList.add('d-none');
                modalRefs.queryInputContainer.innerHTML = '';

                try {
                    const apiUrl = `${window.location.origin}${apiPath}${encodeURIComponent(query)}`;
                    const response = await fetch(apiUrl);

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const contentType = response.headers.get('Content-Type');
                    if (contentType && contentType.startsWith('image/')) {
                        const blob = await response.blob();
                        const imageUrl = URL.createObjectURL(blob);
            
                        const img = document.createElement('img');
                        img.src = imageUrl;
                        img.alt = apiName;
                        img.style.maxWidth = '100%';
                        img.style.height = 'auto';
                        img.style.borderRadius = '5px';
            
                        modalRefs.content.innerHTML = '';
                        modalRefs.content.appendChild(img);
                    } else {
                        const data = await response.json();
                        modalRefs.content.textContent = JSON.stringify(data, null, 2);
                    }

                    modalRefs.endpoint.textContent = apiUrl;
                    modalRefs.endpoint.classList.remove('d-none');
                } catch (error) {
                    modalRefs.content.textContent = `Error: ${error.message}`;
                } finally {
                    modalRefs.spinner.classList.add('d-none');
                    modalRefs.content.classList.remove('d-none');
                }
            };

            modal.show();
        });
    } catch (error) {
        console.error('Error loading settings:', error);
    }
});

window.addEventListener('scroll', function () {
    const navbar = document.querySelector('.navbar');
    const navbarBrand = document.querySelector('.navbar-brand');
    if (window.scrollY > 0) {
        navbarBrand.classList.add('visible');
        navbar.classList.add('scrolled');
    } else {
        navbarBrand.classList.remove('visible');
        navbar.classList.remove('scrolled');
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const loadingScreen = document.getElementById("loadingScreen");
    const body = document.body;
    body.classList.add("no-scroll");
    setTimeout(() => {
        loadingScreen.style.display = "none";
        body.classList.remove("no-scroll");
    }, 2000);
});
