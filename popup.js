function initialize() {
  let currentView = 'sphere';
  let tabs = [];
  let filteredTabs = [];

  // DOM elements
  const searchInput = document.getElementById('searchInput');
  const viewButtons = document.querySelectorAll('.view-button');
  const viewContainer = document.getElementById('viewContainer');
  const tabCountElement = document.getElementById('tabCount');

  // Event listeners
  searchInput.addEventListener('input', handleSearch);
  viewButtons.forEach(button => {
    button.addEventListener('click', () => {
      setView(button.dataset.view);
    });
  });

  // Initialize
  chrome.tabs.query({}, function(browserTabs) {
    tabs = browserTabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      domain: new URL(tab.url).hostname,
      category: categorizeTab(tab.url),
      lastAccessed: "Just now" // In a real extension, you'd track this
    }));
    filteredTabs = [...tabs];
    renderCurrentView();
    updateTabCount();
  });

  function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    filteredTabs = tabs.filter(tab => 
      tab.title.toLowerCase().includes(searchTerm) ||
      tab.domain.toLowerCase().includes(searchTerm)
    );
    renderCurrentView();
    updateTabCount();
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
    tabCountElement.textContent = `${filteredTabs.length} tabs • Last sync: Just now`;
  }
}

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
    tabNode.textContent = tab.domain;
    tabNode.addEventListener('click', () => {
      chrome.tabs.update(tab.id, {active: true});
    });
    
    container.appendChild(tabNode);
  });
  
  sphereDiv.appendChild(container);
  viewContainer.appendChild(sphereDiv);
}

function renderCategoryView(filteredTabs, viewContainer) {
  const categories = ['productivity', 'development', 'entertainment', 'social'];
  const categoryView = document.createElement('div');
  categoryView.className = 'category-view';
  
  categories.forEach(category => {
    const categoryCard = document.createElement('div');
    categoryCard.className = 'category-card';
    
    const categoryTitle = document.createElement('h3');
    categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    categoryCard.appendChild(categoryTitle);
    
    const categoryTabs = filteredTabs.filter(tab => tab.category === category);
    categoryTabs.forEach(tab => {
      const tabDiv = document.createElement('div');
      tabDiv.className = 'tab-title';
      tabDiv.textContent = tab.title;
      tabDiv.addEventListener('click', () => {
        chrome.tabs.update(tab.id, {active: true});
      });
      categoryCard.appendChild(tabDiv);
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
    
    const timeframeTabs = filteredTabs.filter(tab => tab.lastAccessed === timeframe.toLowerCase());
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
  if (domain.includes('gmail.com') || domain.includes('docs.google.com')) return 'productivity';
  if (domain.includes('github.com') || domain.includes('stackoverflow.com')) return 'development';
  if (domain.includes('youtube.com')) return 'entertainment';
  if (domain.includes('twitter.com')) return 'social';
  return 'other';
}

// Call the initialize function to set up the extension
initialize();