document.addEventListener('DOMContentLoaded', () => {
    // Dynamic Footer Year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Make Logo Clickable to Return Home
    const logo = document.querySelector('.navbar-brand');
    if (logo) {
        logo.style.cursor = 'pointer';
        logo.addEventListener('click', () => {
            window.location.href = '/';
        });
    }

    const dropzone = document.getElementById('drop-zone');
    const browseButton = document.getElementById('browse');
    let file;

    if (dropzone) {
        dropzone.addEventListener('drop', (event) => {
            event.preventDefault();
            dropzone.classList.remove('dragover');
            if (event.dataTransfer.files.length > 0) {
                validateAndUpload(event.dataTransfer.files[0]);
            }
        });

        dropzone.addEventListener('dragover', (event) => {
            event.preventDefault();
            dropzone.classList.add('dragover');
        });

        dropzone.addEventListener('dragleave', (event) => {
            event.preventDefault();
            dropzone.classList.remove('dragover');
        });
    }

    if (browseButton) {
        browseButton.addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'video/*';
            fileInput.click();
            fileInput.addEventListener('change', (event) => {
                if (event.target.files.length > 0) {
                    validateAndUpload(event.target.files[0]);
                }
            });
        });
    }

    function validateAndUpload(selectedFile) {
        if (selectedFile.type.startsWith('video/') && selectedFile.size <= 50 * 1024 * 1024) {
            file = selectedFile;
            handleFileUpload();
        } else {
            file = null;
            alert('Please upload a valid video file (max 50MB).');
        }
    }

    async function handleFileUpload() {
        showLoadingState();

        try {
            const fileData = new FormData();
            fileData.append('video', file);

            const response = await fetch('/search', {
                method: 'POST',
                body: fileData,
            });

            if (!response.ok) {
                throw new Error(`Server status ${response.status}`);
            }

            const data = await response.json();
            console.log('Server response:', data);

            // Extract the list array returned by Express (res.json({'list': urlList}))
            const urls = data.list || [];
            renderSearchResults(file.name, urls);

        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to process video search.');
            window.location.reload();
        }
    }

    function showLoadingState() {
        const mainContent = document.querySelector('main');
        if (!mainContent) return;

        mainContent.innerHTML = `
            <div style="text-align: center; padding: 4rem 1rem;">
                <span class="material-symbols-outlined" style="font-size: 48px; animation: spin 1s linear infinite;">progress_activity</span>
                <h2 style="margin-top: 1rem;">Analyzing Video Frames...</h2>
                <p style="color: #666;">Extracting keyframes and searching web sources.</p>
            </div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;
    }

    function getDomainName(url) {
        try {
            return new URL(url).hostname.replace('www.', '');
        } catch {
            return 'Web Source';
        }
    }

    function getThumbnailUrl(url) {
        // 1. YouTube High-Res Video Thumbnail
        if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
            const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/);
            if (match && match[1]) {
                return {
                    type: 'youtube',
                    src: `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
                };
            }
        }
        
        // 2. Instant Site Logo for Reddit & All Other Websites (Google Favicon API)
        try {
            const domain = new URL(url).hostname;
            return {
                type: 'favicon',
                src: `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
            };
        } catch {
            return { type: 'fallback', src: null };
        }
    }

    function renderSearchResults(filename, urlsArray) {
        const mainContent = document.querySelector('main');
        if (!mainContent) return;

        const urls = Array.isArray(urlsArray) ? urlsArray : [];
        let cardsHtml = '';

        if (urls.length === 0) {
            cardsHtml = `
                <div style="text-align: center; padding: 3rem; background: #fff; border-radius: 8px; border: 1px solid #e0e0e0;">
                    <h3>No Matching Webpages Found</h3>
                    <p style="color: #666;">We could not locate direct webpage sources matching these frames.</p>
                </div>
            `;
        } else {
            cardsHtml = urls.map(url => {
                const domain = getDomainName(url);
                const thumbnail = getThumbnailUrl(url);

                const mediaHtml = thumbnail.type === 'youtube'
                    ? `<img 
                         src="${thumbnail.src}" 
                         alt="Video Thumbnail" 
                         style="width: 100%; height: 100%; object-fit: cover; display: block;" 
                       />`
                    : `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: #f8f9fa;">
                         <img 
                           src="${thumbnail.src}" 
                           alt="${domain} Logo" 
                           style="width: 54px; height: 54px; object-fit: contain;"
                           onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'material-symbols-outlined\\' style=\\'font-size: 36px; color: #888;\\'>public</span>';"
                         />
                       </div>`;

                return `
                    <article style="display: flex; flex-direction: row; align-items: center; gap: 16px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; padding: 16px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
                      <div style="width: 160px; height: 100px; min-width: 160px; flex-shrink: 0; border-radius: 8px; overflow: hidden; background: #f0f2f5;">
                        ${mediaHtml}
                      </div>
                      <div style="flex: 1; min-width: 0;">
                        <h3 style="margin: 0 0 8px 0; font-size: 0.95rem; line-height: 1.4; word-break: break-all;">
                          <a href="${url}" target="_blank" rel="noopener noreferrer" style="color: #1a0dab; text-decoration: none;">${url}</a>
                        </h3>
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
                          <span style="font-weight: 600; color: #4d5156; font-size: 0.85rem;">${domain}</span>
                          <span style="background: #e6f4ea; color: #137333; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">Match Found</span>
                        </div>
                        <a href="${url}" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 6px; background: #1a73e8; color: #ffffff; padding: 6px 14px; border-radius: 6px; text-decoration: none; font-size: 0.85rem; font-weight: 500;">
                          <span class="material-symbols-outlined" style="font-size: 16px;">open_in_new</span>
                          View Source
                        </a>
                      </div>
                    </article>
                `;
            }).join('');
        }

        mainContent.innerHTML = `
          <div style="max-width: 800px; margin: 0 auto; padding: 20px 16px;">
            <div style="display: flex; align-items: center; gap: 8px; background: #f1f3f4; padding: 8px 16px; border-radius: 24px; margin-bottom: 8px;">
              <span class="material-symbols-outlined" style="color: #5f6368;">search</span>
              <input type="text" value="${filename}" readonly style="border: none; background: transparent; width: 100%; font-size: 0.95rem; color: #202124; outline: none;">
              <button onclick="window.location.reload()" title="Upload New" style="border: none; background: transparent; cursor: pointer; display: flex; align-items: center; color: #5f6368;">
                <span class="material-symbols-outlined">upload</span>
              </button>
            </div>
            <p style="color: #5f6368; font-size: 0.85rem; margin-bottom: 24px; padding-left: 8px;">
              Results for: <strong>${filename}</strong>
            </p>

            <div class="results-container">
              ${cardsHtml}
            </div>
          </div>
        `;
    }
});