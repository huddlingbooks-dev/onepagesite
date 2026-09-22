document.addEventListener('DOMContentLoaded', () => {
    // Global Book Data Storage
    let booksData = [];

    // Select Elements
    const header = document.getElementById('header');
    const navToggle = document.getElementById('navToggle');
    const mainNav = document.getElementById('mainNav');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const booksGrid = document.getElementById('booksGrid');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Modal Elements
    const bookModal = document.getElementById('bookModal');
    const modalClose = document.getElementById('modalClose');
    const modalBackdrop = document.getElementById('modalBackdrop');
    const modalBody = document.getElementById('modalBody');
    
    // Form Elements
    const submissionForm = document.getElementById('submissionForm');
    const btnSubmit = document.getElementById('btnSubmit');
    const alertModal = document.getElementById('alertModal');
    const alertClose = document.getElementById('alertClose');
    const alertModalBackdrop = document.querySelector('.alert-modal-backdrop');

    /* ==========================================================================
       1. Header Scroll Effect & Mobile Nav Toggle
       ========================================================================== */
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Hamburger Menu Click
    navToggle.addEventListener('click', () => {
        mainNav.classList.toggle('active');
        const icon = navToggle.querySelector('i');
        if (mainNav.classList.contains('active')) {
            icon.className = 'fa-solid fa-xmark';
        } else {
            icon.className = 'fa-solid fa-bars';
        }
    });

    // Close Mobile Menu on Nav Link Click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('active');
            navToggle.querySelector('i').className = 'fa-solid fa-bars';
        });
    });

    /* ==========================================================================
       2. Dynamic Data Fetch & Rendering (books.js / books.json)
       ========================================================================== */
    async function fetchBooks() {
        // 1. Check if booksData is already loaded via books.js (CORS bypass for local file://)
        if (window.booksData && Array.isArray(window.booksData)) {
            booksData = window.booksData;
            renderBooks(booksData);
            return;
        }

        // 2. Fallback to books.json fetch if running on a server
        try {
            const response = await fetch('books.json');
            if (!response.ok) {
                throw new Error('도서 데이터를 가져오는 데 실패했습니다.');
            }
            booksData = await response.json();
            renderBooks(booksData);
        } catch (error) {
            console.error('Error fetching books:', error);
            booksGrid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fa-solid fa-circle-exclamation" style="color: #e06c75; font-size: 2rem;"></i>
                    <p>데이터 로딩 오류: ${error.message}</p>
                </div>
            `;
        }
    }

    function renderBooks(books) {
        if (books.length === 0) {
            booksGrid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fa-solid fa-folder-open" style="font-size: 2rem;"></i>
                    <p>해당 카테고리에 등록된 도서가 없습니다.</p>
                </div>
            `;
            return;
        }

        booksGrid.innerHTML = '';
        books.forEach((book, index) => {
            const bookCard = document.createElement('div');
            bookCard.className = `book-card ${book.categoryEng}`;
            // Staggered card entrance animation delay
            bookCard.style.animationDelay = `${index * 0.04}s`;
            bookCard.setAttribute('data-id', book.id);
            
            bookCard.innerHTML = `
                <div class="book-img-wrapper">
                    <img src="${book.image}" alt="${book.title} 표지">
                    <span class="book-tag">${book.category}</span>
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <div class="book-meta">
                        <span class="book-author">${book.author}</span>
                        <span class="book-date">${book.date}</span>
                    </div>
                </div>
            `;
            
            // Add click event for modal popup
            bookCard.addEventListener('click', () => openBookModal(book));
            booksGrid.appendChild(bookCard);
        });
    }

    /* ==========================================================================
       3. Category Filtering System
       ========================================================================== */
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active style from all buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');
            
            const filterValue = button.getAttribute('data-filter');
            
            // Filtering logic
            if (filterValue === 'all') {
                renderBooks(booksData);
            } else {
                const filteredBooks = booksData.filter(book => book.categoryEng === filterValue);
                renderBooks(filteredBooks);
            }
        });
    });

    /* ==========================================================================
       4. Book Detail Modal Interaction
       ========================================================================== */
    // Each book's purchaseLinks (set in books.json/books.js) point directly to
    // that title's product detail page on each store, not a search results page.
    function getStoreLinks(book) {
        const links = book.purchaseLinks || {};
        return [
            { name: '교보문고', logo: 'assets/store-kyobo.svg', url: links.kyobo },
            { name: '예스24', logo: 'assets/store-yes24.png', url: links.yes24 },
            { name: '알라딘', logo: 'assets/store-aladin.jpg', url: links.aladin }
        ].filter(store => store.url);
    }

    function openBookModal(book) {
        const stores = getStoreLinks(book);
        const storeLinksHtml = stores.map(store => `
            <a class="store-link" href="${store.url}" target="_blank" rel="noopener noreferrer">
                <img src="${store.logo}" alt="${store.name}">
            </a>
        `).join('');

        modalBody.innerHTML = `
            <div class="book-detail-layout">
                <div class="book-detail-img">
                    <img src="${book.image}" alt="${book.title} 표지">
                </div>
                <div class="book-detail-content">
                    <span class="detail-category">${book.category}</span>
                    <h2 class="detail-title">${book.title}</h2>

                    <div class="detail-meta-list">
                        <div class="detail-meta-item"><strong>저자</strong> ${book.author}</div>
                        <div class="detail-meta-item"><strong>출간일</strong> ${book.date}</div>
                    </div>

                    <p class="detail-summary">“${book.summary}”</p>
                    <p class="detail-desc">${book.description}</p>

                    <div class="purchase-area">
                        <span class="store-links-desc"><i class="fa-solid fa-cart-shopping"></i> 온라인 서점에서 구매하기</span>
                        <div class="store-links-row">${storeLinksHtml}</div>
                    </div>
                </div>
            </div>
        `;

        bookModal.classList.add('active');
        bookModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden'; // block page scroll
    }

    function closeBookModal() {
        bookModal.classList.remove('active');
        bookModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = ''; // restore page scroll
    }

    modalClose.addEventListener('click', closeBookModal);
    modalBackdrop.addEventListener('click', closeBookModal);
    
    // Close modal with Escape Key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && bookModal.classList.contains('active')) {
            closeBookModal();
        }
    });

    /* ==========================================================================
       5. Interactive Manuscript Form Verification & Simulation
       ========================================================================== */
    submissionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Reset previous errors
        const formGroups = submissionForm.querySelectorAll('.form-group, .form-group-checkbox');
        formGroups.forEach(group => group.classList.remove('has-error'));
        
        let isValid = true;
        
        // Sender Name Check
        const nameInput = document.getElementById('senderName');
        if (!nameInput.value.trim()) {
            nameInput.parentElement.classList.add('has-error');
            isValid = false;
        }
        
        // Sender Phone Check (Basic Regex)
        const phoneInput = document.getElementById('senderPhone');
        const phoneRegex = /^\d{2,4}-\d{3,4}-\d{4}$|^\d{9,11}$/;
        if (!phoneInput.value.trim() || !phoneRegex.test(phoneInput.value.trim().replace(/\s/g, ''))) {
            phoneInput.parentElement.classList.add('has-error');
            isValid = false;
        }
        
        // Sender Email Check
        const emailInput = document.getElementById('senderEmail');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailInput.value.trim() || !emailRegex.test(emailInput.value.trim())) {
            emailInput.parentElement.classList.add('has-error');
            isValid = false;
        }
        
        // Inquiry Type Check
        const typeSelect = document.getElementById('inquiryType');
        if (!typeSelect.value) {
            typeSelect.parentElement.classList.add('has-error');
            isValid = false;
        }
        
        // Title Check
        const titleInput = document.getElementById('inquiryTitle');
        if (!titleInput.value.trim()) {
            titleInput.parentElement.classList.add('has-error');
            isValid = false;
        }
        
        // Message Check
        const messageInput = document.getElementById('inquiryMessage');
        if (!messageInput.value.trim()) {
            messageInput.parentElement.classList.add('has-error');
            isValid = false;
        }
        
        // Privacy Agree Check
        const privacyCheckbox = document.getElementById('privacyAgree');
        if (!privacyCheckbox.checked) {
            privacyCheckbox.parentElement.classList.add('has-error');
            isValid = false;
        }
        
        // If Valid, determine submission method based on connection protocol
        if (isValid) {
            btnSubmit.classList.add('loading');
            btnSubmit.disabled = true;
            
            if (window.location.protocol === 'file:') {
                // FormSubmit block local file:// paths, bypass by using mailto link fallback
                const subject = encodeURIComponent(`[홈페이지 문의/투고] ${nameInput.value.trim()}님의 메일입니다.`);
                const bodyText = encodeURIComponent(
                    `성함: ${nameInput.value.trim()}\n` +
                    `연락처: ${phoneInput.value.trim()}\n` +
                    `이메일: ${emailInput.value.trim()}\n` +
                    `문의 분야: ${typeSelect.options[typeSelect.selectedIndex].text}\n` +
                    `제목: ${titleInput.value.trim()}\n\n` +
                    `[상세 내용]\n${messageInput.value.trim()}`
                );
                
                const mailtoUrl = `mailto:contents@huddlingbooks.com?subject=${subject}&body=${bodyText}`;
                
                // Open default system mail client
                window.location.href = mailtoUrl;
                
                // Reset states and show a friendly modal guiding the user
                setTimeout(() => {
                    btnSubmit.classList.remove('loading');
                    btnSubmit.disabled = false;
                    
                    const modalTitle = alertModal.querySelector('h3');
                    const modalDesc = alertModal.querySelector('p');
                    if (modalTitle && modalDesc) {
                        modalTitle.innerText = "이메일 프로그램이 열렸습니다!";
                        modalDesc.innerHTML = "작성하신 내용이 메일 본문에 자동으로 채워졌습니다.<br>실행된 이메일 프로그램(Outlook, Gmail 등)에서 <strong>'보내기'</strong> 버튼을 클릭하시면 투고 접수가 최종 완료됩니다.";
                    }
                    
                    alertModal.classList.add('active');
                    alertModal.setAttribute('aria-hidden', 'false');
                    submissionForm.reset();
                }, 1000);
            } else {
                // Running on a HTTP server (e.g. http://localhost:8000)
                // Submit standard POST to FormSubmit.co
                const nextUrlInput = document.getElementById('nextUrl');
                nextUrlInput.value = window.location.href;
                
                const emailSubjectInput = document.getElementById('emailSubject');
                emailSubjectInput.value = `[홈페이지 문의/투고] ${nameInput.value.trim()}님의 메일입니다.`;
                
                submissionForm.submit();
            }
        }
    });

    // Close Success Alert
    function closeAlertModal() {
        alertModal.classList.remove('active');
        alertModal.setAttribute('aria-hidden', 'true');
    }
    
    alertClose.addEventListener('click', closeAlertModal);
    alertModalBackdrop.addEventListener('click', closeAlertModal);

    /* ==========================================================================
       6. Initialization Trigger
       ========================================================================== */
    fetchBooks();
});
