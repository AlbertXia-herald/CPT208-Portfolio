const pageId = document.body.dataset.page;
const nav = document.querySelector(".site-nav");
const navToggle = document.querySelector(".nav-toggle");

if (nav && pageId) {
  const activeLink = nav.querySelector(`[data-page="${pageId}"]`);
  if (activeLink) {
    activeLink.classList.add("is-active");
    activeLink.setAttribute("aria-current", "page");
  }
}

if (nav && navToggle) {
  navToggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });
}

const architectureButtons = document.querySelectorAll("[data-architecture-target]");
const architecturePanels = document.querySelectorAll("[data-architecture-panel]");
const architecturePopup = document.querySelector(".architecture-detail-panel");
const architecturePopupClose = document.querySelector(".architecture-popup-close");

if (architectureButtons.length && architecturePanels.length && architecturePopup) {
  const closeArchitecturePopup = () => {
    architecturePopup.hidden = true;
    architectureButtons.forEach((item) => {
      item.classList.remove("is-active");
      item.setAttribute("aria-pressed", "false");
    });
    architecturePanels.forEach((panel) => {
      panel.hidden = true;
      panel.classList.remove("is-active");
    });
  };

  architectureButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.architectureTarget;
      architecturePopup.hidden = false;

      architectureButtons.forEach((item) => {
        const isActive = item === button;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });

      architecturePanels.forEach((panel) => {
        const isActive = panel.dataset.architecturePanel === target;
        panel.hidden = !isActive;
        panel.classList.toggle("is-active", isActive);
      });
    });
  });

  if (architecturePopupClose) {
    architecturePopupClose.addEventListener("click", closeArchitecturePopup);
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !architecturePopup.hidden) {
      closeArchitecturePopup();
    }
  });
}

const imageTriggers = document.querySelectorAll("[data-full-image]");

if (imageTriggers.length) {
  const modal = document.createElement("div");
  modal.className = "image-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Large image preview");
  modal.innerHTML = `
    <div class="image-modal-panel">
      <div class="image-modal-toolbar" aria-label="Image zoom controls">
        <button class="image-modal-zoom" type="button" data-zoom="out" aria-label="Zoom out">-</button>
        <button class="image-modal-reset" type="button">Reset</button>
        <button class="image-modal-zoom" type="button" data-zoom="in" aria-label="Zoom in">+</button>
      </div>
      <button class="image-modal-close" type="button" aria-label="Close large image">&times;</button>
      <img src="" alt="">
    </div>
  `;
  document.body.appendChild(modal);

  const modalImage = modal.querySelector("img");
  const closeButton = modal.querySelector(".image-modal-close");
  const zoomButtons = modal.querySelectorAll("[data-zoom]");
  const resetButton = modal.querySelector(".image-modal-reset");
  let lastTrigger = null;
  let zoomLevel = 1;
  let panX = 0;
  let panY = 0;
  let isPanning = false;
  let panStartX = 0;
  let panStartY = 0;
  let startPanX = 0;
  let startPanY = 0;

  const applyZoom = () => {
    modalImage.style.transform = `translate(${panX}px, ${panY}px) scale(${zoomLevel})`;
    modal.dataset.zoomLevel = zoomLevel.toFixed(2);
    modal.classList.toggle("is-zoomed", zoomLevel > 1);
  };

  const setZoom = (nextZoom) => {
    zoomLevel = Math.min(3, Math.max(0.5, nextZoom));
    if (zoomLevel <= 1) {
      panX = 0;
      panY = 0;
    }
    applyZoom();
  };

  const resetView = () => {
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    applyZoom();
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modalImage.removeAttribute("src");
    modalImage.removeAttribute("style");
    zoomLevel = 1;
    panX = 0;
    panY = 0;
    isPanning = false;
    if (lastTrigger) {
      lastTrigger.focus();
    }
  };

  imageTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const image = trigger.querySelector("img");
      lastTrigger = trigger;
      modalImage.src = trigger.dataset.fullImage;
      modalImage.alt = image ? image.alt : "Large image preview";
      modalImage.draggable = false;
      resetView();
      modal.classList.add("is-open");
      closeButton.focus();
    });
  });

  zoomButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.zoom === "in" ? 1 : -1;
      setZoom(zoomLevel + direction * 0.25);
    });
  });

  resetButton.addEventListener("click", () => {
    resetView();
  });

  modalImage.addEventListener("wheel", (event) => {
    event.preventDefault();
    setZoom(zoomLevel + (event.deltaY < 0 ? 0.15 : -0.15));
  });

  modalImage.addEventListener("pointerdown", (event) => {
    if (zoomLevel <= 1) {
      return;
    }
    event.preventDefault();
    isPanning = true;
    panStartX = event.clientX;
    panStartY = event.clientY;
    startPanX = panX;
    startPanY = panY;
    modalImage.setPointerCapture(event.pointerId);
    modalImage.classList.add("is-panning");
  });

  modalImage.addEventListener("pointermove", (event) => {
    if (!isPanning) {
      return;
    }
    panX = startPanX + event.clientX - panStartX;
    panY = startPanY + event.clientY - panStartY;
    applyZoom();
  });

  const stopPanning = (event) => {
    if (!isPanning) {
      return;
    }
    isPanning = false;
    modalImage.classList.remove("is-panning");
    if (event.pointerId !== undefined) {
      try {
        modalImage.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture may already be released by the browser.
      }
    }
  };

  modalImage.addEventListener("pointerup", stopPanning);
  modalImage.addEventListener("pointercancel", stopPanning);
  modalImage.addEventListener("dragstart", (event) => {
    event.preventDefault();
  });

  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}

const textModalTriggers = document.querySelectorAll("[data-text-modal-target]");

if (textModalTriggers.length) {
  const modal = document.createElement("div");
  modal.className = "text-modal";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-label", "Evidence preview");
  modal.innerHTML = `
    <div class="text-modal-panel">
      <button class="text-modal-close" type="button" aria-label="Close evidence preview">&times;</button>
      <div class="text-modal-content"></div>
    </div>
  `;
  document.body.appendChild(modal);

  const closeButton = modal.querySelector(".text-modal-close");
  const modalContent = modal.querySelector(".text-modal-content");
  let lastTrigger = null;

  const closeModal = () => {
    modal.classList.remove("is-open");
    modalContent.innerHTML = "";
    if (lastTrigger) {
      lastTrigger.focus();
    }
  };

  textModalTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      const template = document.getElementById(trigger.dataset.textModalTarget);
      if (!template) {
        return;
      }
      lastTrigger = trigger;
      modalContent.innerHTML = template.innerHTML;
      modal.classList.add("is-open");
      closeButton.focus();
    });
  });

  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
    }
  });
}
