(function () {
  "use strict";

  var LEFT_ARROW_SVG =
    '<svg width="11" height="20" viewBox="0 0 11 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0.96476L11 19.0353C11 19.8904 9.96356 20.326 9.34818 19.7129L0.279353 10.6777C-0.0931162 10.3066 -0.0931163 9.69347 0.279353 9.32222L9.34818 0.286953C9.96356 -0.325993 11 0.109636 11 0.96476Z" fill="currentColor"/></svg>';
  var RIGHT_ARROW_SVG =
    '<svg width="11" height="20" viewBox="0 0 11 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.32057e-07 0.964762L4.21688e-08 19.0353C4.79022e-09 19.8904 1.03644 20.326 1.65182 19.7129L10.7206 10.6777C11.0931 10.3066 11.0931 9.69347 10.7206 9.32222L1.65182 0.286955C1.03644 -0.32599 8.69435e-07 0.109639 8.32057e-07 0.964762Z" fill="currentColor"/></svg>';

  function readProducts() {
    var el = document.getElementById("druni-perfumes-json");
    if (!el || !el.textContent) return [];
    try {
      var parsed = JSON.parse(el.textContent);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error("No se pudo parsear druni-perfumes-json", err);
      return [];
    }
  }

  function formatPrice(value) {
    var number = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(number)) return "";
    return (
      "€" +
      number.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  function getCategoryLabel(categoryRaw) {
    if (!categoryRaw) return "PERFUMERIA";
    var s = String(categoryRaw).trim();
    if (/^[a-f0-9]{24,32}$/i.test(s)) return "PERFUMERÍA";
    var segments = s
      .split(">")
      .map(function (segment) {
        return segment.trim();
      })
      .filter(Boolean);
    if (segments.length === 0) return "PERFUMERIA";
    var last = segments[segments.length - 1];
    if (/^[a-f0-9]{24,32}$/i.test(last)) return "PERFUMERÍA";
    return last.toUpperCase();
  }

  function stripLeadingCategoryId(name) {
    return String(name || "")
      .replace(/^[a-f0-9]{24,32}\s+/i, "")
      .trim();
  }

  function normalizeAssetUrl(url) {
    var s = String(url || "").trim();
    if (!s) return s;
    if (/^https?:\/\//i.test(s)) return s;
    if (s.startsWith("/")) return s;
    if (s.startsWith("assets/")) return "/" + s;
    return s;
  }

  function productThumbImage(card) {
    var thumb = card.querySelector(".cs_product_thumb");
    if (!thumb) return null;
    var ch = thumb.children;
    for (var i = 0; i < ch.length; i++) {
      if (ch[i].tagName === "IMG") return ch[i];
    }
    var imgs = thumb.querySelectorAll("img");
    for (var j = 0; j < imgs.length; j++) {
      var src = imgs[j].getAttribute("src") || "";
      if (src.indexOf("/icons/") === -1 && src.indexOf("icons/") === -1) {
        return imgs[j];
      }
    }
    return thumb.querySelector("img");
  }

  function sanitizeText(text) {
    return String(text || "").replace(/\s+/g, " ").trim();
  }

  function safeCssUrl(url) {
    return String(url || "")
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"');
  }

  var PLACEHOLDER_IMG = "/assets/images/product_1.png";

  function setProductCardVisible(card, visible) {
    var wrap = card.closest(".cs_grid_col");
    var el = wrap || card;
    el.style.display = visible ? "" : "none";
  }

  /** Rellena huecos de la última página (sin ocultar celdas): imagen genérica + texto de marca. */
  function applyPlaceholderToCard(card) {
    setProductCardVisible(card, true);
    var thumbImg = productThumbImage(card);
    if (thumbImg) {
      thumbImg.src = PLACEHOLDER_IMG;
      thumbImg.removeAttribute("srcset");
      thumbImg.alt = "esenciaperfume.com";
      thumbImg.loading = "lazy";
      thumbImg.onerror = null;
    }
    var title = card.querySelector(".cs_product_title");
    if (title) {
      var titleLink = title.querySelector("a");
      var placeholderTitle = "Más novedades muy pronto";
      if (titleLink) {
        titleLink.textContent = placeholderTitle;
        titleLink.setAttribute("href", "/shop");
      } else {
        title.textContent = placeholderTitle;
      }
    }
    var categoryAnchor = card.querySelector(".cs_product_category a");
    if (categoryAnchor) {
      categoryAnchor.textContent = "Esenciaperfume";
      categoryAnchor.setAttribute("href", "/shop");
    }
    var price = card.querySelector(".cs_product_price");
    if (price) {
      price.innerHTML = "";
    }
    var link = card.querySelector(".cs_product_link");
    if (link) {
      link.setAttribute("href", "/shop");
    }
    var label = card.querySelector(".cs_label span");
    if (label) {
      label.textContent = "";
    }
  }

  function applyProductToCard(card, product) {
    if (!product) {
      applyPlaceholderToCard(card);
      return;
    }
    setProductCardVisible(card, true);

    var detailHref = "/product/" + encodeURIComponent(String(product.sku));
    var displayName = stripLeadingCategoryId(product.name);
    var imgUrl = normalizeAssetUrl(product.imageUrl);
    var thumbImg = productThumbImage(card);
    if (thumbImg && imgUrl) {
      thumbImg.onerror = function () {
        this.onerror = null;
        this.src = PLACEHOLDER_IMG;
      };
      thumbImg.src = imgUrl;
      thumbImg.removeAttribute("srcset");
      thumbImg.alt = sanitizeText(displayName);
      thumbImg.loading = "lazy";
      thumbImg.referrerPolicy = "no-referrer";
    }

    var title = card.querySelector(".cs_product_title");
    if (title) {
      var titleLink = title.querySelector("a");
      if (titleLink) {
        titleLink.textContent = sanitizeText(displayName);
        titleLink.setAttribute("href", detailHref);
      } else {
        title.textContent = sanitizeText(displayName);
      }
    }

    var categoryAnchor = card.querySelector(".cs_product_category a");
    if (categoryAnchor) {
      categoryAnchor.textContent = getCategoryLabel(product.category);
      categoryAnchor.setAttribute("href", "/shop");
    }

    var price = card.querySelector(".cs_product_price");
    if (price) {
      var current = formatPrice(product.priceCurrent);
      var old = product.priceOriginal ? formatPrice(product.priceOriginal) : "";
      price.innerHTML = old ? current + " <small>" + old + "</small>" : current;
    }

    var link = card.querySelector(".cs_product_link");
    if (link) {
      link.setAttribute("href", detailHref);
    }

    var label = card.querySelector(".cs_label span");
    if (label) {
      if (product.discountPct) {
        label.textContent = Math.round(product.discountPct) + "%";
      } else {
        label.textContent = "";
      }
    }
  }

  function applyToProductPage(products, pageIndex1, pageSize) {
    var cards = document.querySelectorAll(".cs_product_card");
    if (!cards.length) return;

    var start = (pageIndex1 - 1) * pageSize;
    for (var i = 0; i < cards.length; i++) {
      applyProductToCard(cards[i], products[start + i]);
    }
  }

  function updateResultsSummaryPaged(total, pageIndex1, pageSize) {
    if (!total) return;
    var start = (pageIndex1 - 1) * pageSize + 1;
    var end = Math.min(pageIndex1 * pageSize, total);
    if (start > end) start = end;

    var box = document.querySelector(".cs_filter_heading_right .cs_view_box");
    if (!box) return;
    var spans = box.querySelectorAll("span");
    for (var i = 0; i < spans.length; i++) {
      var t = spans[i].textContent || "";
      if (/showing\s+\d/i.test(t) || /mostrando\s+\d/i.test(t)) {
        spans[i].textContent =
          "Showing " + start + " - " + end + " of " + total + " results";
        return;
      }
    }
  }

  function applyToBanners(products) {
    var selectors = [
      ".cs_banner.cs_bg_filed[data-src]",
      ".cs_breadcamp_wrap.cs_bg_filed[data-src]",
      ".cs_product_card.cs_style_8.cs_bg_filed[data-src]",
    ];
    var banners = document.querySelectorAll(selectors.join(","));
    if (!banners.length || !products.length) return;

    banners.forEach(function (banner, index) {
      var product = products[index % products.length];
      var imgUrl = normalizeAssetUrl(product.imageUrl);
      banner.setAttribute("data-src", imgUrl);
      banner.style.backgroundImage = 'url("' + safeCssUrl(imgUrl) + '")';

      var title =
        banner.querySelector(".cs_banner_title") ||
        banner.querySelector(".cs_product_title");
      if (title) title.textContent = sanitizeText(stripLeadingCategoryId(product.name));
    });
  }

  /** Páginas a mostrar: 1 … ventana alrededor de current … última */
  function visiblePageNumbers(current, total) {
    if (total <= 1) return [1];
    var pages = new Set();
    pages.add(1);
    pages.add(total);
    for (var d = -2; d <= 2; d++) {
      var p = current + d;
      if (p >= 1 && p <= total) pages.add(p);
    }
    var sorted = Array.from(pages).sort(function (a, b) {
      return a - b;
    });
    var out = [];
    for (var i = 0; i < sorted.length; i++) {
      if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("ellipsis");
      out.push(sorted[i]);
    }
    return out;
  }

  function buildPaginationHtml(current, totalPages) {
    var items = visiblePageNumbers(current, totalPages);
    var parts = [];
    parts.push(
      '<li><a href="#" class="cs_pagination_arrow cs_pagination_arrow_left cs_center cs_accent_color" aria-label="Anterior">' +
        LEFT_ARROW_SVG +
        "</a></li>",
    );
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it === "ellipsis") {
        parts.push(
          '<li><span class="cs_pagination_item cs_center" aria-hidden="true">...</span></li>',
        );
      } else {
        var active = it === current ? " active" : "";
        parts.push(
          '<li><a class="cs_pagination_item cs_center' +
            active +
            '" href="#" data-page="' +
            it +
            '">' +
            it +
            "</a></li>",
        );
      }
    }
    parts.push(
      '<li><a href="#" class="cs_pagination_arrow cs_pagination_arrow_right cs_center cs_accent_color" aria-label="Siguiente">' +
        RIGHT_ARROW_SVG +
        "</a></li>",
    );
    return parts.join("");
  }

  function renderPaginationDom(st) {
    var ul = document.querySelector(".cs_pagination_box");
    if (!ul) return;
    if (st.totalPages <= 1) {
      ul.innerHTML = "";
      ul.style.display = "none";
      return;
    }
    ul.style.display = "";
    ul.innerHTML = buildPaginationHtml(st.currentPage, st.totalPages);
  }

  function scrollCatalogTop() {
    var c = document.querySelector(".cs_product_card");
    if (c && typeof c.scrollIntoView === "function") {
      c.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function getCatalogState() {
    return window.__druniCatalog;
  }

  function renderDruniCatalogPage(opts) {
    var o = opts || {};
    var st = getCatalogState();
    if (!st || !st.products || !st.products.length) return;

    if (st.currentPage > st.totalPages) st.currentPage = st.totalPages;
    if (st.currentPage < 1) st.currentPage = 1;

    applyToProductPage(st.products, st.currentPage, st.pageSize);
    updateResultsSummaryPaged(
      st.products.length,
      st.currentPage,
      st.pageSize,
    );
    renderPaginationDom(st);

    if (o.scroll) scrollCatalogTop();
  }

  function wireCatalogPagination() {
    if (window.__druniPaginationDelegation) return;
    window.__druniPaginationDelegation = true;

    document.addEventListener(
      "click",
      function (e) {
        var box = e.target.closest(".cs_pagination_box");
        if (!box) return;

        var st = getCatalogState();
        if (!st || !st.products || !st.products.length) return;

        var link = e.target.closest("a");
        if (!link) return;

        e.preventDefault();

        if (link.classList.contains("cs_pagination_arrow_left")) {
          if (st.currentPage > 1) {
            st.currentPage--;
            renderDruniCatalogPage({ scroll: true });
          }
          return;
        }
        if (link.classList.contains("cs_pagination_arrow_right")) {
          if (st.currentPage < st.totalPages) {
            st.currentPage++;
            renderDruniCatalogPage({ scroll: true });
          }
          return;
        }
        if (link.classList.contains("cs_pagination_item")) {
          var p = parseInt(link.getAttribute("data-page"), 10);
          if (
            Number.isFinite(p) &&
            p >= 1 &&
            p <= st.totalPages &&
            p !== st.currentPage
          ) {
            st.currentPage = p;
            renderDruniCatalogPage({ scroll: true });
          }
        }
      },
      true,
    );
  }

  function bootstrapDruniCatalog() {
    var products = readProducts();
    if (!products.length) return;

    var cards = document.querySelectorAll(".cs_product_card");
    var pageSize = cards.length || 16;
    var totalPages = Math.max(1, Math.ceil(products.length / pageSize));

    window.__druniCatalog = {
      products: products,
      pageSize: pageSize,
      currentPage: 1,
      totalPages: totalPages,
    };

    applyToBanners(products);
    renderDruniCatalogPage({ scroll: false });
    wireCatalogPagination();
  }

  function run() {
    bootstrapDruniCatalog();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
  window.addEventListener("load", run);
})();
