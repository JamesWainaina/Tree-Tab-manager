function initialize() {
  let currentView = 'sphere';
  let tabs = [];
  let filteredTabs = [];
  let sortOrder = 'alphabetical'; // New sorting state

  // DOM elements
  const searchInput = document.getElementById('searchInput');
  const viewButtons = document.querySelectorAll('.view-button');
  const viewContainer = document.getElementById('viewContainer');
  const tabCountElement = document.getElementById('tabCount');
  
  // Add sort button to the UI
  const sortButton = document.createElement('button');
  sortButton.textContent = 'Sort A-Z';
  sortButton.className = 'sort-button';
  document.querySelector('.search-container').appendChild(sortButton);

  // Event listeners
  searchInput.addEventListener('input', handleSearch);
  viewButtons.forEach(button => {
    button.addEventListener('click', () => {
      setView(button.dataset.view);
    });
  });
  sortButton.addEventListener('click', toggleSort);

  // Initialize
  chrome.tabs.query({}, function(browserTabs) {
    tabs = browserTabs.map(tab => ({
        id: tab.id,
        title: tab.title || '',
        url: tab.url,
        domain: extractDomain(tab.url),
        category: categorizeTab(tab.url),
        lastAccessed: "Just Now" 
    }));
    
    // Initially sort tabs alphabetically
    sortTabs();
    filteredTabs = [...tabs];
    renderCurrentView();
    updateTabCount();
});

  function extractDomain(url) {
    try {
      return new URL(url).hostname;
    } catch (e) {
      console.error('Invalid URL:', url);
      return 'unknown-domain';
    }
  }

  function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    filteredTabs = tabs.filter(tab => 
      tab.title.toLowerCase().includes(searchTerm) ||
      tab.domain.toLowerCase().includes(searchTerm)
    );
    renderCurrentView();
    updateTabCount();
  }

  function toggleSort() {
    sortOrder = sortOrder === 'alphabetical' ? 'reverse' : 'alphabetical';
    sortButton.textContent = sortOrder === 'alphabetical' ? 'Sort A-Z' : 'Sort Z-A';
    sortTabs();
    renderCurrentView();
  }

  function sortTabs() {
    tabs.sort((a, b) => {
      const comparison = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
      return sortOrder === 'alphabetical' ? comparison : -comparison;
    });
    filteredTabs = [...tabs];
  }

  function setView(view) {
    currentView = view;
    viewButtons.forEach(button => {
      button.classList.toggle('active', button.dataset.view === view);
    });
    renderCurrentView();
  }

  function renderCurrentView() {
    viewContainer.innerHTML = '';
    switch(currentView) {
      case 'sphere':
        renderSphereView(filteredTabs, viewContainer);
        break;
      case 'category':
        renderCategoryView(filteredTabs, viewContainer);
        break;
      case 'timeline':
        renderTimelineView(filteredTabs, viewContainer);
        break;
    }
  }

  function updateTabCount() {
    tabCountElement.textContent = `${filteredTabs.length} tabs • Sorted ${sortOrder} • Last sync: Just now`;
  }
}

// Modified render functions to respect alphabetical order

function renderSphereView(filteredTabs, viewContainer) {
  const sphereDiv = document.createElement('div');
  sphereDiv.className = 'sphere-view';
  
  const container = document.createElement('div');
  container.className = 'sphere-container';
  
  filteredTabs.forEach((tab, index) => {
    const angle = (index / filteredTabs.length) * Math.PI * 2;
    const radius = 120;
    const x = Math.cos(angle) * radius + 160;
    const y = Math.sin(angle) * radius + 160;
    
    const tabNode = document.createElement('div');
    tabNode.className = 'tab-node';
    tabNode.style.left = `${x}px`;
    tabNode.style.top = `${y}px`;
    tabNode.style.transform = 'translate(-50%, -50%)';
    
    // Show both domain and truncated title
    const truncatedTitle = tab.title.length > 20 ? tab.title.substring(0, 17) + '...' : tab.title;
    tabNode.innerHTML = `
      <div class="domain">${tab.domain}</div>
      <div class="title">${truncatedTitle}</div>
    `;
    
    tabNode.addEventListener('click', () => {
      chrome.tabs.update(tab.id, {active: true});
    });
    
    container.appendChild(tabNode);
  });
  
  sphereDiv.appendChild(container);
  viewContainer.appendChild(sphereDiv);
}


function renderCategoryView(filteredTabs, viewContainer) {
  const categories = ['productivity', 'development', 'entertainment', 'social', 'news', 'shopping', 'finance', 'health', 'education', 'other'];
  const categoryView = document.createElement('div');
  categoryView.className = 'category-view';
  
  categories.forEach(category => {
    const categoryTabs = filteredTabs.filter(tab => tab.category === category);
    if (categoryTabs.length === 0) return; // Skip empty categories
    
    const categoryCard = document.createElement('div');
    categoryCard.className = 'category-card';
    
    // Create a clickable category title
    const categoryTitle = document.createElement('h3');
    categoryTitle.textContent = `${category.charAt(0).toUpperCase() + category.slice(1)} (${categoryTabs.length})`;
    categoryTitle.style.cursor = 'pointer'; // Indicate it's clickable
    
    // Add a click event to the category title
    categoryTitle.addEventListener('click', () => {
      const dropdown = categoryCard.querySelector('.dropdown');
      dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block'; // Toggle dropdown visibility
    });

    // Dropdown container
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown';
    dropdown.style.display = 'none'; // Initially hide the dropdown

    categoryCard.appendChild(categoryTitle);
    categoryCard.appendChild(dropdown); // Append dropdown to category card

    categoryTabs.forEach(tab => {
      const tabDiv = document.createElement('div');
      tabDiv.className = 'tab-title';

      // Create content to display title and URL with border
      tabDiv.innerHTML = `
        <span class="tab-title-text">${tab.title}</span>
        <span class="tab-url-text">${tab.url}</span>
      `;

      // Apply border and font size
      tabDiv.style.border = '1px solid var(--border-color)'; // Add border
      tabDiv.style.padding = '4px'; // Optional: Add some padding
      tabDiv.style.margin = '4px 0'; // Optional: Add some margin
      tabDiv.querySelector('.tab-url-text').style.fontSize = '11px'; // Set font size

      // Toggle the display of the URL on hover
      tabDiv.addEventListener('mouseover', () => {
        tabDiv.querySelector('.tab-url-text').style.display = 'inline'; // Show URL on hover
      });

      tabDiv.addEventListener('mouseout', () => {
        tabDiv.querySelector('.tab-url-text').style.display = 'none'; // Hide URL when not hovering
      });

      tabDiv.addEventListener('click', () => {
        chrome.tabs.update(tab.id, { active: true });
      });
      dropdown.appendChild(tabDiv);
    });

    // Add hover effect to display dropdown
    categoryCard.addEventListener('mouseover', () => {
      dropdown.style.display = 'block'; // Show dropdown on hover
    });

    categoryCard.addEventListener('mouseout', () => {
      dropdown.style.display = 'none'; // Hide dropdown when not hovering
    });
    
    categoryView.appendChild(categoryCard);
  });
  
  viewContainer.appendChild(categoryView);
}


function renderTimelineView(filteredTabs, viewContainer) {
  const timeframes = ['Just Now', 'Last Hour', 'Today', 'Yesterday'];
  const timelineView = document.createElement('div');
  timelineView.className = 'timeline-view';
  
  timeframes.forEach(timeframe => {
      const timeGroup = document.createElement('div');
      timeGroup.className = 'time-group';
      
      const timeTitle = document.createElement('h3');
      timeTitle.textContent = timeframe;
      timeGroup.appendChild(timeTitle);
      
      const timeframeTabs = filteredTabs.filter(tab => tab.lastAccessed === timeframe);
      timeframeTabs.forEach(tab => {
          const tabCard = document.createElement('div');
          tabCard.className = 'tab-card';
          tabCard.textContent = tab.title;
          tabCard.addEventListener('click', () => {
              chrome.tabs.update(tab.id, {active: true});
          });
          timeGroup.appendChild(tabCard);
      });
      
      timelineView.appendChild(timeGroup);
  });
  
  viewContainer.appendChild(timelineView);
}


function categorizeTab(url) {
  const domain = new URL(url).hostname;
  const categoryMap = {
    'gmail.com': 'productivity',
    'docs.google.com': 'productivity',
    'github.com': 'development',
    'stackoverflow.com': 'development',
    'youtube.com': 'entertainment',
    'twitter.com': 'social',
    'cnn.com': 'news',
    'bbc.com': 'news',
    'amazon.com': 'shopping',
    'ebay.com': 'shopping',
    'bankofamerica.com': 'finance',
    'chase.com': 'finance',
    'webmd.com': 'health',
    'mayoclinic.org': 'health',
    'coursera.org': 'education',
    'edx.org': 'education',
    'linkedin.com': 'social',
    'facebook.com': 'social',
    'netflix.com': 'entertainment',
    'hulu.com': 'entertainment'
  };

  for (const [key, value] of Object.entries(categoryMap)) {
    if (domain.includes(key)) {
      return value;
    }
  }
  return 'other';
}

// Call the initialize function to set up the extension
initialize();