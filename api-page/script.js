document.addEventListener('DOMContentLoaded', async () => {
    const loadingScreen = document.getElementById("loadingScreen");
    const body = document.body;
    body.classList.add("no-scroll");

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
        
        setContent('page', 'textContent', settings.name || "FxyyCxx");
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

            modalRefs.queryInputContainer.innerHTML = '';
            modalRefs.submitBtn.classList.add('d-none');

            let baseApiUrl = `${window.location.origin}${apiPath}`;
            let params = new URLSearchParams(apiPath.split('?')[1]);
            let hasParams = params.toString().length > 0;

            if (hasParams) {
                const paramContainer = document.createElement('div');
                paramContainer.className = 'param-container';

                const paramsArray = Array.from(params.keys());
                
                paramsArray.forEach((param, index) => {
                    const paramGroup = document.createElement('div');
                    paramGroup.className = index < paramsArray.length - 1 ? 'mb-2' : '';

                    const inputField = document.createElement('input');
                    inputField.type = 'text';
                    inputField.className = 'form-control';
                    inputField.placeholder = `Enter ${param}...`;
                    inputField.dataset.param = param;

                    inputField.required = true;
                    inputField.addEventListener('input', validateInputs);

                    paramGroup.appendChild(inputField);
                    paramContainer.appendChild(paramGroup);
                });
                
                const currentItem = settings.categories
                    .flatMap(category => category.items)
                    .find(item => item.path === apiPath);

                if (currentItem && currentItem.innerDesc) {
                    const innerDescDiv = document.createElement('div');
                    innerDescDiv.className = 'text-muted mt-2';
                    innerDescDiv.style.fontSize = '13px';
                    innerDescDiv.innerHTML = currentItem.innerDesc.replace(/\n/g, '<br>');
                    paramContainer.appendChild(innerDescDiv);
                }

                modalRefs.queryInputContainer.appendChild(paramContainer);
                modalRefs.submitBtn.classList.remove('d-none');

                modalRefs.submitBtn.onclick = async () => {
                    const inputs = modalRefs.queryInputContainer.querySelectorAll('input');
                    const newParams = new URLSearchParams();
                    let isValid = true;

                    inputs.forEach(input => {
                        if (!input.value.trim()) {
                            isValid = false;
                            input.classList.add('is-invalid');
                        } else {
                            input.classList.remove('is-invalid');
                            newParams.append(input.dataset.param, input.value.trim());
                        }
                    });

                    if (!isValid) {
                        modalRefs.content.textContent = 'Please fill in all required fields.';
                        modalRefs.content.classList.remove('d-none');
                        return;
                    }

                    const apiUrlWithParams = `${window.location.origin}${apiPath.split('?')[0]}?${newParams.toString()}`;
                    
                    modalRefs.queryInputContainer.innerHTML = '';
                    modalRefs.submitBtn.classList.add('d-none');
                    handleApiRequest(apiUrlWithParams, modalRefs, apiName);
                };
            } else {
                handleApiRequest(baseApiUrl, modalRefs, apiName);
            }

            modal.show();
        });

        function validateInputs() {
            const submitBtn = document.getElementById('submitQueryBtn');
            const inputs = document.querySelectorAll('.param-container input');
            const isValid = Array.from(inputs).every(input => input.value.trim() !== '');
            submitBtn.disabled = !isValid;
        }

        async function handleApiRequest(apiUrl, modalRefs, apiName) {
            modalRefs.spinner.classList.remove('d-none');
            modalRefs.content.classList.add('d-none');

            try {
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
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    } finally {
        setTimeout(() => {
            loadingScreen.style.display = "none";
            body.classList.remove("no-scroll");
        }, 2000);
    }
});

window.addEventListener('scroll', () => {
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
