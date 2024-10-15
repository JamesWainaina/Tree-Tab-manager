function initialize() {
  let currentView = "sphere";
  let tabs = [];
  let filteredTabs = [];
  let sortOrder = "alphabetical"; // New sorting state

  // DOM elements
  const searchInput = document.getElementById("searchInput");
  const viewButtons = document.querySelectorAll(".view-button");
  const viewContainer = document.getElementById("viewContainer");
  const tabCountElement = document.getElementById("tabCount");

  // Add sort button to the UI
  const sortButton = document.createElement("button");
  sortButton.textContent = "Sort A-Z";
  sortButton.className = "sort-button";
  document.querySelector(".search-container").appendChild(sortButton);

  // Event listeners
  searchInput.addEventListener("input", handleSearch);
  viewButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setView(button.dataset.view);
    });
  });
  sortButton.addEventListener("click", toggleSort);

  // Initialize
  chrome.tabs.query({}, function (browserTabs) {
    tabs = browserTabs.map((tab) => ({
      id: tab.id,
      title: tab.title || "",
      url: tab.url,
      domain: extractDomain(tab.url),
      category: categorizeTab(tab.url),
      lastAccessed: "Just Now",
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
      console.error("Invalid URL:", url);
      return "unknown-domain";
    }
  }

  function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    filteredTabs = tabs.filter(
      (tab) =>
        tab.title.toLowerCase().includes(searchTerm) ||
        tab.domain.toLowerCase().includes(searchTerm)
    );
    renderCurrentView();
    updateTabCount();
  }

  function toggleSort() {
    sortOrder = sortOrder === "alphabetical" ? "reverse" : "alphabetical";
    sortButton.textContent =
      sortOrder === "alphabetical" ? "Sort A-Z" : "Sort Z-A";
    sortTabs();
    renderCurrentView();
  }

  function sortTabs() {
    tabs.sort((a, b) => {
      const comparison = a.title
        .toLowerCase()
        .localeCompare(b.title.toLowerCase());
      return sortOrder === "alphabetical" ? comparison : -comparison;
    });
    filteredTabs = [...tabs];
  }

  function setView(view) {
    currentView = view;
    viewButtons.forEach((button) => {
      button.classList.toggle("active", button.dataset.view === view);
    });
    renderCurrentView();
  }

  function renderCurrentView() {
    viewContainer.innerHTML = "";
    switch (currentView) {
      case "sphere":
        renderSphereView(filteredTabs, viewContainer);
        break;
      case "category":
        renderCategoryView(filteredTabs, viewContainer);
        break;
      case "timeline":
        renderTimelineView(filteredTabs, viewContainer);
        break;
    }
  }

  function updateTabCount() {
    tabCountElement.textContent = `${filteredTabs.length} tabs • Sorted ${sortOrder} • Last sync: Just now`;
  }

  // New removeTab function to remove tabs
  function removeTab(tabId) {
    chrome.tabs.remove(tabId, () => {
      // Update the tabs array and filteredTabs array
      tabs = tabs.filter((tab) => tab.id !== tabId);
      filteredTabs = filteredTabs.filter((tab) => tab.id !== tabId);

      // Re-render the current view and update the tab count
      renderCurrentView();
      updateTabCount();
    });
  }

  // Modified render functions to respect alphabetical order and include remove button

  function renderSphereView(filteredTabs, viewContainer) {
    const sphereDiv = document.createElement("div");
    sphereDiv.className = "sphere-view";

    const container = document.createElement("div");
    container.className = "sphere-container";

    filteredTabs.forEach((tab, index) => {
      const angle = (index / filteredTabs.length) * Math.PI * 2;
      const radius = 120;
      const x = Math.cos(angle) * radius + 160;
      const y = Math.sin(angle) * radius + 160;

      const tabNode = document.createElement("div");
      tabNode.className = "tab-node";
      tabNode.style.left = `${x}px`;
      tabNode.style.top = `${y}px`;
      tabNode.style.transform = "translate(-50%, -50%)";

      const truncatedTitle =
        tab.title.length > 20 ? tab.title.substring(0, 17) + "..." : tab.title;
      tabNode.innerHTML = `
        <div class="domain">${tab.domain}</div>
        <div class="title">${truncatedTitle}</div>
        <button class="remove-tab-button">X</button>  <!-- Add remove button -->
      `;

      // Activate tab when clicking on the tab node
      tabNode.querySelector(".domain, .title").addEventListener("click", () => {
        chrome.tabs.update(tab.id, { active: true });
      });

      // Handle tab removal
      tabNode
        .querySelector(".remove-tab-button")
        .addEventListener("click", (event) => {
          event.stopPropagation(); // Prevent triggering tab activation
          removeTab(tab.id); // Call the remove function
        });

      container.appendChild(tabNode);
    });

    sphereDiv.appendChild(container);
    viewContainer.appendChild(sphereDiv);
  }

  function renderCategoryView(filteredTabs, viewContainer) {
    const categories = [
      "productivity",
      "development",
      "entertainment",
      "social",
      "news",
      "shopping",
      "finance",
      "health",
      "education",
      "other",
    ];
    const categoryView = document.createElement("div");
    categoryView.className = "category-view";

    categories.forEach((category) => {
      const categoryTabs = filteredTabs.filter(
        (tab) => tab.category === category
      );
      if (categoryTabs.length === 0) return; // Skip empty categories

      const categoryCard = document.createElement("div");
      categoryCard.className = "category-card";

      const categoryTitle = document.createElement("h3");
      categoryTitle.textContent = `${
        category.charAt(0).toUpperCase() + category.slice(1)
      } (${categoryTabs.length})`;
      categoryTitle.style.cursor = "pointer"; // Indicate it's clickable

      categoryTitle.addEventListener("click", () => {
        const dropdown = categoryCard.querySelector(".dropdown");
        dropdown.style.display =
          dropdown.style.display === "block" ? "none" : "block"; // Toggle dropdown visibility
      });

      const dropdown = document.createElement("div");
      dropdown.className = "dropdown";
      dropdown.style.display = "none"; // Initially hide the dropdown

      categoryCard.appendChild(categoryTitle);
      categoryCard.appendChild(dropdown); // Append dropdown to category card

      categoryTabs.forEach((tab) => {
        const tabDiv = document.createElement("div");
        tabDiv.className = "tab-title";
        tabDiv.innerHTML = `
          <span class="tab-title-text">${tab.title}</span>
          <span class="tab-url-text">${tab.url}</span>
          <button class="remove-tab-button">X</button>  <!-- Add remove button -->
        `;

        tabDiv.querySelector(".tab-url-text").style.fontSize = "11px";

        tabDiv.addEventListener("mouseover", () => {
          tabDiv.querySelector(".tab-url-text").style.display = "inline"; // Show URL on hover
        });

        tabDiv.addEventListener("mouseout", () => {
          tabDiv.querySelector(".tab-url-text").style.display = "none"; // Hide URL when not hovering
        });

        tabDiv
          .querySelector(".remove-tab-button")
          .addEventListener("click", (event) => {
            event.stopPropagation(); // Prevent triggering tab activation
            removeTab(tab.id); // Call the remove function
          });

        dropdown.appendChild(tabDiv);
      });

      categoryView.appendChild(categoryCard);
    });

    viewContainer.appendChild(categoryView);
  }

  function renderTimelineView(filteredTabs, viewContainer) {
    const timeframes = ["Just Now", "Last Hour", "Today", "Yesterday"];
    const timelineView = document.createElement("div");
    timelineView.className = "timeline-view";

    timeframes.forEach((timeframe) => {
      const timeGroup = document.createElement("div");
      timeGroup.className = "time-group";

      const timeTitle = document.createElement("h3");
      timeTitle.textContent = timeframe;
      timeGroup.appendChild(timeTitle);

      const timeframeTabs = filteredTabs.filter(
        (tab) => tab.lastAccessed === timeframe
      );
      timeframeTabs.forEach((tab) => {
        const tabCard = document.createElement("div");
        tabCard.className = "tab-card";
        tabCard.innerHTML = `
              ${tab.title}
              <button class="remove-tab-button">X</button> <!-- Add remove button -->
            `;

        tabCard
          .querySelector(".remove-tab-button")
          .addEventListener("click", (event) => {
            event.stopPropagation(); // Prevent triggering tab activation
            removeTab(tab.id); // Call the remove function
          });

        tabCard.addEventListener("click", () => {
          chrome.tabs.update(tab.id, { active: true });
        });

        timeGroup.appendChild(tabCard);
      });

      timelineView.appendChild(timeGroup);
    });

    viewContainer.appendChild(timelineView);
  }

  function categorizeTab(url) {
    if (url.includes("youtube.com") || url.includes("netflix.com")) {
      return "entertainment";
    } else if (
      url.includes("github.com") ||
      url.includes("stackOverflow.com")
    ) {
      return "development";
    } else if (url.includes("linkedin.com")) {
      return "social";
    } else {
      return "other";
    }
  }
}

document.addEventListener("DOMContentLoaded", initialize);
